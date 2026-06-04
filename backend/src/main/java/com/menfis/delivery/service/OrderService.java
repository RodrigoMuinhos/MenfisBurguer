package com.menfis.delivery.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menfis.delivery.domain.DeliveryType;
import com.menfis.delivery.domain.OrderStatus;
import com.menfis.delivery.domain.PaymentMethod;
import com.menfis.delivery.dto.ApiDtos.CreateOrderRequest;
import com.menfis.delivery.dto.ApiDtos.OrderItemRequest;
import com.menfis.delivery.dto.ApiDtos.OrderResponse;
import com.menfis.delivery.dto.ApiDtos.StatusResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
  private static final BigDecimal DELIVERY_FEE = new BigDecimal("5.10");
  private static final BigDecimal SERVICE_FEE = new BigDecimal("0.99");

  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;
  private final AuditService audit;
  private final OrderEventService events;

  public OrderService(JdbcTemplate jdbc, ObjectMapper mapper, AuditService audit, OrderEventService events) {
    this.jdbc = jdbc;
    this.mapper = mapper;
    this.audit = audit;
    this.events = events;
  }

  @Transactional
  public OrderResponse create(CreateOrderRequest request) {
    if (request.idempotencyKey() != null && !request.idempotencyKey().isBlank()) {
      OrderResponse existing = findByIdempotencyKey(request.idempotencyKey());
      if (existing != null) return existing;
    }

    long number = jdbc.queryForObject("select nextval('order_number_seq')", Long.class);
    String id = "#" + number;
    PriceResult price = calculate(request.items());
    BigDecimal deliveryFee = request.deliveryType() == DeliveryType.DELIVERY ? DELIVERY_FEE : BigDecimal.ZERO;
    BigDecimal grossTotal = price.subtotal().add(deliveryFee).add(SERVICE_FEE);
    CouponResult coupon = applyCoupon(request.couponCode(), request.couponDiscount(), grossTotal);
    BigDecimal total = grossTotal.subtract(coupon.discount()).max(new BigDecimal("1.00"));
    OrderStatus status = request.paymentMethod() == PaymentMethod.PRESENCIAL ? OrderStatus.RECEIVED : OrderStatus.PENDING_PAYMENT;
    OffsetDateTime confirmedAt = status == OrderStatus.RECEIVED ? OffsetDateTime.now() : null;
    String itemsJson = toJson(price.items());

    jdbc.update(
      """
      insert into orders (
        id, number, items, delivery_type, customer_phone, customer_address,
        subtotal, delivery_fee, total, payment_provider, payment_method, payment_status,
        timestamp, status, idempotency_key, confirmed_at, coupon_code, discount_total, updated_at
      )
      values (?, ?, ?::jsonb, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())
      """,
      id,
      number,
      itemsJson,
      request.deliveryType().name(),
      request.customerPhone(),
      request.customerAddress(),
      price.subtotal(),
      deliveryFee,
      total,
      request.paymentMethod() == PaymentMethod.PRESENCIAL ? null : "MERCADO_PAGO",
      request.paymentMethod().name(),
      request.paymentMethod() == PaymentMethod.PRESENCIAL ? "not_required" : "pending",
      System.currentTimeMillis(),
      status.name(),
      cleanIdempotency(request.idempotencyKey()),
      confirmedAt,
      coupon.code(),
      coupon.discount()
    );

    for (Map<String, Object> item : price.items()) {
      jdbc.update(
        """
        insert into order_items(order_id, product_id, item_type, name, quantity, unit_price, total_price, metadata)
        values (?, ?, ?, ?, ?, ?, ?, ?::jsonb)
        """,
        id,
        item.get("productId"),
        "PRODUCT",
        item.get("name"),
        item.get("quantity"),
        item.get("unitPrice"),
        item.get("totalPrice"),
        toJson(item)
      );
    }

    jdbc.update(
      "insert into order_status_history(order_id, from_status, to_status, changed_by, reason) values (?, null, ?, ?, ?)",
      id,
      status.name(),
      "system",
      "order_created"
    );
    audit.log("system", "ORDER_CREATED", "ORDER", id, Map.of("total", total, "status", status.name()));
    OrderResponse created = get(id);
    events.publish(id, created);
    return created;
  }

  public OrderResponse get(String id) {
    return jdbc.queryForObject(
      """
      select id, number, items, delivery_type, customer_phone, customer_address,
        subtotal, delivery_fee, total, payment_provider, payment_method, payment_status,
        payment_id, status, paid_at, confirmed_at
      from orders where id = ?
      """,
      this::mapOrder,
      id
    );
  }

  public StatusResponse status(String id) {
    return jdbc.queryForObject(
      "select id, status, paid_at, confirmed_at from orders where id = ?",
      (rs, rowNum) -> new StatusResponse(rs.getString("id"), rs.getString("status"), offset(rs, "paid_at"), offset(rs, "confirmed_at")),
      id
    );
  }

  @Transactional
  public OrderResponse changeStatus(String id, OrderStatus toStatus, String actor, String reason) {
    String from = jdbc.queryForObject("select status from orders where id = ?", String.class, id);
    if (!canTransition(OrderStatus.valueOf(from), toStatus)) {
      throw new IllegalArgumentException("invalid_status_transition:" + from + "_to_" + toStatus);
    }

    jdbc.update(
      """
      update orders set status = ?, updated_at = now(),
        confirmed_at = case when ? = 'RECEIVED' and confirmed_at is null then now() else confirmed_at end
      where id = ?
      """,
      toStatus.name(),
      toStatus.name(),
      id
    );
    jdbc.update(
      "insert into order_status_history(order_id, from_status, to_status, changed_by, reason) values (?, ?, ?, ?, ?)",
      id,
      from,
      toStatus.name(),
      actor == null ? "system" : actor,
      reason
    );
    audit.log(actor == null ? "system" : actor, "ORDER_STATUS_CHANGED", "ORDER", id, Map.of("from", from, "to", toStatus.name()));
    OrderResponse updated = get(id);
    events.publish(id, updated);
    return updated;
  }

  @Transactional
  public void markPaid(String orderId, String providerPaymentId, String providerStatus) {
    String normalized = providerStatus == null ? "unknown" : providerStatus;
    boolean approved =
      "approved".equalsIgnoreCase(normalized) ||
      "PAID".equalsIgnoreCase(normalized) ||
      "processed".equalsIgnoreCase(normalized) ||
      "accredited".equalsIgnoreCase(normalized);
    boolean failed =
      "rejected".equalsIgnoreCase(normalized) ||
      "failed".equalsIgnoreCase(normalized) ||
      "cancelled".equalsIgnoreCase(normalized) ||
      "canceled".equalsIgnoreCase(normalized) ||
      "expired".equalsIgnoreCase(normalized) ||
      "refunded".equalsIgnoreCase(normalized) ||
      "charged_back".equalsIgnoreCase(normalized);
    OrderStatus target = approved ? OrderStatus.RECEIVED : failed ? OrderStatus.PAYMENT_FAILED : OrderStatus.PENDING_PAYMENT;
    String previous = jdbc.queryForObject("select status from orders where id = ?", String.class, orderId);

    jdbc.update(
      """
      update orders set payment_status = ?, payment_id = ?, paid_at = case when ? then now() else paid_at end,
        confirmed_at = case when ? then now() else confirmed_at end, status = ?, updated_at = now()
      where id = ?
      """,
      providerStatus,
      providerPaymentId,
      approved,
      approved,
      target.name(),
      orderId
    );
    jdbc.update(
      "insert into order_status_history(order_id, from_status, to_status, changed_by, reason) values (?, ?, ?, 'mercado_pago', ?)",
      orderId,
      previous,
      target.name(),
      approved ? "PAYMENT_APPROVED" : failed ? "PAYMENT_FAILED" : "PAYMENT_PENDING"
    );
    audit.log(
      "mercado_pago",
      approved ? "PAYMENT_APPROVED" : failed ? "PAYMENT_FAILED" : "PAYMENT_PENDING",
      "ORDER",
      orderId,
      Map.of("paymentId", providerPaymentId, "status", normalized)
    );
    events.publish(orderId, get(orderId));
  }

  private PriceResult calculate(List<OrderItemRequest> requestedItems) {
    List<Map<String, Object>> priced = requestedItems.stream().map(item -> {
      Map<String, Object> product = jdbc.queryForMap(
        "select id, name, base_price from products where id = ? and active = true",
        item.productId()
      );
      BigDecimal unit = (BigDecimal) product.get("base_price");
      BigDecimal addonsTotal = BigDecimal.ZERO;
      if (item.addonIds() != null) {
        for (String addonId : item.addonIds()) {
          addonsTotal = addonsTotal.add(jdbc.queryForObject("select price from addons where id = ? and active = true", BigDecimal.class, addonId));
        }
      }
      BigDecimal unitPrice = unit.add(addonsTotal);
      BigDecimal total = unitPrice.multiply(BigDecimal.valueOf(item.quantity()));
      return Map.<String, Object>of(
        "productId", product.get("id"),
        "name", product.get("name"),
        "quantity", item.quantity(),
        "unitPrice", unitPrice,
        "totalPrice", total,
        "addonIds", item.addonIds() == null ? List.of() : item.addonIds()
      );
    }).toList();
    BigDecimal subtotal = priced.stream().map(row -> (BigDecimal) row.get("totalPrice")).reduce(BigDecimal.ZERO, BigDecimal::add);
    return new PriceResult(subtotal, priced);
  }

  private CouponResult applyCoupon(String rawCode, BigDecimal requestedDiscount, BigDecimal grossTotal) {
    if (rawCode == null || rawCode.isBlank()) {
      return new CouponResult(null, BigDecimal.ZERO);
    }

    String code = rawCode.trim();
    String normalized = code.toLowerCase();
    if (normalized.equals("mob10")) {
      BigDecimal discount = grossTotal.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
      return new CouponResult(code, discount);
    }

    if (normalized.equals("marianazinha")) {
      BigDecimal discount = grossTotal.subtract(new BigDecimal("1.00")).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
      return new CouponResult(code, discount);
    }

    if (requestedDiscount != null && requestedDiscount.compareTo(BigDecimal.ZERO) > 0) {
      BigDecimal discount = requestedDiscount
        .min(grossTotal.subtract(new BigDecimal("1.00")).max(BigDecimal.ZERO))
        .setScale(2, RoundingMode.HALF_UP);
      return new CouponResult(code, discount);
    }

    return new CouponResult(null, BigDecimal.ZERO);
  }

  private OrderResponse findByIdempotencyKey(String key) {
    try {
      String id = jdbc.queryForObject("select id from orders where idempotency_key = ?", String.class, cleanIdempotency(key));
      return id == null ? null : get(id);
    } catch (EmptyResultDataAccessException e) {
      return null;
    }
  }

  private boolean canTransition(OrderStatus from, OrderStatus to) {
    return switch (from) {
      case PENDING_PAYMENT -> to == OrderStatus.PAID || to == OrderStatus.RECEIVED || to == OrderStatus.PAYMENT_FAILED || to == OrderStatus.CANCELED;
      case PAID -> to == OrderStatus.RECEIVED;
      case RECEIVED -> to == OrderStatus.PREPARING || to == OrderStatus.CANCELED;
      case PREPARING -> to == OrderStatus.READY;
      case READY -> to == OrderStatus.OUT_FOR_DELIVERY || to == OrderStatus.DELIVERED;
      case OUT_FOR_DELIVERY -> to == OrderStatus.DELIVERED;
      default -> false;
    };
  }

  private OrderResponse mapOrder(ResultSet rs, int rowNum) throws SQLException {
    return new OrderResponse(
      rs.getString("id"),
      rs.getLong("number"),
      readItems(rs.getString("items")),
      DeliveryType.valueOf(rs.getString("delivery_type").toUpperCase()),
      rs.getString("customer_phone"),
      rs.getString("customer_address"),
      rs.getBigDecimal("subtotal"),
      rs.getBigDecimal("delivery_fee"),
      rs.getBigDecimal("total"),
      rs.getString("payment_provider"),
      rs.getString("payment_method"),
      rs.getString("payment_status"),
      rs.getString("payment_id"),
      rs.getString("status"),
      offset(rs, "paid_at"),
      offset(rs, "confirmed_at")
    );
  }

  private List<Map<String, Object>> readItems(String json) {
    try {
      return mapper.readValue(json, new TypeReference<>() {});
    } catch (JsonProcessingException e) {
      return List.of();
    }
  }

  private String toJson(Object value) {
    try {
      return mapper.writeValueAsString(value);
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("invalid json", e);
    }
  }

  private OffsetDateTime offset(ResultSet rs, String column) throws SQLException {
    var value = rs.getObject(column, OffsetDateTime.class);
    return value;
  }

  private String cleanIdempotency(String value) {
    return value == null || value.isBlank() ? UUID.randomUUID().toString() : value.trim();
  }

  private record PriceResult(BigDecimal subtotal, List<Map<String, Object>> items) {}
  private record CouponResult(String code, BigDecimal discount) {}
}
