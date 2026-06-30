package com.menfis.delivery.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class OrderEventPublisher {
  private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);

  private final RabbitTemplate rabbit;
  private final ObjectMapper mapper;

  @Value("${menfis.rabbitmq.orders-exchange}")
  private String exchange;

  @Value("${menfis.rabbitmq.order-paid-routing-key}")
  private String orderPaidRoutingKey;

  public OrderEventPublisher(RabbitTemplate rabbit, ObjectMapper mapper) {
    this.rabbit = rabbit;
    this.mapper = mapper;
  }

  public void publishOrderPaid(String orderId, String origin, OffsetDateTime paidAt) {
    OrderPaidEvent event = new OrderPaidEvent("ORDER_PAID", orderId, origin, paidAt);
    rabbit.convertAndSend(
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
    log.info("ORDER_PAID published to RabbitMQ exchange={} routingKey={} payload={}", exchange, orderPaidRoutingKey, payload(event));
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
