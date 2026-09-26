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
import com.menfis.delivery.messaging.OrderEventPublisher;
import com.menfis.delivery.messaging.OrderLifecycleEventPublisher;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.Duration;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrderService {
  private static final Logger log = LoggerFactory.getLogger(OrderService.class);
  private static final BigDecimal DELIVERY_FEE = new BigDecimal("7.10");
  private static final BigDecimal SERVICE_FEE = new BigDecimal("0.99");
  private static final SecureRandom SECURE_RANDOM = new SecureRandom();
  static final Duration RECEIVED_HOLD_DURATION = Duration.ofMinutes(5);

  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;
  private final AuditService audit;
  private final OrderEventService events;
  private final SettingsService settings;
  private final CustomerService customers;
  private final OrderEventPublisher orderPublisher;
  private final OrderLifecycleEventPublisher lifecyclePublisher;
  private final PricingService pricing;

  public OrderService(
      JdbcTemplate jdbc,
      ObjectMapper mapper,
      AuditService audit,
      OrderEventService events,
      SettingsService settings,
      CustomerService customers,
      OrderEventPublisher orderPublisher,
      OrderLifecycleEventPublisher lifecyclePublisher,
      PricingService pricing) {
    this.jdbc = jdbc;
    this.mapper = mapper;
    this.audit = audit;
    this.events = events;
    this.settings = settings;
    this.customers = customers;
    this.orderPublisher = orderPublisher;
    this.lifecyclePublisher = lifecyclePublisher;
    this.pricing = pricing;
  }

  @Transactional
  public OrderResponse create(CreateOrderRequest request) {
    return create(request, null);
  }

  @Transactional
  public OrderResponse create(CreateOrderRequest request, Long authenticatedCustomerId) {
    if (request.idempotencyKey() != null && !request.idempotencyKey().isBlank()) {
      OrderResponse existing = findByIdempotencyKey(request.idempotencyKey());
      if (existing != null) return rotateTrackingToken(existing);
    }
    boolean kioskLocalCustomer = isKioskMobName(request.customerName());
    OrderChannel channel = kioskLocalCustomer
      ? OrderChannel.KIOSK
      : request.channel() == null
      ? (request.paymentMethod() == PaymentMethod.PRESENCIAL ? OrderChannel.KIOSK : OrderChannel.DELIVERY)
      : request.channel();
    if (channel == OrderChannel.DINING_QR) {
      throw new IllegalArgumentException("use_dining_order_endpoint");
    }
    DeliveryType deliveryType = kioskLocalCustomer ? DeliveryType.RETIRADA : request.deliveryType();
    String customerName = kioskLocalCustomer
      ? "KIOSK-MOB"
      : request.customerName() == null ? null : request.customerName().trim();
    if (channel != OrderChannel.KIOSK && request.items().stream().anyMatch(this::isKioskOnlyItem)) {
      throw new IllegalArgumentException("kiosk_only_product");
    }
    request.items().forEach(this::validateProductAddons);
    if (!settings.testModeEnabled() && channel != OrderChannel.KIOSK && settings.isSoldOutNow()) {
      throw new IllegalStateException("store_sold_out");
    }
    if (!settings.testModeEnabled() && channel != OrderChannel.KIOSK && !settings.isOperatingNow()) {
      throw new IllegalStateException("restaurant_closed");
    }

    long number = jdbc.queryForObject("select nextval('order_number_seq')", Long.class);
    String id = "#" + number;
    String trackingToken = randomToken(32);
    String deliveryCode = randomDeliveryCode();
    boolean testMode = settings.testModeEnabled();
    PriceResult price = calculate(request.items());
    boolean chargeDeliveryFees =
      deliveryType == DeliveryType.DELIVERY
        && channel != OrderChannel.KIOSK
        && !kioskLocalCustomer
        && price.subtotal().compareTo(BigDecimal.ZERO) > 0;
    BigDecimal serviceFee = chargeDeliveryFees ? SERVICE_FEE : BigDecimal.ZERO;
    BigDecimal initialDeliveryFee = chargeDeliveryFees ? DELIVERY_FEE : BigDecimal.ZERO;
    CouponResult coupon = applyCoupon(
      request.couponCode(),
      request.couponDiscount(),
      price.subtotal().add(initialDeliveryFee).add(serviceFee)
    );
    BigDecimal deliveryFee = coupon.freeShipping() ? BigDecimal.ZERO : initialDeliveryFee;
    BigDecimal grossTotal = price.subtotal().add(deliveryFee).add(serviceFee);
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
        && isBlank(customerName)) {
      throw new IllegalArgumentException("kiosk_customer_required");
    }
    if (channel == OrderChannel.DELIVERY && authenticatedCustomerId == null) {
      throw new IllegalArgumentException("customer_session_required");
    }
    OffsetDateTime confirmedAt = paidKiosk ? OffsetDateTime.now() : null;
    String itemsJson = toJson(price.items());
    // KIOSK-MOB is the shared counter terminal, not a CRM customer. Its saved
    // browser token may have been issued against another database, so never
    // persist that token's customer id on an official kiosk order.
    Long customerId = kioskLocalCustomer ? null : authenticatedCustomerId;

    jdbc.update(
      """
      insert into orders (
        id, number, items, channel, delivery_type, customer_name, customer_phone, customer_address,
        subtotal, delivery_fee, total, payment_provider, payment_method, payment_status,
        timestamp, status, idempotency_key, confirmed_at, coupon_code, discount_total, test_mode, customer_id,
        tracking_token_hash, delivery_code, updated_at
      )
      values (?, ?, ?::jsonb, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())
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
      customerId,
      sha256(trackingToken),
      deliveryCode
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
    pricing.snapshotOrderCosts(id);

    jdbc.update(
      "insert into order_status_history(order_id, from_status, to_status, changed_by, reason) values (?, null, ?, ?, ?)",
      id,
      status.name(),
      "system",
      "order_created"
    );
    audit.log("system", "ORDER_CREATED", "ORDER", id, Map.of("total", total, "status", status.name()));
    OrderResponse created = withTrackingToken(get(id), trackingToken);
    events.publish(id, created);
    log.info(
      "ORDER_CREATED orderId={} number={} channel={} deliveryType={} status={} paymentMethod={} paymentStatus={} total={}",
      created.id(),
      created.number(),
      created.channel(),
      created.deliveryType(),
      created.status(),
      created.paymentMethod(),
      created.paymentStatus(),
      created.total()
    );
    publishLifecycle(created, "ORDER_CREATED", null, created.status(), "system", "order_created");
    if (isPaymentConfirmedStatus(OrderStatus.valueOf(created.status()))) {
      publishLifecycle(created, "PAYMENT_CONFIRMED", null, created.status(), "system", "order_created_paid");
      enqueueOrderPaid(created.id(), orderPaidOrigin(created), created.paidAt());
    }
    return created;
  }

  public OrderResponse get(String id) {
    return jdbc.queryForObject(
      """
      select id, number, items, channel, delivery_type, customer_name, customer_phone, customer_address,
        subtotal, delivery_fee, coupon_code, discount_total, total, payment_provider, payment_method, payment_status,
        payment_id, timestamp, created_at, updated_at, status, paid_at, confirmed_at, delivery_code,
        (select t.name from dining_sessions s join dining_tables t on t.id = s.table_id where s.id = orders.dining_session_id) dining_table_name
      from orders where id = ?
      """,
      this::mapOrder,
      id
    );
  }

  public OrderResponse getAuthorized(
      String id,
      String authorization,
      String trackingToken,
      AuthService auth) {
    requireOrderAccess(id, authorization, trackingToken, auth);
    return get(id);
  }

  public void requireOrderAccess(
      String id,
      String authorization,
      String trackingToken,
      AuthService auth) {
    Map<String, Object> access;
    try {
      access = jdbc.queryForMap(
        "select customer_id, tracking_token_hash from orders where id = ?",
        id
      );
    } catch (EmptyResultDataAccessException ex) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "order_not_found");
    }
    AuthService.OrderIdentity identity = auth.optionalOrderIdentity(authorization);
    if (identity != null && identity.operational()) return;
    if (identity != null && identity.customerId() != null
        && access.get("customer_id") != null
        && identity.customerId().longValue() == Number.class.cast(access.get("customer_id")).longValue()) {
      return;
    }
    String expectedHash = access.get("tracking_token_hash") == null
      ? null
      : String.valueOf(access.get("tracking_token_hash"));
    if (trackingToken != null && !trackingToken.isBlank() && expectedHash != null
        && MessageDigest.isEqual(
          expectedHash.getBytes(StandardCharsets.US_ASCII),
          sha256(trackingToken.trim()).getBytes(StandardCharsets.US_ASCII))) {
      return;
    }
    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "order_not_found");
  }

  public List<OrderResponse> listRecent() {
    return jdbc.query(
      """
      select id, number, items, channel, delivery_type, customer_name, customer_phone, customer_address,
        subtotal, delivery_fee, coupon_code, discount_total, total, payment_provider, payment_method, payment_status,
        payment_id, timestamp, created_at, updated_at, status, paid_at, confirmed_at, delivery_code,
        (select t.name from dining_sessions s join dining_tables t on t.id = s.table_id where s.id = orders.dining_session_id) dining_table_name
      from orders
      where test_mode = ?
      order by created_at desc
      limit 5000
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
    // stock_movements intentionally has no ON DELETE CASCADE because it is normally
    // part of the permanent inventory ledger. A definitive admin deletion is the
    // exception: remove its inventory references and non-FK Rabbit log first, then
    // let the remaining order-owned records cascade from orders.
    jdbc.update("delete from stock_movements where order_id = ?", id);
    jdbc.update("delete from order_event_log where order_id = ?", id);
    int deleted = jdbc.update("delete from orders where id = ?", id);
    if (deleted != 1) {
      throw new EmptyResultDataAccessException(1);
    }
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
    if (!(status == OrderStatus.PAYMENT_PENDING || status == OrderStatus.PAYMENT_PROOF_PENDING || status == OrderStatus.PAYMENT_APPROVED || status == OrderStatus.PAID || status == OrderStatus.ACCEPTED)) {
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
        payment_id, timestamp, created_at, updated_at, status, paid_at, confirmed_at, delivery_code,
        (select t.name from dining_sessions s join dining_tables t on t.id = s.table_id where s.id = orders.dining_session_id) dining_table_name
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
        o.payment_id, o.timestamp, o.created_at, o.updated_at, o.status, o.paid_at, o.confirmed_at, o.delivery_code,
        (select t.name from dining_sessions s join dining_tables t on t.id = s.table_id where s.id = o.dining_session_id) dining_table_name
      from orders o
      join customers c on c.id = ?
      where o.test_mode = ?
        and o.status <> 'CANCELLED'
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

  /** Cancels unpaid orders after ten minutes so they never reserve production capacity indefinitely. */
  @Scheduled(fixedDelay = 60_000, initialDelay = 60_000)
  @Transactional
  public void cancelExpiredPaymentPendingOrders() {
    List<String> candidates = jdbc.queryForList(
      """
      select id from orders
      where status = 'PAYMENT_PENDING'
        and created_at < now() - interval '10 minutes'
      """,
      String.class
    );
    for (String id : candidates) {
      int updated = jdbc.update(
        """
        update orders
        set status = 'CANCELLED', payment_status = 'expired', updated_at = now()
        where id = ?
          and status = 'PAYMENT_PENDING'
          and created_at < now() - interval '10 minutes'
        """,
        id
      );
      if (updated == 0) continue;
      jdbc.update(
        "insert into order_status_history(order_id, from_status, to_status, changed_by, reason) values (?, 'PAYMENT_PENDING', 'CANCELLED', 'system', 'payment_timeout_10_minutes')",
        id
      );
      audit.log("system", "ORDER_PAYMENT_TIMEOUT", "ORDER", id, Map.of("timeoutMinutes", 10));
      events.publish(id, get(id));
    }
  }


  @Transactional
  public OrderResponse changeStatus(String id, OrderStatus toStatus, String actor, String reason) {
    Map<String, Object> row = jdbc.queryForMap(
      "select status, customer_name, paid_at from orders where id = ?",
      id
    );
    String from = String.valueOf(row.get("status"));
    OrderStatus fromStatus = OrderStatus.valueOf(from);
    if (toStatus == OrderStatus.IN_PREPARATION
        && isReceivedStatus(fromStatus)
        && "system".equalsIgnoreCase(actor)
        && !receivedHoldElapsed(asOffsetDateTime(row.get("paid_at")), OffsetDateTime.now())) {
      throw new IllegalArgumentException("order_received_hold_not_elapsed");
    }
    boolean kioskMobOrder = isKioskMobName(String.valueOf(row.get("customer_name")));
    if (kioskMobOrder && toStatus == OrderStatus.OUT_FOR_DELIVERY) {
      throw new IllegalArgumentException("kiosk_mob_counter_service_required");
    }
    if (!canTransition(fromStatus, toStatus)) {
      throw new IllegalArgumentException("invalid_status_transition:" + from + "_to_" + toStatus);
    }

    jdbc.update(
      """
      update orders set status = ?, updated_at = now(),
        payment_status = case when ? in ('PAYMENT_APPROVED', 'PAID', 'ACCEPTED', 'IN_PREPARATION') then 'approved' else payment_status end,
        paid_at = case when ? in ('PAYMENT_APPROVED', 'PAID', 'ACCEPTED', 'IN_PREPARATION') and paid_at is null then now() else paid_at end,
        confirmed_at = case when ? in ('PAYMENT_APPROVED', 'PAID', 'ACCEPTED', 'IN_PREPARATION') and confirmed_at is null then now() else confirmed_at end
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
    log.info(
      "ORDER_STATUS_CHANGED orderId={} from={} to={} actor={} reason={} paymentStatus={} total={}",
      id,
      from,
      toStatus.name(),
      actor == null ? "system" : actor,
      reason,
      updated.paymentStatus(),
      updated.total()
    );
    if (shouldPublishOrderPaid(fromStatus, toStatus)) {
      publishLifecycle(updated, "PAYMENT_CONFIRMED", from, toStatus.name(), actor == null ? "system" : actor, reason);
      enqueueOrderPaid(updated.id(), orderPaidOrigin(updated), updated.paidAt());
    }
    String lifecycleEventType = lifecycleEventType(toStatus);
    if (lifecycleEventType != null) {
      publishLifecycle(updated, lifecycleEventType, from, toStatus.name(), actor == null ? "system" : actor, reason);
    }
    return updated;
  }

  public record PendingTerminalOrder(long amountCents) {}

  public PendingTerminalOrder requirePendingKioskMobOrder(String id) {
    Map<String, Object> row = jdbc.queryForMap(
      "select total, status, customer_name from orders where id = ?",
      id
    );
    if (!isKioskMobName(String.valueOf(row.get("customer_name")))) {
      throw new IllegalArgumentException("terminal_payment_kiosk_order_required");
    }
    if (!OrderStatus.PAYMENT_PENDING.name().equals(String.valueOf(row.get("status")))) {
      throw new IllegalArgumentException("terminal_payment_order_not_pending");
    }
    BigDecimal total = (BigDecimal) row.get("total");
    return new PendingTerminalOrder(total.movePointRight(2).longValueExact());
  }

  @Transactional
  public OrderResponse approveTerminalPayment(
      String id,
      String paymentId,
      String method,
      String authorizationCode,
      String sitefNsu) {
    requirePendingKioskMobOrder(id);
    jdbc.update(
      """
      update orders
      set payment_provider = 'PPC930_SITEF',
          payment_method = ?,
          payment_status = 'approved',
          payment_id = ?,
          paid_at = now(),
          updated_at = now()
      where id = ? and status = 'PAYMENT_PENDING'
      """,
      method,
      paymentId,
      id
    );
    OrderResponse updated = get(id);
    events.publish(id, updated);
    return updated;
  }

  @Transactional
  public void failTerminalPayment(String id, String paymentId, String terminalStatus) {
    String cleanStatus = cleanTerminalReference(terminalStatus).toLowerCase();
    if ("cancelled".equals(cleanStatus)) {
      int updated = jdbc.update(
        "update orders set payment_provider = 'PPC930_SITEF', payment_id = ?, payment_status = ?, status = 'CANCELLED', updated_at = now() where id = ? and status = 'PAYMENT_PENDING'",
        paymentId,
        cleanStatus,
        id
      );
      if (updated == 0) {
        String status = jdbc.queryForObject("select status from orders where id = ?", String.class, id);
        if (!"CANCELLED".equals(status)) requirePendingKioskMobOrder(id);
      }
      OrderResponse cancelled = get(id);
      events.publish(id, cancelled);
      return;
    }
    requirePendingKioskMobOrder(id);
    jdbc.update(
        "update orders set payment_provider = 'PPC930_SITEF', payment_id = ?, payment_status = ?, updated_at = now() where id = ?",
        paymentId,
        cleanStatus,
        id
      );
  }

  @Transactional
  public void completeTerminalCustomerName(String id, String customerName) {
    String cleanName = customerName == null ? "" : customerName.trim();
    if (cleanName.length() < 2 || cleanName.length() > 80) {
      throw new IllegalArgumentException("terminal_customer_name_invalid");
    }
    int updated = jdbc.update(
      """
      update orders
      set customer_name = ?, status = 'PAID', confirmed_at = now(), updated_at = now()
      where id = ?
        and channel = 'KIOSK'
        and payment_provider = 'PPC930_SITEF'
        and payment_status = 'approved'
        and status = 'PAYMENT_PENDING'
      """,
      cleanName,
      id
    );
    if (updated != 1) {
      throw new IllegalArgumentException("terminal_customer_name_order_invalid");
    }
    jdbc.update(
      "insert into order_status_history(order_id, from_status, to_status, changed_by, reason) values (?, 'PAYMENT_PENDING', 'PAID', 'ppc930', 'SITEF_APPROVED_NAME_CONFIRMED')",
      id
    );
    OrderResponse order = get(id);
    events.publish(id, order);
    publishLifecycle(order, "PAYMENT_CONFIRMED", "PAYMENT_PENDING", "PAID", "ppc930", "SITEF_APPROVED_NAME_CONFIRMED");
    enqueueOrderPaid(order.id(), "ppc930", order.paidAt());
  }

  private static String cleanTerminalReference(String value) {
    if (value == null) return "";
    return value.replaceAll("[^A-Za-z0-9._-]", "").substring(0, Math.min(64, value.replaceAll("[^A-Za-z0-9._-]", "").length()));
  }

  @Transactional
  public OrderResponse confirmDelivery(String id, String code, String actor) {
    Map<String, Object> row = jdbc.queryForMap(
      "select status, delivery_type, delivery_code from orders where id = ?",
      id
    );
    OrderStatus current = OrderStatus.valueOf(String.valueOf(row.get("status")));
    DeliveryType deliveryType = DeliveryType.valueOf(String.valueOf(row.get("delivery_type")));
    if (deliveryType != DeliveryType.DELIVERY || current != OrderStatus.OUT_FOR_DELIVERY) {
      throw new IllegalArgumentException("delivery_confirmation_not_available");
    }
    String expected = String.valueOf(row.get("delivery_code"));
    String provided = code == null ? "" : code.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
    if (!expected.equals(provided)) {
      throw new IllegalArgumentException("invalid_delivery_code");
    }
    return changeStatus(id, OrderStatus.DELIVERED, actor == null ? "motoboy" : actor, "delivery_code_confirmed");
  }

  @Transactional
  public OrderResponse approvePayment(String orderId, String actor) {
    Map<String, Object> row = jdbc.queryForMap(
      "select status, channel from orders where id = ?",
      orderId
    );
    OrderStatus current = OrderStatus.valueOf(String.valueOf(row.get("status")));
    if (isKitchenOrTerminal(current)) {
      return get(orderId);
    }
    if (!(current == OrderStatus.CREATED
        || current == OrderStatus.PAYMENT_PENDING
        || current == OrderStatus.PAYMENT_PROOF_PENDING
        || current == OrderStatus.PAID
        || current == OrderStatus.ACCEPTED
        || current == OrderStatus.PAYMENT_APPROVED)) {
      throw new IllegalArgumentException("payment_not_approvable:" + current.name());
    }

    String from = current.name();
    jdbc.update(
      """
      update orders
      set status = 'PAYMENT_APPROVED',
          payment_status = 'approved',
          paid_at = coalesce(paid_at, now()),
          confirmed_at = coalesce(confirmed_at, now()),
          updated_at = now()
      where id = ?
        and status not in ('IN_PREPARATION', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')
      """,
      orderId
    );
    if (!OrderStatus.PAYMENT_APPROVED.name().equals(from)) {
      jdbc.update(
        "insert into order_status_history(order_id, from_status, to_status, changed_by, reason) values (?, ?, 'PAYMENT_APPROVED', ?, 'PAYMENT_APPROVED_SIMULATION')",
        orderId,
        from,
        actor == null ? "admin" : actor
      );
    }
    audit.log(actor == null ? "admin" : actor, "PAYMENT_APPROVED", "ORDER", orderId, Map.of("from", from));
    OrderResponse updated = get(orderId);
    events.publish(orderId, updated);
    log.info(
      "ORDER_PAYMENT_APPROVED orderId={} from={} actor={} channel={} paidAt={} total={}",
      orderId,
      from,
      actor == null ? "admin" : actor,
      updated.channel(),
      updated.paidAt(),
      updated.total()
    );
    publishLifecycle(updated, "PAYMENT_CONFIRMED", from, updated.status(), actor == null ? "admin" : actor, "PAYMENT_APPROVED_SIMULATION");
    enqueueOrderPaid(updated.id(), orderPaidOrigin(updated), updated.paidAt());
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
    String previous = jdbc.queryForObject("select status from orders where id = ?", String.class, orderId);
    OrderStatus previousStatus = OrderStatus.valueOf(previous);
    boolean alreadyInKitchenFlow = isKitchenOrTerminal(previousStatus);
    OrderStatus target = approved
      ? (alreadyInKitchenFlow ? previousStatus : OrderStatus.PAYMENT_APPROVED)
      : failed && !alreadyInKitchenFlow ? OrderStatus.CANCELLED : previousStatus;

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
    OrderResponse updated = get(orderId);
    events.publish(orderId, updated);
    log.info(
      "ORDER_PAYMENT_PROVIDER_UPDATED orderId={} approved={} failed={} providerStatus={} providerPaymentId={} from={} to={} total={}",
      orderId,
      approved,
      failed,
      normalized,
      providerPaymentId,
      previous,
      target.name(),
      updated.total()
    );
    if (approved && !alreadyInKitchenFlow) {
      publishLifecycle(updated, "PAYMENT_CONFIRMED", previous, target.name(), "mercado_pago", "PAYMENT_APPROVED");
      enqueueOrderPaid(updated.id(), orderPaidOrigin(updated), updated.paidAt());
    }
    if (failed && !alreadyInKitchenFlow) {
      publishLifecycle(updated, "ORDER_CANCELLED", previous, target.name(), "mercado_pago", "PAYMENT_FAILED");
    }
  }

  private PriceResult calculate(List<OrderItemRequest> requestedItems) {
    List<Map<String, Object>> priced = requestedItems.stream().map(item -> {
      Map<String, Object> product = jdbc.queryForMap(
        """
        select p.id, p.name, coalesce(pp.sale_price, p.base_price) as base_price
        from products p
        left join pricing_products pp on pp.id = case p.id
          when 'combo-menfis' then 'combo'
          when 'combo-menfis-bacon' then 'bacon-combo'
          when 'combo-menfis-chicken' then 'chicken-combo'
          when 'super-combo-menfis' then 'combo2'
          when 'super-combo-menfis-bacon' then 'bacon-super-combo'
          when 'super-combo-menfis-chicken' then 'chicken-super-combo'
          else p.id
        end and pp.test_mode = ? and pp.active = true
        where p.id = ? and p.active = true
        """,
        settings.testModeEnabled(),
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
      return new CouponResult(null, BigDecimal.ZERO, false);
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
      if ("free_shipping".equalsIgnoreCase(type)) {
        return new CouponResult(String.valueOf(coupon.get("code")), BigDecimal.ZERO, true);
      }
      BigDecimal discount = "percent".equalsIgnoreCase(type)
        ? grossTotal.multiply(value).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP)
        : grossTotal.subtract(value).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
      discount = discount.min(grossTotal.subtract(new BigDecimal("1.00")).max(BigDecimal.ZERO)).setScale(2, RoundingMode.HALF_UP);
      return new CouponResult(String.valueOf(coupon.get("code")), discount, false);
    } catch (EmptyResultDataAccessException ignored) {
      if (requestedDiscount != null && requestedDiscount.compareTo(BigDecimal.ZERO) > 0) {
        BigDecimal discount = requestedDiscount
          .min(grossTotal.subtract(new BigDecimal("1.00")).max(BigDecimal.ZERO))
          .setScale(2, RoundingMode.HALF_UP);
        return new CouponResult(code, discount, false);
      }
    }

    return new CouponResult(null, BigDecimal.ZERO, false);
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
      case PAYMENT_PENDING -> to == OrderStatus.PAYMENT_PROOF_PENDING || to == OrderStatus.PAYMENT_APPROVED || to == OrderStatus.PAID || to == OrderStatus.ACCEPTED || to == OrderStatus.IN_PREPARATION || to == OrderStatus.CANCELLED;
      case PAYMENT_PROOF_PENDING -> to == OrderStatus.PAYMENT_APPROVED || to == OrderStatus.PAID || to == OrderStatus.CANCELLED;
      case PAYMENT_APPROVED -> to == OrderStatus.ACCEPTED || to == OrderStatus.IN_PREPARATION || to == OrderStatus.CANCELLED;
      case PAID -> to == OrderStatus.ACCEPTED || to == OrderStatus.IN_PREPARATION || to == OrderStatus.CANCELLED;
      case ACCEPTED -> to == OrderStatus.IN_PREPARATION || to == OrderStatus.CANCELLED;
      case IN_PREPARATION -> to == OrderStatus.READY || to == OrderStatus.CANCELLED;
      case READY -> to == OrderStatus.PICKED_UP || to == OrderStatus.OUT_FOR_DELIVERY || to == OrderStatus.DELIVERED;
      case OUT_FOR_DELIVERY -> to == OrderStatus.DELIVERED;
      case CANCELLED -> to == OrderStatus.PAYMENT_APPROVED || to == OrderStatus.PAID || to == OrderStatus.ACCEPTED;
      default -> false;
    };
  }

  public PricedOrder priceDiningItems(List<OrderItemRequest> requestedItems) {
    if (requestedItems == null || requestedItems.isEmpty()) {
      throw new IllegalArgumentException("order_must_have_at_least_one_item");
    }
    requestedItems.forEach(this::validateProductAddons);
    PriceResult price = calculate(requestedItems);
    return new PricedOrder(price.subtotal(), price.items());
  }

  static boolean receivedHoldElapsed(OffsetDateTime paidAt, OffsetDateTime now) {
    return paidAt != null && !paidAt.plus(RECEIVED_HOLD_DURATION).isAfter(now);
  }

  private OffsetDateTime asOffsetDateTime(Object value) {
    if (value instanceof OffsetDateTime offset) return offset;
    if (value instanceof Timestamp timestamp) return timestamp.toInstant().atOffset(ZoneOffset.UTC);
    return null;
  }

  private boolean isReceivedStatus(OrderStatus status) {
    return status == OrderStatus.PAYMENT_PENDING
      || status == OrderStatus.PAYMENT_PROOF_PENDING
      || status == OrderStatus.PAYMENT_APPROVED
      || status == OrderStatus.PAID
      || status == OrderStatus.ACCEPTED;
  }

  private boolean isKitchenOrTerminal(OrderStatus status) {
    return status == OrderStatus.IN_PREPARATION
      || status == OrderStatus.READY
      || status == OrderStatus.PICKED_UP
      || status == OrderStatus.OUT_FOR_DELIVERY
      || status == OrderStatus.DELIVERED
      || status == OrderStatus.CANCELLED;
  }

  private boolean shouldPublishOrderPaid(OrderStatus from, OrderStatus to) {
    return !isPaymentConfirmedStatus(from) && isPaymentConfirmedStatus(to);
  }

  private boolean isPaymentConfirmedStatus(OrderStatus status) {
    return status == OrderStatus.PAYMENT_APPROVED
      || status == OrderStatus.PAID
      || status == OrderStatus.ACCEPTED;
  }

  private String orderPaidOrigin(OrderResponse order) {
    if (order.paymentMethod() != null && !order.paymentMethod().isBlank()) {
      return order.paymentMethod();
    }
    return order.channel().name();
  }

  private String lifecycleEventType(OrderStatus status) {
    return switch (status) {
      case ACCEPTED -> "ORDER_ACCEPTED";
      case IN_PREPARATION -> "ORDER_IN_PREPARATION";
      case READY -> "ORDER_READY";
      case PICKED_UP -> "ORDER_PICKED_UP";
      case OUT_FOR_DELIVERY -> "ORDER_OUT_FOR_DELIVERY";
      case DELIVERED -> "ORDER_DELIVERED";
      case CANCELLED -> "ORDER_CANCELLED";
      default -> null;
    };
  }

  private void publishLifecycle(
      OrderResponse order,
      String eventType,
      String fromStatus,
      String toStatus,
      String actor,
      String reason) {
    lifecyclePublisher.publish(eventType, order, fromStatus, toStatus, actor, reason);
  }

  private void enqueueOrderPaid(String orderId, String origin, OffsetDateTime paidAt) {
    OffsetDateTime effectivePaidAt = paidAt == null ? OffsetDateTime.now() : paidAt;
    log.info("ORDER_PAID_OUTBOX_READY orderId={} origin={} paidAt={}", orderId, origin, effectivePaidAt);
    orderPublisher.enqueueOrderPaid(orderId, origin, effectivePaidAt);
  }

  private OrderResponse mapOrder(ResultSet rs, int rowNum) throws SQLException {
    return new OrderResponse(
      rs.getString("id"),
      rs.getLong("number"),
      rs.getString("delivery_code"),
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
      offset(rs, "updated_at"),
      rs.getString("status"),
      offset(rs, "paid_at"),
      offset(rs, "confirmed_at"),
      null,
      rs.getString("dining_table_name")
    );
  }

  private OrderResponse withTrackingToken(OrderResponse order, String trackingToken) {
    return new OrderResponse(
      order.id(), order.number(), order.deliveryCode(), order.items(), order.channel(), order.deliveryType(),
      order.customerName(), order.customerPhone(), order.customerAddress(), order.subtotal(), order.deliveryFee(),
      order.couponCode(), order.discountTotal(), order.total(), order.paymentProvider(), order.paymentMethod(),
      order.paymentStatus(), order.paymentId(), order.timestamp(), order.createdAt(), order.updatedAt(), order.status(),
      order.paidAt(), order.confirmedAt(), trackingToken, order.diningTableName()
    );
  }

  private OrderResponse rotateTrackingToken(OrderResponse order) {
    String trackingToken = randomToken(32);
    jdbc.update(
      "update orders set tracking_token_hash = ?, updated_at = now() where id = ?",
      sha256(trackingToken),
      order.id()
    );
    return withTrackingToken(order, trackingToken);
  }

  private String randomToken(int byteCount) {
    byte[] bytes = new byte[byteCount];
    SECURE_RANDOM.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private String randomDeliveryCode() {
    String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    StringBuilder code = new StringBuilder(6);
    for (int i = 0; i < 6; i++) code.append(alphabet.charAt(SECURE_RANDOM.nextInt(alphabet.length())));
    return code.toString();
  }

  private String sha256(String value) {
    try {
      return java.util.HexFormat.of().formatHex(
        MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
      );
    } catch (java.security.NoSuchAlgorithmException ex) {
      throw new IllegalStateException("sha256_unavailable", ex);
    }
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

  private boolean isKioskOnlyItem(OrderItemRequest item) {
    return isLemonadeItem(item)
      || (item != null && "chicken-menfis-salad".equals(item.productId()));
  }

  private boolean isLemonadeItem(OrderItemRequest item) {
    return item != null && item.productId() != null && item.productId().endsWith("-lemonade");
  }

  private boolean isSaladItem(OrderItemRequest item) {
    return item != null && "chicken-menfis-salad".equals(item.productId());
  }

  private void validateProductAddons(OrderItemRequest item) {
    if (item == null || item.addonIds() == null) return;
    boolean lemonade = isLemonadeItem(item);
    boolean salad = isSaladItem(item);
    boolean invalid = item.addonIds().stream().anyMatch(addonId -> {
      boolean lemonadeTopping = "topping-chantilly".equals(addonId)
        || "topping-espuma-ginger".equals(addonId)
        || "adicional-vodka".equals(addonId)
        || "adicional-cachaca".equals(addonId)
        || "lemonade-sem-alcool".equals(addonId);
      boolean saladLemonade = "salad-pink-lemonade".equals(addonId)
        || "salad-purple-lemonade".equals(addonId)
        || "salad-sunset-lemonade".equals(addonId)
        || "salad-coca-zero".equals(addonId)
        || "salad-guarana-zero".equals(addonId)
        || "salad-agua-com-gas".equals(addonId)
        || "salad-protein-frango".equals(addonId)
        || "salad-protein-carne".equals(addonId);
      if (lemonade) return !lemonadeTopping;
      if (salad) return !saladLemonade;
      return lemonadeTopping || saladLemonade;
    });
    if (invalid) throw new IllegalArgumentException("invalid_product_addon");
    if (salad) {
      long proteins = item.addonIds().stream()
        .filter(addonId -> "salad-protein-frango".equals(addonId) || "salad-protein-carne".equals(addonId))
        .count();
      if (proteins != 1) throw new IllegalArgumentException("salad_protein_required");
    }
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
  public record PricedOrder(BigDecimal subtotal, List<Map<String, Object>> items) {}
  private record CouponResult(String code, BigDecimal discount, boolean freeShipping) {}
}
