package com.menfis.delivery.messaging;

import com.rabbitmq.client.Channel;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class OrderLifecycleEventConsumer {
  private static final Logger log = LoggerFactory.getLogger(OrderLifecycleEventConsumer.class);

  private final JdbcTemplate jdbc;

  public OrderLifecycleEventConsumer(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @RabbitListener(queues = "${menfis.rabbitmq.lifecycle-queue}")
  public void consume(OrderLifecycleEvent event, Message message, Channel channel) throws IOException {
    long deliveryTag = message.getMessageProperties().getDeliveryTag();
    try {
      log.info(
        "ORDER_LIFECYCLE received eventId={} eventType={} orderId={} from={} to={}",
        event.eventId(),
        event.eventType(),
        event.orderId(),
        event.fromStatus(),
        event.toStatus()
      );
      jdbc.update(
        "update order_lifecycle_event_log set consumed = true, consumed_at = now() where id = ?",
        UUID.fromString(event.eventId())
      );
      channel.basicAck(deliveryTag, false);
      log.info("ORDER_LIFECYCLE ACK eventId={} eventType={} orderId={}", event.eventId(), event.eventType(), event.orderId());
    } catch (Exception ex) {
      log.error("ORDER_LIFECYCLE NACK eventId={} orderId={} sending to DLQ", event == null ? null : event.eventId(), event == null ? null : event.orderId(), ex);
      channel.basicNack(deliveryTag, false, false);
    }
  }
}
