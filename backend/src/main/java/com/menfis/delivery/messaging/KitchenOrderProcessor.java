package com.menfis.delivery.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menfis.delivery.dto.ApiDtos.OrderResponse;
import com.menfis.delivery.service.AuditService;
import com.menfis.delivery.service.OrderEventService;
import com.menfis.delivery.service.OrderService;
import java.time.OffsetDateTime;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KitchenOrderProcessor {
  private static final Logger log = LoggerFactory.getLogger(KitchenOrderProcessor.class);

  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;
  private final OrderService orders;
  private final OrderEventService events;
  private final AuditService audit;
  private final OrderLifecycleEventPublisher lifecyclePublisher;

  public KitchenOrderProcessor(
      JdbcTemplate jdbc,
      ObjectMapper mapper,
      OrderService orders,
      OrderEventService events,
      AuditService audit,
      OrderLifecycleEventPublisher lifecyclePublisher) {
    this.jdbc = jdbc;
    this.mapper = mapper;
    this.orders = orders;
    this.events = events;
    this.audit = audit;
    this.lifecyclePublisher = lifecyclePublisher;
  }

  @Transactional
  public void process(OrderPaidEvent event) {
    if (!"ORDER_PAID".equals(event.eventType())) {
      throw new IllegalArgumentException("unsupported_event_type:" + event.eventType());
    }

    String payload = payload(event);
    Boolean alreadyProcessed = eventAlreadyProcessed(event, payload);
    if (Boolean.TRUE.equals(alreadyProcessed)) {
      log.info("ORDER_PAID ignored because it was already processed orderId={}", event.orderId());
      return;
    }

    Map<String, Object> order;
    try {
      order = jdbc.queryForMap(
        "select id, status, channel, paid_at from orders where id = ?",
        event.orderId()
      );
    } catch (EmptyResultDataAccessException ex) {
      markProcessed(event);
      log.warn("ORDER_PAID ignored because order does not exist orderId={}", event.orderId());
      return;
    }

    String currentStatus = String.valueOf(order.get("status"));
    if (isKitchenOrTerminalStatus(currentStatus)) {
      markProcessed(event);
      log.info("ORDER_PAID ignored orderId={} status={}", event.orderId(), currentStatus);
      return;
    }

    if (!("PAYMENT_APPROVED".equals(currentStatus) || "PAID".equals(currentStatus) || "ACCEPTED".equals(currentStatus))) {
      throw new IllegalStateException("order_not_payment_approved:" + event.orderId() + ":" + currentStatus);
    }

    int updated = jdbc.update(
      """
      update orders
      set status = 'IN_PREPARATION',
          paid_at = coalesce(paid_at, ?),
          confirmed_at = coalesce(confirmed_at, ?),
          updated_at = now()
      where id = ?
        and status in ('PAYMENT_APPROVED', 'PAID', 'ACCEPTED')
      """,
      event.paidAt(),
      OffsetDateTime.now(),
      event.orderId()
    );

    if (updated == 0) {
      markProcessed(event);
      log.info("ORDER_PAID ignored after concurrent status change orderId={}", event.orderId());
      return;
    }

    jdbc.update(
      "insert into order_status_history(order_id, from_status, to_status, changed_by, reason) values (?, ?, 'IN_PREPARATION', 'rabbitmq', 'ORDER_PAID')",
      event.orderId(),
      currentStatus
    );
    markProcessed(event);
    audit.log("rabbitmq", "ORDER_SENT_TO_KITCHEN", "ORDER", event.orderId(), Map.of("from", currentStatus, "event", event.eventType()));
    OrderResponse updatedOrder = orders.get(event.orderId());
    events.publish(event.orderId(), updatedOrder);
    lifecyclePublisher.publish(
      "ORDER_IN_PREPARATION",
      updatedOrder,
      currentStatus,
      "IN_PREPARATION",
      "rabbitmq",
      "ORDER_PAID"
    );
    log.info("ORDER_PAID processed orderId={} from={} to=IN_PREPARATION", event.orderId(), currentStatus);
  }

  private Boolean eventAlreadyProcessed(OrderPaidEvent event, String payload) {
    try {
      return jdbc.queryForObject(
        "select processed from order_event_log where event_type = ? and order_id = ? for update",
        Boolean.class,
        event.eventType(),
        event.orderId()
      );
    } catch (EmptyResultDataAccessException ex) {
      jdbc.update(
        "insert into order_event_log(event_type, order_id, payload, processed) values (?, ?, ?::jsonb, false)",
        event.eventType(),
        event.orderId(),
        payload
      );
      return false;
    }
  }

  private void markProcessed(OrderPaidEvent event) {
    jdbc.update(
      "update order_event_log set processed = true, processed_at = now() where event_type = ? and order_id = ?",
      event.eventType(),
      event.orderId()
    );
  }

  private boolean isKitchenOrTerminalStatus(String status) {
    return "IN_PREPARATION".equals(status)
      || "READY".equals(status)
      || "OUT_FOR_DELIVERY".equals(status)
      || "DELIVERED".equals(status)
      || "CANCELLED".equals(status);
  }

  private String payload(OrderPaidEvent event) {
    try {
      return mapper.writeValueAsString(event);
    } catch (JsonProcessingException ex) {
      throw new IllegalArgumentException("invalid_order_paid_payload", ex);
    }
  }
}
