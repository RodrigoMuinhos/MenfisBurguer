package com.menfis.delivery.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menfis.delivery.domain.DeliveryType;
import com.menfis.delivery.domain.OrderChannel;
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
  private final SettingsService settings;
  private final CustomerService customers;

  public OrderService(JdbcTemplate jdbc, ObjectMapper mapper, AuditService audit, OrderEventService events, SettingsService settings, CustomerService customers) {
    this.jdbc = jdbc;
    this.mapper = mapper;
    this.audit = audit;
    this.events = events;
    this.settings = settings;
    this.customers = customers;
  }

  @Transactional
  public OrderResponse create(CreateOrderRequest request) {
    return create(request, null);
  }

  @Transactional
  public OrderResponse create(CreateOrderRequest request, Long authenticatedCustomerId) {
    if (request.idempotencyKey() != null && !request.idempotencyKey().isBlank()) {
      OrderResponse existing = findByIdempotencyKey(request.idempotencyKey());
      if (existing != null) return existing;
    }

    long number = jdbc.queryForObject("select nextval('order_number_seq')", Long.class);
    String id = "#" + number;
    boolean testMode = settings.testModeEnabled();
    PriceResult price = calculate(request.items());
    BigDecimal deliveryFee = request.deliveryType() == DeliveryType.DELIVERY ? DELIVERY_FEE : BigDecimal.ZERO;
    BigDecimal serviceFee = request.deliveryType() == DeliveryType.DELIVERY ? SERVICE_FEE : BigDecimal.ZERO;
    BigDecimal grossTotal = price.subtotal().add(deliveryFee).add(serviceFee);
    CouponResult coupon = applyCoupon(request.couponCode(), request.couponDiscount(), grossTotal);
    BigDecimal total = grossTotal.subtract(coupon.discount()).max(new BigDecimal("1.00"));
    if (request.paymentMethod() == PaymentMethod.PAGAR_NA_ENTREGA
        && (request.channel() != OrderChannel.DELIVERY || !settings.payOnDeliveryEnabled())) {
      throw new IllegalArgumentException("pay_on_delivery_disabled");
    }
    boolean payOnDelivery = request.paymentMethod() == PaymentMethod.PAGAR_NA_ENTREGA;
    boolean payByWhatsapp = request.paymentMethod() == PaymentMethod.WHATSAPP;
    OrderChannel channel = request.channel() == null
      ? (request.paymentMethod() == PaymentMethod.PRESENCIAL ? OrderChannel.KIOSK : OrderChannel.DELIVERY)
      : request.channel();
    boolean paidKiosk = channel == OrderChannel.KIOSK;
    OrderStatus status = payOnDelivery || paidKiosk ? OrderStatus.PAID : OrderStatus.PAYMENT_PENDING;
    if (channel == OrderChannel.KIOSK
        && (isBlank(request.customerName()) || normalizedPhone(request.customerPhone()).length() < 10)) {
      throw new IllegalArgumentException("kiosk_customer_required");
    }
    OffsetDateTime confirmedAt = paidKiosk ? OffsetDateTime.now() : null;
    String itemsJson = toJson(price.items());
    Long customerId = authenticatedCustomerId != null
      ? authenticatedCustomerId
      : customers.findCustomerIdByPhone(request.customerPhone());

    jdbc.update(
      """
      insert into orders (
        id, number, items, channel, delivery_type, customer_name, customer_phone, customer_address,
        subtotal, delivery_fee, total, payment_provider, payment_method, payment_status,
        timestamp, status, idempotency_key, confirmed_at, coupon_code, discount_total, test_mode, customer_id, updated_at
      )
      values (?, ?, ?::jsonb, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())
      """,
      id,
      number,
      itemsJson,
      channel.name(),
      request.deliveryType().name(),
      request.customerName() == null ? null : request.customerName().trim(),
      request.customerPhone(),
      request.customerAddress(),
      price.subtotal(),
      deliveryFee,
      total,
      paidKiosk || request.paymentMethod() == PaymentMethod.PRESENCIAL || payOnDelivery || payByWhatsapp
        ? null
        : "MERCADO_PAGO",
      request.paymentMethod().name(),
      paidKiosk
        ? "approved"
        : payOnDelivery ? "awaiting_delivery" : payByWhatsapp ? "awaiting_whatsapp" : "pending",
      System.currentTimeMillis(),
      status.name(),
      cleanIdempotency(request.idempotencyKey()),
      confirmedAt,
      coupon.code(),
      coupon.discount(),
      testMode,
      customerId
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
      select id, number, items, channel, delivery_type, customer_name, customer_phone, customer_address,
        subtotal, delivery_fee, total, payment_provider, payment_method, payment_status,
        payment_id, status, paid_at, confirmed_at
      from orders where id = ?
      """,
      this::mapOrder,
      id
    );
  }

  public List<OrderResponse> listRecent() {
    return jdbc.query(
      """
      select id, number, items, channel, delivery_type, customer_name, customer_phone, customer_address,
        subtotal, delivery_fee, total, payment_provider, payment_method, payment_status,
        payment_id, status, paid_at, confirmed_at
      from orders
      where test_mode = ?
      order by created_at desc
      limit 200
      """,
      this::mapOrder
      ,
      settings.testModeEnabled()
    );
  }

  public StatusResponse status(String id) {
    return jdbc.queryForObject(
      "select id, status, paid_at, confirmed_at from orders where id = ?",
      (rs, rowNum) -> new StatusResponse(rs.getString("id"), rs.getString("status"), offset(rs, "paid_at"), offset(rs, "confirmed_at")),
      id
    );
  }

  public List<OrderResponse> listDeliveryRoute() {
    return jdbc.query(
      """
      select id, number, items, channel, delivery_type, customer_name, customer_phone, customer_address,
        subtotal, delivery_fee, total, payment_provider, payment_method, payment_status,
        payment_id, status, paid_at, confirmed_at
      from orders
      where delivery_type = 'DELIVERY' and status = 'OUT_FOR_DELIVERY' and test_mode = ?
      order by updated_at asc, created_at asc
      """,
      (rs, rowNum) -> mapOrder(rs, rowNum),
      settings.testModeEnabled()
    );
  }

  public List<OrderResponse> listForCustomer(long customerId) {
    return jdbc.query(
      """
      select o.id, o.number, o.items, o.channel, o.delivery_type, o.customer_name, o.customer_phone, o.customer_address,
        o.subtotal, o.delivery_fee, o.total, o.payment_provider, o.payment_method, o.payment_status,
        o.payment_id, o.status, o.paid_at, o.confirmed_at
      from orders o
      join customers c on c.id = ?
      where o.test_mode = ?
        and (
          o.customer_id = c.id
          or regexp_replace(coalesce(o.customer_phone, ''), '\\D', '', 'g') = c.phone_digits
        )
      order by o.created_at desc nulls last, o.number desc
      limit 50
      """,
      this::mapOrder,
      customerId,
      settings.testModeEnabled()
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
        payment_status = case when ? in ('PAID', 'IN_PREPARATION') then 'approved' else payment_status end,
        paid_at = case when ? in ('PAID', 'IN_PREPARATION') and paid_at is null then now() else paid_at end,
        confirmed_at = case when ? in ('PAID', 'IN_PREPARATION') and confirmed_at is null then now() else confirmed_at end
      where id = ?
      """,
      toStatus.name(),
      toStatus.name(),
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
  public OrderResponse confirmDelivery(String id, String code, String actor) {
    Map<String, Object> row = jdbc.queryForMap(
      "select number, status, delivery_type from orders where id = ?",
      id
    );
    OrderStatus current = OrderStatus.valueOf(String.valueOf(row.get("status")));
    DeliveryType deliveryType = DeliveryType.valueOf(String.valueOf(row.get("delivery_type")));
    if (deliveryType != DeliveryType.DELIVERY || current != OrderStatus.OUT_FOR_DELIVERY) {
      throw new IllegalArgumentException("delivery_confirmation_not_available");
    }
    String expected = deliveryConfirmationCode(Number.class.cast(row.get("number")).longValue());
    String provided = code == null ? "" : code.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
    if (!expected.equals(provided)) {
      throw new IllegalArgumentException("invalid_delivery_code");
    }
    return changeStatus(id, OrderStatus.DELIVERED, actor == null ? "motoboy" : actor, "delivery_code_confirmed");
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
    OrderStatus target = approved ? OrderStatus.PAID : failed ? OrderStatus.CANCELLED : OrderStatus.PAYMENT_PENDING;
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
    try {
      Map<String, Object> coupon = jdbc.queryForMap(
        "select code, type, value from coupons where lower(code) = lower(?) and active = true and test_mode = ?",
        code,
        settings.testModeEnabled()
      );
      BigDecimal value = (BigDecimal) coupon.get("value");
      String type = String.valueOf(coupon.get("type"));
      BigDecimal discount = "percent".equalsIgnoreCase(type)
        ? grossTotal.multiply(value).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP)
        : grossTotal.subtract(value).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
      discount = discount.min(grossTotal.subtract(new BigDecimal("1.00")).max(BigDecimal.ZERO)).setScale(2, RoundingMode.HALF_UP);
      return new CouponResult(String.valueOf(coupon.get("code")), discount);
    } catch (EmptyResultDataAccessException ignored) {
      if (requestedDiscount != null && requestedDiscount.compareTo(BigDecimal.ZERO) > 0) {
        BigDecimal discount = requestedDiscount
          .min(grossTotal.subtract(new BigDecimal("1.00")).max(BigDecimal.ZERO))
          .setScale(2, RoundingMode.HALF_UP);
        return new CouponResult(code, discount);
      }
    }

    return new CouponResult(null, BigDecimal.ZERO);
  }

  private OrderResponse findByIdempotencyKey(String key) {
    try {
      String id = jdbc.queryForObject(
        "select id from orders where idempotency_key = ? and test_mode = ?",
        String.class,
        cleanIdempotency(key),
        settings.testModeEnabled()
      );
      return id == null ? null : get(id);
    } catch (EmptyResultDataAccessException e) {
      return null;
    }
  }

  private boolean canTransition(OrderStatus from, OrderStatus to) {
    return switch (from) {
      case CREATED -> to == OrderStatus.PAYMENT_PENDING || to == OrderStatus.CANCELLED;
      case PAYMENT_PENDING -> to == OrderStatus.PAID || to == OrderStatus.IN_PREPARATION || to == OrderStatus.CANCELLED;
      case PAID -> to == OrderStatus.IN_PREPARATION || to == OrderStatus.CANCELLED;
      case IN_PREPARATION -> to == OrderStatus.READY;
      case READY -> to == OrderStatus.OUT_FOR_DELIVERY || to == OrderStatus.DELIVERED;
      case OUT_FOR_DELIVERY -> to == OrderStatus.DELIVERED;
      case CANCELLED -> to == OrderStatus.PAID;
      default -> false;
    };
  }

  private String deliveryConfirmationCode(long number) {
    String letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    char first = letters.charAt((int) (number % letters.length()));
    char second = letters.charAt((int) ((number / letters.length()) % letters.length()));
    long digits = Math.floorMod(number * 73 + 19, 100);
    return "%c%c%02d".formatted(first, second, digits);
  }

  private OrderResponse mapOrder(ResultSet rs, int rowNum) throws SQLException {
    return new OrderResponse(
      rs.getString("id"),
      rs.getLong("number"),
      deliveryConfirmationCode(rs.getLong("number")),
      readItems(rs.getString("items")),
      OrderChannel.valueOf(rs.getString("channel").toUpperCase()),
      DeliveryType.valueOf(rs.getString("delivery_type").toUpperCase()),
      rs.getString("customer_name"),
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

  private boolean isBlank(String value) {
    return value == null || value.trim().isBlank();
  }

  private String normalizedPhone(String value) {
    return value == null ? "" : value.replaceAll("\\D", "");
  }

  private record PriceResult(BigDecimal subtotal, List<Map<String, Object>> items) {}
  private record CouponResult(String code, BigDecimal discount) {}
}
