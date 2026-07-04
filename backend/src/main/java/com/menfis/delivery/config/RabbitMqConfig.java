package com.menfis.delivery.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {
  @Value("${menfis.rabbitmq.orders-exchange}")
  private String ordersExchange;

  @Value("${menfis.rabbitmq.kitchen-queue}")
  private String kitchenQueue;

  @Value("${menfis.rabbitmq.kitchen-dlq}")
  private String kitchenDlq;

  @Value("${menfis.rabbitmq.kitchen-dlx}")
  private String kitchenDlx;

  @Value("${menfis.rabbitmq.order-paid-routing-key}")
  private String orderPaidRoutingKey;

  @Value("${menfis.rabbitmq.lifecycle-queue}")
  private String lifecycleQueue;

  @Value("${menfis.rabbitmq.lifecycle-dlq}")
  private String lifecycleDlq;

  @Value("${menfis.rabbitmq.lifecycle-dlx}")
  private String lifecycleDlx;

  @Value("${menfis.rabbitmq.lifecycle-routing-key}")
  private String lifecycleRoutingKey;

  @Bean
  DirectExchange ordersExchange() {
    return new DirectExchange(ordersExchange, true, false);
  }

  @Bean
  DirectExchange kitchenDeadLetterExchange() {
    return new DirectExchange(kitchenDlx, true, false);
  }

  @Bean
  DirectExchange lifecycleDeadLetterExchange() {
    return new DirectExchange(lifecycleDlx, true, false);
  }

  @Bean
  Queue kitchenQueue() {
    return new Queue(
      kitchenQueue,
      true,
      false,
      false,
      Map.of("x-dead-letter-exchange", kitchenDlx, "x-dead-letter-routing-key", "order.paid.dlq")
    );
  }

  @Bean
  Queue kitchenDeadLetterQueue() {
    return new Queue(kitchenDlq, true);
  }

  @Bean
  Queue lifecycleQueue() {
    return new Queue(
      lifecycleQueue,
      true,
      false,
      false,
      Map.of("x-dead-letter-exchange", lifecycleDlx, "x-dead-letter-routing-key", "order.lifecycle.dlq")
    );
  }

  @Bean
  Queue lifecycleDeadLetterQueue() {
    return new Queue(lifecycleDlq, true);
  }

  @Bean
  Binding kitchenBinding(Queue kitchenQueue, DirectExchange ordersExchange) {
    return BindingBuilder.bind(kitchenQueue).to(ordersExchange).with(orderPaidRoutingKey);
  }

  @Bean
  Binding lifecycleBinding(Queue lifecycleQueue, DirectExchange ordersExchange) {
    return BindingBuilder.bind(lifecycleQueue).to(ordersExchange).with(lifecycleRoutingKey);
  }

  @Bean
  Binding kitchenDeadLetterBinding(Queue kitchenDeadLetterQueue, DirectExchange kitchenDeadLetterExchange) {
    return BindingBuilder.bind(kitchenDeadLetterQueue).to(kitchenDeadLetterExchange).with("order.paid.dlq");
  }

  @Bean
  Binding lifecycleDeadLetterBinding(Queue lifecycleDeadLetterQueue, DirectExchange lifecycleDeadLetterExchange) {
    return BindingBuilder.bind(lifecycleDeadLetterQueue).to(lifecycleDeadLetterExchange).with("order.lifecycle.dlq");
  }

  @Bean
  Jackson2JsonMessageConverter jsonMessageConverter(ObjectMapper mapper) {
    return new Jackson2JsonMessageConverter(mapper);
  }

  @Bean
  RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, Jackson2JsonMessageConverter converter) {
    RabbitTemplate template = new RabbitTemplate(connectionFactory);
    template.setMessageConverter(converter);
    return template;
  }

  @Bean
  SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
      ConnectionFactory connectionFactory,
      Jackson2JsonMessageConverter converter) {
    SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
    factory.setConnectionFactory(connectionFactory);
    factory.setMessageConverter(converter);
    factory.setAcknowledgeMode(org.springframework.amqp.core.AcknowledgeMode.MANUAL);
    factory.setPrefetchCount(1);
    factory.setDefaultRequeueRejected(false);
    return factory;
  }
}
