package com.menfis.delivery.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menfis.delivery.dto.ApiDtos.OrderResponse;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class OrderLifecycleEventPublisher {
  private static final Logger log = LoggerFactory.getLogger(OrderLifecycleEventPublisher.class);

  private final RabbitTemplate rabbit;
  private final ObjectMapper mapper;
  private final JdbcTemplate jdbc;

  @Value("${menfis.rabbitmq.orders-exchange}")
  private String exchange;

  @Value("${menfis.rabbitmq.lifecycle-routing-key}")
  private String lifecycleRoutingKey;

  public OrderLifecycleEventPublisher(RabbitTemplate rabbit, ObjectMapper mapper, JdbcTemplate jdbc) {
    this.rabbit = rabbit;
    this.mapper = mapper;
    this.jdbc = jdbc;
  }

  public void publish(
      String eventType,
      OrderResponse order,
      String fromStatus,
      String toStatus,
      String actor,
      String reason) {
    UUID eventId = UUID.randomUUID();
    OffsetDateTime occurredAt = OffsetDateTime.now();
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("eventType", eventType);
    payload.put("orderId", order.id());
    payload.put("number", order.number());
    payload.put("fromStatus", fromStatus);
    payload.put("toStatus", toStatus);
    payload.put("origin", origin(order));
    payload.put("actor", actor);
    payload.put("reason", reason);
    payload.put("channel", order.channel().name());
    payload.put("deliveryType", order.deliveryType().name());
    payload.put("paymentMethod", order.paymentMethod());
    payload.put("paymentStatus", order.paymentStatus());
    payload.put("total", order.total());

    OrderLifecycleEvent event = new OrderLifecycleEvent(
      eventId.toString(),
      eventType,
      order.id(),
      fromStatus,
      toStatus,
      origin(order),
      actor,
      reason,
      occurredAt,
      payload
    );

    jdbc.update(
      """
      insert into order_lifecycle_event_log(
        id, event_type, order_id, from_status, to_status, origin, actor, reason, payload, published_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?)
      """,
      eventId,
      eventType,
      order.id(),
      fromStatus,
      toStatus,
      origin(order),
      actor,
      reason,
      json(payload),
      occurredAt
    );

    Runnable publish = () -> {
      rabbit.convertAndSend(
        exchange,
        lifecycleRoutingKey,
        event,
        message -> {
          message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
          message.getMessageProperties().setContentType("application/json");
          message.getMessageProperties().setHeader("eventType", event.eventType());
          message.getMessageProperties().setMessageId(event.eventType() + ":" + event.eventId());
          return message;
        }
      );
      log.info(
        "ORDER_LIFECYCLE published eventId={} eventType={} orderId={} from={} to={} origin={}",
        event.eventId(),
        event.eventType(),
        event.orderId(),
        event.fromStatus(),
        event.toStatus(),
        event.origin()
      );
    };

    if (!TransactionSynchronizationManager.isSynchronizationActive()) {
      publish.run();
      return;
    }
    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
      @Override
      public void afterCommit() {
        publish.run();
      }
    });
  }

  private String origin(OrderResponse order) {
    if (order.paymentMethod() != null && !order.paymentMethod().isBlank()) {
      return order.paymentMethod();
    }
    return order.channel().name();
  }

  private String json(Map<String, Object> payload) {
    try {
      return mapper.writeValueAsString(payload);
    } catch (JsonProcessingException ex) {
      return "{}";
    }
  }
}
