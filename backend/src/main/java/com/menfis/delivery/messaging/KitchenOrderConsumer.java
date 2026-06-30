package com.menfis.delivery.messaging;

import com.rabbitmq.client.Channel;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class KitchenOrderConsumer {
  private static final Logger log = LoggerFactory.getLogger(KitchenOrderConsumer.class);

  private final KitchenOrderProcessor processor;

  public KitchenOrderConsumer(KitchenOrderProcessor processor) {
    this.processor = processor;
  }

  @RabbitListener(queues = "${menfis.rabbitmq.kitchen-queue}")
  public void consume(OrderPaidEvent event, Message message, Channel channel) throws IOException {
    long deliveryTag = message.getMessageProperties().getDeliveryTag();
    try {
      log.info("RabbitMQ received ORDER_PAID orderId={} paidAt={}", event.orderId(), event.paidAt());
      processor.process(event);
      channel.basicAck(deliveryTag, false);
      log.info("RabbitMQ ACK ORDER_PAID orderId={}", event.orderId());
    } catch (Exception ex) {
      log.error("RabbitMQ NACK ORDER_PAID orderId={} sending to DLQ", event == null ? null : event.orderId(), ex);
      channel.basicNack(deliveryTag, false, false);
    }
  }
}
