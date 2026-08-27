package com.menfis.delivery.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OrderEventPublisher {
  private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);

  private final RabbitTemplate rabbit;
  private final ObjectMapper mapper;
  private final JdbcTemplate jdbc;

  @Value("${menfis.rabbitmq.orders-exchange}")
  private String exchange;

  @Value("${menfis.rabbitmq.order-paid-routing-key}")
  private String orderPaidRoutingKey;

  @Value("${menfis.rabbitmq.enabled:true}")
  private boolean rabbitEnabled;

  public OrderEventPublisher(RabbitTemplate rabbit, ObjectMapper mapper, JdbcTemplate jdbc) {
    this.rabbit = rabbit;
    this.mapper = mapper;
    this.jdbc = jdbc;
  }

  public void enqueueOrderPaid(String orderId, String origin, OffsetDateTime paidAt) {
    OrderPaidEvent event = new OrderPaidEvent("ORDER_PAID", orderId, origin, paidAt);
    jdbc.update(
      """
      insert into order_event_outbox(event_type, aggregate_id, origin, occurred_at, payload)
      values ('ORDER_PAID', ?, ?, ?, ?::jsonb)
      on conflict (event_type, aggregate_id) do nothing
      """,
      orderId,
      origin,
      paidAt,
      payload(event)
    );
    log.info("ORDER_PAID stored in transactional outbox orderId={} origin={}", orderId, origin);
  }

  @Scheduled(fixedDelayString = "${menfis.order-outbox-dispatch-delay-ms:5000}", initialDelayString = "${menfis.order-outbox-dispatch-delay-ms:5000}")
  public void dispatchPending() {
    List<Map<String, Object>> pending = jdbc.queryForList(
      """
      select id, aggregate_id, origin, occurred_at
      from order_event_outbox
      where (status in ('PENDING', 'FAILED') and available_at <= now())
         or (status = 'PROCESSING' and processing_started_at < now() - interval '5 minutes')
      order by available_at, created_at
      limit 50
      """
    );
    for (Map<String, Object> row : pending) {
      String outboxId = String.valueOf(row.get("id"));
      if (!claim(outboxId)) continue;
      OrderPaidEvent event = new OrderPaidEvent(
        "ORDER_PAID",
        String.valueOf(row.get("aggregate_id")),
        String.valueOf(row.get("origin")),
        offsetDateTime(row.get("occurred_at"))
      );
      try {
        publish(event);
        jdbc.update(
          "update order_event_outbox set status = 'PUBLISHED', published_at = now(), processing_started_at = null, last_error = null where id = ?::uuid and status = 'PROCESSING'",
          outboxId
        );
      } catch (RuntimeException ex) {
        String error = ex.getMessage() == null ? ex.getClass().getSimpleName() : ex.getMessage();
        jdbc.update(
          """
          update order_event_outbox set status = 'FAILED', processing_started_at = null,
            available_at = now() + (least(power(2, attempts), 300) * interval '1 second'),
            last_error = left(?, 1000)
          where id = ?::uuid and status = 'PROCESSING'
          """,
          error,
          outboxId
        );
        log.error("ORDER_PAID outbox publish failed outboxId={} orderId={}", outboxId, event.orderId(), ex);
      }
    }
  }

  private boolean claim(String outboxId) {
    Boolean claimed = jdbc.queryForObject(
      """
      with claimed as (
        update order_event_outbox
        set status = 'PROCESSING', processing_started_at = now(), attempts = attempts + 1, last_error = null
        where id = ?::uuid and (
          (status in ('PENDING', 'FAILED') and available_at <= now())
          or (status = 'PROCESSING' and processing_started_at < now() - interval '5 minutes')
        )
        returning 1
      ) select exists(select 1 from claimed)
      """,
      Boolean.class,
      outboxId
    );
    return Boolean.TRUE.equals(claimed);
  }

  private void publish(OrderPaidEvent event) {
    if (!rabbitEnabled) {
      log.info("ORDER_PAID desktop mode without RabbitMQ orderId={} origin={}", event.orderId(), event.origin());
      return;
    }
    rabbit.invoke(operations -> {
      operations.convertAndSend(
        exchange,
        orderPaidRoutingKey,
        event,
        message -> {
          message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
          message.getMessageProperties().setContentType("application/json");
          message.getMessageProperties().setHeader("eventType", event.eventType());
          message.getMessageProperties().setMessageId(event.eventType() + ":" + event.orderId());
          return message;
        }
      );
      operations.waitForConfirmsOrDie(5_000L);
      return null;
    });
    log.info("ORDER_PAID published to RabbitMQ exchange={} routingKey={} payload={}", exchange, orderPaidRoutingKey, payload(event));
  }

  private OffsetDateTime offsetDateTime(Object value) {
    if (value instanceof OffsetDateTime dateTime) return dateTime;
    if (value instanceof java.sql.Timestamp timestamp) {
      return timestamp.toInstant().atOffset(java.time.ZoneOffset.UTC);
    }
    throw new IllegalStateException("order_outbox_occurred_at_invalid");
  }

  private String payload(OrderPaidEvent event) {
    try {
      return mapper.writeValueAsString(Map.of(
        "eventType", event.eventType(),
        "orderId", event.orderId(),
        "origin", event.origin(),
        "paidAt", event.paidAt()
      ));
    } catch (JsonProcessingException ex) {
      return event.toString();
    }
  }
}
