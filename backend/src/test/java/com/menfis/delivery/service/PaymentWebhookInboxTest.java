package com.menfis.delivery.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

class PaymentWebhookInboxTest {
  private JdbcTemplate jdbc;
  private PaymentService service;

  @BeforeEach
  void setUp() {
    jdbc = org.mockito.Mockito.mock(JdbcTemplate.class);
    service = new PaymentService(
      jdbc,
      new ObjectMapper(),
      org.mockito.Mockito.mock(OrderService.class),
      RestClient.builder()
    );
    ReflectionTestUtils.setField(service, "accessToken", "");
    ReflectionTestUtils.setField(service, "webhookSecret", "");
  }

  @Test
  void failedEventCanBeClaimedAgainWhenMercadoPagoRedeliversIt() {
    when(jdbc.queryForObject(anyString(), eq(Boolean.class), any(), any())).thenReturn(true);
    var payload = new ObjectMapper().createObjectNode()
      .put("type", "payment")
      .set("data", new ObjectMapper().createObjectNode().put("id", "123456"));

    assertThrows(IllegalStateException.class, () ->
      service.processMercadoPagoWebhook("event-1", "123456", null, null, payload));
    assertThrows(IllegalStateException.class, () ->
      service.processMercadoPagoWebhook("event-1", "123456", null, null, payload));

    verify(jdbc, times(2)).update(
      contains("insert into webhook_events"), any(), any(), any(), any());
    verify(jdbc, times(2)).update(
      anyString(), eq("mercado_pago_not_configured"), eq("event-1"));
  }

  @Test
  void alreadyProcessedEventIsNotProcessedAgain() {
    when(jdbc.queryForObject(anyString(), eq(Boolean.class), any(), any())).thenReturn(false);
    var payload = new ObjectMapper().createObjectNode()
      .put("type", "payment")
      .set("data", new ObjectMapper().createObjectNode().put("id", "123456"));

    assertDoesNotThrow(() ->
      service.processMercadoPagoWebhook("event-processed", "123456", null, null, payload));

    verify(jdbc, never()).update(contains("set status = 'FAILED'"), any(), any());
    verify(jdbc, never()).update(contains("set status = 'PROCESSED'"), (Object[]) any());
  }
}
