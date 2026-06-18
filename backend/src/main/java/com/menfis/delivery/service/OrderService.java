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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
  private static final BigDecimal DELIVERY_FEE = new BigDecimal("7.10");
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
    boolean kioskLocalCustomer = isKioskMobName(request.customerName());
    OrderChannel channel = kioskLocalCustomer
      ? OrderChannel.KIOSK
      : request.channel() == null
      ? (request.paymentMethod() == PaymentMethod.PRESENCIAL ? OrderChannel.KIOSK : OrderChannel.DELIVERY)
      : request.channel();
    DeliveryType deliveryType = kioskLocalCustomer ? DeliveryType.RETIRADA : request.deliveryType();
    String customerName = kioskLocalCustomer
      ? "KIOSK-MOB"
      : request.customerName() == null ? null : request.customerName().trim();
    PriceResult price = calculate(request.items());
    boolean chargeDeliveryFees =
      deliveryType == DeliveryType.DELIVERY
        && channel != OrderChannel.KIOSK
        && !kioskLocalCustomer
        && price.subtotal().compareTo(BigDecimal.ZERO) > 0;
    BigDecimal deliveryFee = chargeDeliveryFees ? DELIVERY_FEE : BigDecimal.ZERO;
    BigDecimal serviceFee = chargeDeliveryFees ? SERVICE_FEE : BigDecimal.ZERO;
    BigDecimal grossTotal = price.subtotal().add(deliveryFee).add(serviceFee);
    CouponResult coupon = applyCoupon(request.couponCode(), request.couponDiscount(), grossTotal);
    BigDecimal total = grossTotal.subtract(coupon.discount()).max(new BigDecimal("1.00"));
    if (request.paymentMethod() == PaymentMethod.PAGAR_NA_ENTREGA
        && (channel != OrderChannel.DELIVERY || !settings.payOnDeliveryEnabled())) {
      throw new IllegalArgumentException("pay_on_delivery_disabled");
    }
    boolean payOnDelivery = request.paymentMethod() == PaymentMethod.PAGAR_NA_ENTREGA;
    boolean payByWhatsapp = request.paymentMethod() == PaymentMethod.WHATSAPP;
    boolean payAtCounter = request.paymentMethod() == PaymentMethod.PRESENCIAL;
    boolean paidKiosk = channel == OrderChannel.KIOSK && !kioskLocalCustomer;
    OrderStatus status = payOnDelivery || paidKiosk || payAtCounter ? OrderStatus.PAID : OrderStatus.PAYMENT_PENDING;
    if (channel == OrderChannel.KIOSK
        && (isBlank(customerName) || normalizedPhone(request.customerPhone()).length() < 10)) {
      throw new IllegalArgumentException("kiosk_customer_required");
    }
    if (channel == OrderChannel.DELIVERY && authenticatedCustomerId == null) {
      throw new IllegalArgumentException("customer_session_required");
    }
    OffsetDateTime confirmedAt = paidKiosk ? OffsetDateTime.now() : null;
    String itemsJson = toJson(price.items());
    Long customerId = authenticatedCustomerId;

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
      deliveryType.name(),
      customerName,
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
        : payAtCounter ? "awaiting_counter" : payOnDelivery ? "awaiting_delivery" : payByWhatsapp ? "awaiting_whatsapp" : "pending",
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
        subtotal, delivery_fee, coupon_code, discount_total, total, payment_provider, payment_method, payment_status,
        payment_id, timestamp, created_at, status, paid_at, confirmed_at
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
        subtotal, delivery_fee, coupon_code, discount_total, total, payment_provider, payment_method, payment_status,
        payment_id, timestamp, created_at, status, paid_at, confirmed_at
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

  @Transactional
  public void deleteCancelled(String id) {
    String status = jdbc.queryForObject("select status from orders where id = ?", String.class, id);
    if (!OrderStatus.CANCELLED.name().equals(status) && !OrderStatus.DELIVERED.name().equals(status)) {
      throw new IllegalArgumentException("only_cancelled_or_delivered_orders_can_be_deleted");
    }
    jdbc.update("delete from orders where id = ?", id);
    audit.log("admin", "ORDER_DELETED", "ORDER", id, Map.of("status", status));
  }

  @Transactional
  public OrderResponse updateItems(
      String id,
      List<Map<String, Object>> rawItems,
      BigDecimal requestedDeliveryFee,
      String customerName,
      String customerPhone,
      String customerAddress,
      DeliveryType requestedDeliveryType,
      String paymentMethod,
      String paymentStatus,
      String couponCode,
      BigDecimal requestedDiscountTotal) {
    Map<String, Object> current = jdbc.queryForMap(
      "select status, delivery_type, subtotal, delivery_fee, total, coupon_code, discount_total from orders where id = ?",
      id
    );
    OrderStatus status = OrderStatus.valueOf(String.valueOf(current.get("status")));
    if (!(status == OrderStatus.PAYMENT_PENDING || status == OrderStatus.PAID || status == OrderStatus.ACCEPTED)) {
      throw new IllegalArgumentException("order_items_not_editable_in_status:" + status.name());
    }

    List<Map<String, Object>> items = normalizeEditableItems(rawItems);
    if (items.isEmpty()) {
      throw new IllegalArgumentException("order_must_have_at_least_one_item");
    }

    BigDecimal newSubtotal = items.stream()
      .map(item -> (BigDecimal) item.get("totalPrice"))
      .reduce(BigDecimal.ZERO, BigDecimal::add)
      .setScale(2, RoundingMode.HALF_UP);
    BigDecimal oldSubtotal = money(current.get("subtotal"));
    BigDecimal oldDeliveryFee = money(current.get("delivery_fee"));
    String nextDeliveryType = requestedDeliveryType == null
      ? String.valueOf(current.get("delivery_type"))
      : requestedDeliveryType.name();
    BigDecimal requestedOrOldDeliveryFee = requestedDeliveryFee == null
      ? oldDeliveryFee
      : requestedDeliveryFee.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    BigDecimal deliveryFee = "DELIVERY".equals(nextDeliveryType)
      && newSubtotal.compareTo(BigDecimal.ZERO) > 0
      ? requestedOrOldDeliveryFee.max(DELIVERY_FEE)
      : requestedOrOldDeliveryFee;
    BigDecimal oldTotal = money(current.get("total"));
    BigDecimal oldDiscount = money(current.get("discount_total"));
    BigDecimal discount = requestedDiscountTotal == null
      ? oldDiscount
      : requestedDiscountTotal.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    BigDecimal serviceFee = oldTotal.add(oldDiscount).subtract(oldSubtotal).subtract(oldDeliveryFee).max(BigDecimal.ZERO);
    BigDecimal newTotal = newSubtotal.add(deliveryFee).add(serviceFee).subtract(discount)
      .max(new BigDecimal("1.00"))
      .setScale(2, RoundingMode.HALF_UP);
    String nextCouponCode = null;
    if (discount.compareTo(BigDecimal.ZERO) > 0) {
      String requestedCoupon = couponCode == null ? null : couponCode.trim();
      String existingCoupon = current.get("coupon_code") == null
        ? null
        : String.valueOf(current.get("coupon_code")).trim();
      String effectiveCoupon = requestedCoupon == null ? existingCoupon : requestedCoupon;
      nextCouponCode = effectiveCoupon == null || effectiveCoupon.isBlank()
        ? null
        : effectiveCoupon.toUpperCase();
    }

    jdbc.update(
      """
      update orders
      set items = ?::jsonb,
          subtotal = ?,
          delivery_fee = ?,
          total = ?,
          customer_name = coalesce(?, customer_name),
          customer_phone = coalesce(?, customer_phone),
          customer_address = coalesce(?, customer_address),
          delivery_type = ?,
          payment_method = coalesce(?, payment_method),
          payment_status = coalesce(?, payment_status),
          coupon_code = ?,
          discount_total = ?,
          updated_at = now()
      where id = ?
      """,
      toJson(items),
      newSubtotal,
      deliveryFee,
      newTotal,
      blankToNull(customerName),
      blankToNull(customerPhone),
      blankToNull(customerAddress),
      nextDeliveryType,
      blankToNull(paymentMethod),
      blankToNull(paymentStatus),
      nextCouponCode,
      discount,
      id
    );
    jdbc.update("delete from order_items where order_id = ?", id);
    for (Map<String, Object> item : items) {
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
    audit.log("admin", "ORDER_ITEMS_UPDATED", "ORDER", id, Map.of("subtotal", newSubtotal, "total", newTotal));
    OrderResponse updated = get(id);
    events.publish(id, updated);
    return updated;
  }

  public List<OrderResponse> listDeliveryRoute() {
    return jdbc.query(
      """
      select id, number, items, channel, delivery_type, customer_name, customer_phone, customer_address,
        subtotal, delivery_fee, coupon_code, discount_total, total, payment_provider, payment_method, payment_status,
        payment_id, timestamp, created_at, status, paid_at, confirmed_at
      from orders
      where delivery_type = 'DELIVERY'
        and status = 'OUT_FOR_DELIVERY'
        and replace(upper(coalesce(customer_name, '')), '_', '-') <> 'KIOSK-MOB'
        and test_mode = ?
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
        o.subtotal, o.delivery_fee, o.coupon_code, o.discount_total, o.total, o.payment_provider, o.payment_method, o.payment_status,
        o.payment_id, o.timestamp, o.created_at, o.status, o.paid_at, o.confirmed_at
      from orders o
      join customers c on c.id = ?
      where o.test_mode = ?
        and (
          o.customer_id = c.id
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
    Map<String, Object> row = jdbc.queryForMap(
      "select status, customer_name from orders where id = ?",
      id
    );
    String from = String.valueOf(row.get("status"));
    boolean kioskMobOrder = isKioskMobName(String.valueOf(row.get("customer_name")));
    if (kioskMobOrder && toStatus == OrderStatus.OUT_FOR_DELIVERY) {
      throw new IllegalArgumentException("kiosk_mob_counter_service_required");
    }
    if (!canTransition(OrderStatus.valueOf(from), toStatus)) {
      throw new IllegalArgumentException("invalid_status_transition:" + from + "_to_" + toStatus);
    }

    jdbc.update(
      """
      update orders set status = ?, updated_at = now(),
        payment_status = case when ? in ('PAID', 'ACCEPTED', 'IN_PREPARATION') then 'approved' else payment_status end,
        paid_at = case when ? in ('PAID', 'ACCEPTED', 'IN_PREPARATION') and paid_at is null then now() else paid_at end,
        confirmed_at = case when ? in ('PAID', 'ACCEPTED', 'IN_PREPARATION') and confirmed_at is null then now() else confirmed_at end
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
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("productId", product.get("id"));
      row.put("id", product.get("id"));
      row.put("name", product.get("name"));
      row.put("quantity", item.quantity());
      row.put("qty", item.quantity());
      row.put("unitPrice", unitPrice);
      row.put("price", unitPrice);
      row.put("totalPrice", total);
      row.put("addonIds", item.addonIds() == null ? List.of() : item.addonIds());
      if (item.metadata() != null) {
        Object components = item.metadata().get("components");
        Object note = item.metadata().get("note");
        if (components != null) row.put("components", components);
        if (note != null) row.put("note", note);
      }
      return row;
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
      case PAYMENT_PENDING -> to == OrderStatus.PAID || to == OrderStatus.ACCEPTED || to == OrderStatus.IN_PREPARATION || to == OrderStatus.CANCELLED;
      case PAID -> to == OrderStatus.ACCEPTED || to == OrderStatus.IN_PREPARATION || to == OrderStatus.CANCELLED;
      case ACCEPTED -> to == OrderStatus.IN_PREPARATION || to == OrderStatus.CANCELLED;
      case IN_PREPARATION -> to == OrderStatus.READY || to == OrderStatus.CANCELLED;
      case READY -> to == OrderStatus.OUT_FOR_DELIVERY || to == OrderStatus.DELIVERED;
      case OUT_FOR_DELIVERY -> to == OrderStatus.DELIVERED;
      case CANCELLED -> to == OrderStatus.PAID || to == OrderStatus.ACCEPTED;
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
      rs.getString("coupon_code"),
      rs.getBigDecimal("discount_total"),
      rs.getBigDecimal("total"),
      rs.getString("payment_provider"),
      rs.getString("payment_method"),
      rs.getString("payment_status"),
      rs.getString("payment_id"),
      orderTimestamp(rs),
      offset(rs, "created_at"),
      rs.getString("status"),
      offset(rs, "paid_at"),
      offset(rs, "confirmed_at")
    );
  }

  private String blankToNull(String value) {
    if (value == null || value.isBlank()) return null;
    return value.trim();
  }

  private long orderTimestamp(ResultSet rs) throws SQLException {
    OffsetDateTime createdAt = offset(rs, "created_at");
    if (createdAt != null) return createdAt.toInstant().toEpochMilli();
    long timestamp = rs.getLong("timestamp");
    return !rs.wasNull() && timestamp > 0 ? timestamp : System.currentTimeMillis();
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

  private List<Map<String, Object>> normalizeEditableItems(List<Map<String, Object>> rawItems) {
    if (rawItems == null) return List.of();
    return rawItems.stream().map(item -> {
      String id = cleanString(item.get("id"));
      String productId = cleanString(item.getOrDefault("productId", id));
      String name = cleanString(item.get("name"));
      int quantity = Math.max(1, number(item.getOrDefault("quantity", item.get("qty"))).intValue());
      BigDecimal unitPrice = number(item.getOrDefault("unitPrice", item.get("price"))).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
      if (name.isBlank()) throw new IllegalArgumentException("invalid_item_name");
      BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP);
      Map<String, Object> normalized = new LinkedHashMap<>();
      normalized.put("id", id.isBlank() ? productId : id);
      normalized.put("productId", productId.isBlank() ? id : productId);
      normalized.put("name", name);
      normalized.put("quantity", quantity);
      normalized.put("qty", quantity);
      normalized.put("unitPrice", unitPrice);
      normalized.put("price", unitPrice);
      normalized.put("totalPrice", totalPrice);
      Object components = item.get("components");
      if (components instanceof List<?>) normalized.put("components", components);
      Object note = item.get("note");
      if (note != null && !String.valueOf(note).isBlank()) normalized.put("note", String.valueOf(note));
      return normalized;
    }).toList();
  }

  private BigDecimal money(Object value) {
    if (value instanceof BigDecimal decimal) return decimal.setScale(2, RoundingMode.HALF_UP);
    if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue()).setScale(2, RoundingMode.HALF_UP);
    if (value == null) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    return new BigDecimal(String.valueOf(value)).setScale(2, RoundingMode.HALF_UP);
  }

  private BigDecimal number(Object value) {
    if (value instanceof BigDecimal decimal) return decimal;
    if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
    if (value == null || String.valueOf(value).isBlank()) return BigDecimal.ZERO;
    return new BigDecimal(String.valueOf(value));
  }

  private String cleanString(Object value) {
    return value == null ? "" : String.valueOf(value).trim();
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

  private boolean isKioskMobName(String value) {
    return "KIOSK-MOB".equals(String.valueOf(value).trim().toUpperCase().replace('_', '-'));
  }

  private String normalizedPhone(String value) {
    return value == null ? "" : value.replaceAll("\\D", "");
  }

  private record PriceResult(BigDecimal subtotal, List<Map<String, Object>> items) {}
  private record CouponResult(String code, BigDecimal discount) {}
}
