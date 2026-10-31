package com.menfis.delivery.service;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.menfis.delivery.domain.*;
import com.menfis.delivery.dto.ApiDtos.CreateOrderRequest;
import com.menfis.delivery.dto.ApiDtos.OrderItemRequest;
import com.menfis.delivery.messaging.OrderEventPublisher;
import com.menfis.delivery.messaging.OrderLifecycleEventPublisher;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class HalloweenOrderModeTest {
  @Test
  void eventAccountBypassesClosedAndSoldOutRulesEvenIfClientSendsDelivery() {
    JdbcTemplate jdbc = mock(JdbcTemplate.class);
    SettingsService settings = mock(SettingsService.class);
    OrderService orders = new OrderService(jdbc, new ObjectMapper(), mock(AuditService.class),
      mock(OrderEventService.class), settings, mock(CustomerService.class), mock(OrderEventPublisher.class),
      mock(OrderLifecycleEventPublisher.class), mock(PricingService.class));
    when(jdbc.queryForObject(
      "select exists (select 1 from customers where id = ? and lower(email) = 'halloween@gmail.com')",
      Boolean.class, 42L)).thenReturn(true);
    // Stop before writes. A closed delivery order would fail before reaching this point.
    IllegalStateException reachedPricing = new IllegalStateException("test_before_any_write");
    when(jdbc.queryForObject("select nextval('order_number_seq')", Long.class)).thenThrow(reachedPricing);
    CreateOrderRequest request = new CreateOrderRequest(
      List.of(new OrderItemRequest("menfis-monster", "Monster", 1, List.of(), Map.of())),
      OrderChannel.DELIVERY, DeliveryType.DELIVERY, PaymentMethod.PRESENCIAL,
      "Halloween", null, null, null, null, null, null);
    assertSame(reachedPricing, assertThrows(IllegalStateException.class, () -> orders.create(request, 42L)));
    verify(settings, never()).isSoldOutNow();
    verify(settings, never()).isOperatingNow();
  }
}
