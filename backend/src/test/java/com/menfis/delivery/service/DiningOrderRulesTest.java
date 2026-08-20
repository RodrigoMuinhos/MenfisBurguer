package com.menfis.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.menfis.delivery.domain.DeliveryType;
import com.menfis.delivery.domain.OrderChannel;
import com.menfis.delivery.domain.PaymentMethod;
import com.menfis.delivery.dto.ApiDtos.CreateOrderRequest;
import com.menfis.delivery.dto.ApiDtos.OrderItemRequest;
import com.menfis.delivery.messaging.OrderEventPublisher;
import com.menfis.delivery.messaging.OrderLifecycleEventPublisher;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class DiningOrderRulesTest {
  @Test
  void scopesIdempotencyToDiningSession() {
    UUID firstSession = UUID.randomUUID();
    UUID secondSession = UUID.randomUUID();

    String firstAttempt = DiningOrderService.diningIdempotency(firstSession, "click-123");
    String repeatedAttempt = DiningOrderService.diningIdempotency(firstSession, "click-123");
    String anotherSession = DiningOrderService.diningIdempotency(secondSession, "click-123");

    assertThat(repeatedAttempt).isEqualTo(firstAttempt);
    assertThat(anotherSession).isNotEqualTo(firstAttempt);
  }

  @Test
  void acceptsOnlyPhysicalDiningPaymentMethods() {
    assertThat(DiningOrderService.normalizePaymentMethod("cartao")).isEqualTo("CARTAO");
    assertThat(DiningOrderService.normalizePaymentMethod("PIX_MANUAL")).isEqualTo("PIX_MANUAL");
    assertThrows(
      IllegalArgumentException.class,
      () -> DiningOrderService.normalizePaymentMethod("MERCADO_PAGO")
    );
  }

  @Test
  void rejectsMalformedIdempotencyKey() {
    assertThrows(
      IllegalArgumentException.class,
      () -> DiningOrderService.diningIdempotency(UUID.randomUUID(), "chave com espaços")
    );
  }

  @Test
  void blocksDiningChannelOnGenericPublicOrderEndpoint() {
    OrderService genericOrders = new OrderService(
      org.mockito.Mockito.mock(JdbcTemplate.class),
      new ObjectMapper(),
      org.mockito.Mockito.mock(AuditService.class),
      org.mockito.Mockito.mock(OrderEventService.class),
      org.mockito.Mockito.mock(SettingsService.class),
      org.mockito.Mockito.mock(CustomerService.class),
      org.mockito.Mockito.mock(OrderEventPublisher.class),
      org.mockito.Mockito.mock(OrderLifecycleEventPublisher.class),
      org.mockito.Mockito.mock(PricingService.class)
    );
    CreateOrderRequest request = new CreateOrderRequest(
      List.of(new OrderItemRequest("combo-menfis", null, 1, List.of(), Map.of())),
      OrderChannel.DINING_QR,
      DeliveryType.RETIRADA,
      PaymentMethod.PRESENCIAL,
      "Cliente",
      null,
      null,
      null,
      "attempt-1",
      null,
      null
    );

    IllegalArgumentException error = assertThrows(
      IllegalArgumentException.class,
      () -> genericOrders.create(request)
    );
    assertThat(error.getMessage()).isEqualTo("use_dining_order_endpoint");
  }
}
