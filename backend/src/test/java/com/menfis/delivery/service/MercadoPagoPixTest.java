package com.menfis.delivery.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.menfis.delivery.dto.ApiDtos.OrderResponse;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class MercadoPagoPixTest {
  @Test
  void createsAmountBoundPixAndReadsProviderConfirmation() {
    var jdbc = mock(JdbcTemplate.class);
    var orders = mock(OrderService.class);
    var builder = RestClient.builder();
    var server = MockRestServiceServer.bindTo(builder).build();
    var service = new PaymentService(jdbc, new ObjectMapper(), orders, builder);
    ReflectionTestUtils.setField(service, "accessToken", "TEST-token");
    var order = mock(OrderResponse.class);
    when(order.id()).thenReturn("#123");
    when(order.total()).thenReturn(new BigDecimal("27.90"));
    when(order.paymentMethod()).thenReturn("PIX");
    when(order.paymentStatus()).thenReturn("pending");
    when(orders.get("#123")).thenReturn(order);
    server.expect(requestTo("https://api.mercadopago.com/v1/orders"))
      .andExpect(method(HttpMethod.POST))
            .andExpect(jsonPath("$.payer.email").exists())
      .andExpect(jsonPath("$.total_amount").value("27.90"))
      .andExpect(jsonPath("$.transactions.payments[0].payment_method.id").value("pix"))
      .andRespond(withSuccess("""
        {"id":"ORD123","status":"action_required","transactions":{"payments":[
          {"id":"PAY123","status":"action_required","payment_method":{"qr_code":"provider-pix-code","qr_code_base64":"provider-image"}}
        ]}}
        """, MediaType.APPLICATION_JSON));
    server.expect(requestTo("https://api.mercadopago.com/v1/orders/ORD123"))
      .andExpect(method(HttpMethod.GET))
      .andRespond(withSuccess("""
        {"id":"ORD123","external_reference":"MENFIS-123","status":"processed","transactions":{"payments":[
          {"id":"PAY123","status":"processed","status_detail":"accredited","payment_method":{"id":"pix","type":"bank_transfer"}}
        ]}}
        """, MediaType.APPLICATION_JSON));
    var pix = service.createPix("#123");
    assertEquals("provider-pix-code", pix.qrCode());
    assertEquals("provider-image", pix.qrCodeBase64());
    verify(orders, never()).markPaid(anyString(), anyString(), anyString());
    when(jdbc.queryForList(anyString(), eq(String.class), eq("#123"))).thenReturn(List.of("ORD123"));
    service.refreshPix("#123");
    verify(orders).markPaid(eq("#123"), eq("PAY123"), eq("approved"));
    server.verify();
  }

  @Test
  void productionPixSendsOrderPayerEmailAndSurfacesMercadoPagoRejection() {
    var jdbc = mock(JdbcTemplate.class);
    var orders = mock(OrderService.class);
    var builder = RestClient.builder();
    var server = MockRestServiceServer.bindTo(builder).build();
    var service = new PaymentService(jdbc, new ObjectMapper(), orders, builder);
    ReflectionTestUtils.setField(service, "accessToken", "APP-token");
    ReflectionTestUtils.setField(service, "environment", "production");
    ReflectionTestUtils.setField(service, "frontendUrl", "https://www.menfisburguer.com.br");
    ReflectionTestUtils.setField(service, "backendUrl", "https://api.menfisburguer.com.br");
    ReflectionTestUtils.setField(service, "webhookSecret", "secret");
    var order = mock(OrderResponse.class);
    when(order.id()).thenReturn("#77");
    when(order.total()).thenReturn(new BigDecimal("53.90"));
    when(order.paymentMethod()).thenReturn("PIX");
    when(orders.get("#77")).thenReturn(order);
    server.expect(requestTo("https://api.mercadopago.com/v1/orders"))
      .andExpect(jsonPath("$.payer.email").value("pedido77@menfisburguer.com.br"))
      .andRespond(withBadRequest().contentType(MediaType.APPLICATION_JSON).body("""
        {"errors":[{"code":"invalid_collector","message":"collector has no pix key"}]}
        """));
    var error = org.junit.jupiter.api.Assertions.assertThrows(
      IllegalStateException.class, () -> service.createPix("#77"));
    org.junit.jupiter.api.Assertions.assertTrue(error.getMessage().contains("collector has no pix key"));
    server.verify();
  }
}
