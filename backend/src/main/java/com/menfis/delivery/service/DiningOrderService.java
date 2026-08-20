package com.menfis.delivery.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menfis.delivery.domain.TableLightState;
import com.menfis.delivery.dto.ApiDtos.OrderItemRequest;
import com.menfis.delivery.dto.DiningDtos.DiningOrderResponse;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DiningOrderService {
  private static final Set<String> PAYMENT_METHODS = Set.of("CARTAO", "DINHEIRO", "PIX_MANUAL", "OUTRO");

  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;
  private final DiningService dining;
  private final OrderService orders;
  private final PricingService pricing;
  private final SettingsService settings;
  private final AuditService audit;
  private final OrderEventService events;

  public DiningOrderService(
      JdbcTemplate jdbc,
      ObjectMapper mapper,
      DiningService dining,
      OrderService orders,
      PricingService pricing,
      SettingsService settings,
      AuditService audit,
      OrderEventService events) {
    this.jdbc = jdbc;
    this.mapper = mapper;
    this.dining = dining;
    this.orders = orders;
    this.pricing = pricing;
    this.settings = settings;
    this.audit = audit;
    this.events = events;
  }

  @Transactional
  public DiningOrderResponse createAndRequestPayment(
      String qrToken,
      List<OrderItemRequest> requestedItems,
      String clientIdempotencyKey) {
    DiningService.DiningOrderContext context = dining.resolveOrderContext(qrToken);
    if (context.customerName() == null || context.customerName().isBlank()) {
      throw new IllegalStateException("dining_session_customer_required");
    }
    String idempotencyKey = diningIdempotency(context.sessionId(), clientIdempotencyKey);
    DiningOrderResponse existing = findByIdempotency(idempotencyKey, context.sessionId());
    if (existing != null) return existing;

    OrderService.PricedOrder priced = orders.priceDiningItems(requestedItems);
    if (priced.subtotal().compareTo(BigDecimal.ZERO) <= 0) {
      throw new IllegalArgumentException("invalid_order_total");
    }

    long number = jdbc.queryForObject("select nextval('order_number_seq')", Long.class);
    String orderId = "#" + number;
    UUID publicId = UUID.randomUUID();
    int inserted = jdbc.update(
      """
      insert into orders(
        id, public_id, number, items, channel, delivery_type, fulfillment_type, dining_session_id,
        customer_name, subtotal, delivery_fee, total, payment_method, payment_status,
        status, idempotency_key, payment_requested_at, timestamp, test_mode, updated_at
      ) values (?, ?, ?, ?::jsonb, 'DINING_QR', 'RETIRADA', 'COUNTER_PICKUP', ?,
        ?, ?, 0, ?, 'PRESENCIAL', 'requested', 'PAYMENT_REQUESTED', ?, now(), ?, ?, now())
      on conflict (idempotency_key) where idempotency_key is not null do nothing
      """,
      orderId, publicId, number, json(priced.items()), context.sessionId(), context.customerName(),
      priced.subtotal(), priced.subtotal(), idempotencyKey, System.currentTimeMillis(), settings.testModeEnabled()
    );
    if (inserted == 0) {
      DiningOrderResponse concurrent = findByIdempotency(idempotencyKey, context.sessionId());
      if (concurrent != null) return concurrent;
      throw new IllegalStateException("dining_order_idempotency_conflict");
    }

    for (Map<String, Object> item : priced.items()) {
      jdbc.update(
        """
        insert into order_items(order_id, product_id, item_type, name, quantity, unit_price, total_price, metadata)
        values (?, ?, 'PRODUCT', ?, ?, ?, ?, ?::jsonb)
        """,
        orderId, item.get("productId"), item.get("name"), item.get("quantity"),
        item.get("unitPrice"), item.get("totalPrice"), json(item)
      );
    }
    pricing.snapshotOrderCosts(orderId);
    jdbc.update(
      """
      insert into order_status_history(order_id, from_status, to_status, changed_by, reason)
      values (?, null, 'PAYMENT_REQUESTED', 'customer', 'DINING_PAYMENT_REQUESTED')
      """,
      orderId
    );
    audit.log("customer", "DINING_PAYMENT_REQUESTED", "ORDER", orderId, Map.of(
      "sessionId", context.sessionId(), "tableId", context.tableId(), "kitId", context.kitId(),
      "total", priced.subtotal()
    ));
    dining.changeLight(context.kitId(), TableLightState.BLUE, "dining_payment_requested", "customer");
    events.publish(orderId, orders.get(orderId));
    return getByPublicId(qrToken, publicId);
  }

  public DiningOrderResponse getByPublicId(String qrToken, UUID publicOrderId) {
    DiningService.DiningOrderContext context = dining.resolveOrderContext(qrToken);
    return queryResponse(
      " where o.public_id = ? and o.dining_session_id = ? and o.channel = 'DINING_QR'",
      publicOrderId,
      context.sessionId()
    );
  }

  @Transactional
  public DiningOrderResponse confirmPayment(UUID publicOrderId, String rawPaymentMethod, String actor) {
    String paymentMethod = normalizePaymentMethod(rawPaymentMethod);
    Map<String, Object> row = jdbc.queryForMap(
      """
      select o.id, o.status, o.dining_session_id, s.table_kit_id
      from orders o
      join dining_sessions s on s.id = o.dining_session_id
      where o.public_id = ? and o.channel = 'DINING_QR'
      for update of o
      """,
      publicOrderId
    );
    String status = String.valueOf(row.get("status"));
    if ("PAID".equals(status)) return getForStaff(publicOrderId);
    if (!"PAYMENT_REQUESTED".equals(status)) {
      throw new IllegalStateException("dining_payment_not_confirmable:" + status);
    }
    String orderId = String.valueOf(row.get("id"));
    UUID kitId = (UUID) row.get("table_kit_id");
    UUID staffId = actorId(actor);
    int updated = jdbc.update(
      """
      update orders set status = 'PAID', payment_status = 'approved', payment_method = ?,
        paid_at = now(), confirmed_at = now(), payment_confirmed_by_staff_id = ?, updated_at = now()
      where public_id = ? and status = 'PAYMENT_REQUESTED'
      """,
      paymentMethod, staffId, publicOrderId
    );
    if (updated == 0) return getForStaff(publicOrderId);
    jdbc.update(
      """
      insert into order_status_history(order_id, from_status, to_status, changed_by, reason)
      values (?, 'PAYMENT_REQUESTED', 'PAID', ?, 'DINING_PAYMENT_CONFIRMED')
      """,
      orderId, actor
    );
    audit.log(actor, "DINING_PAYMENT_CONFIRMED", "ORDER", orderId, Map.of("paymentMethod", paymentMethod));
    dining.changeLight(kitId, TableLightState.NORMAL, "dining_payment_confirmed", actor);
    events.publish(orderId, orders.get(orderId));
    return getForStaff(publicOrderId);
  }

  public DiningOrderResponse getForStaff(UUID publicOrderId) {
    return queryResponse(" where o.public_id = ? and o.channel = 'DINING_QR'", publicOrderId);
  }

  public List<DiningOrderResponse> listActiveForStaff() {
    return jdbc.query(
      responseSelect() + " where o.channel = 'DINING_QR' and o.status not in ('DELIVERED', 'CANCELLED') order by o.created_at",
      this::mapResponse
    );
  }

  private DiningOrderResponse findByIdempotency(String key, UUID sessionId) {
    try {
      return queryResponse(
        " where o.idempotency_key = ? and o.dining_session_id = ? and o.channel = 'DINING_QR'",
        key,
        sessionId
      );
    } catch (EmptyResultDataAccessException ex) {
      return null;
    }
  }

  private DiningOrderResponse queryResponse(String where, Object... args) {
    return jdbc.queryForObject(
      responseSelect() + where,
      this::mapResponse,
      args
    );
  }

  private String responseSelect() {
    return """
      select o.public_id, o.number, o.status, o.customer_name, o.items, o.total,
        o.payment_requested_at, o.payment_method, t.name table_name, k.light_state
      from orders o
      join dining_sessions s on s.id = o.dining_session_id
      join dining_tables t on t.id = s.table_id
      join table_kits k on k.id = s.table_kit_id
      """;
  }

  private DiningOrderResponse mapResponse(ResultSet rs, int row) throws SQLException {
    return new DiningOrderResponse(
      rs.getObject("public_id", UUID.class), rs.getLong("number"), rs.getString("status"),
      rs.getString("table_name"), rs.getString("customer_name"), readItems(rs.getString("items")),
      rs.getBigDecimal("total"), rs.getObject("payment_requested_at", OffsetDateTime.class),
      rs.getString("payment_method"), rs.getString("light_state")
    );
  }

  static String diningIdempotency(UUID sessionId, String rawKey) {
    String key = rawKey == null ? "" : rawKey.trim();
    if (key.isBlank() || key.length() > 120 || !key.matches("[A-Za-z0-9._:-]+")) {
      throw new IllegalArgumentException("invalid_idempotency_key");
    }
    return "dining:" + sessionId + ":" + key;
  }

  static String normalizePaymentMethod(String value) {
    String normalized = value == null ? "" : value.trim().toUpperCase();
    if (!PAYMENT_METHODS.contains(normalized)) throw new IllegalArgumentException("invalid_dining_payment_method");
    return normalized;
  }

  private UUID actorId(String actor) {
    try {
      return jdbc.queryForObject("select id from admins where lower(login) = lower(?) and active", UUID.class, actor);
    } catch (EmptyResultDataAccessException ex) {
      return null;
    }
  }

  private String json(Object value) {
    try {
      return mapper.writeValueAsString(value);
    } catch (JsonProcessingException ex) {
      throw new IllegalArgumentException("invalid_dining_order_json", ex);
    }
  }

  private List<Map<String, Object>> readItems(String value) {
    try {
      return mapper.readValue(value, new TypeReference<>() {});
    } catch (JsonProcessingException ex) {
      return List.of();
    }
  }
}
