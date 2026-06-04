package com.menfis.delivery.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menfis.delivery.dto.ApiDtos.PixResponse;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PaymentService {
  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;
  private final OrderService orders;
  private final RestClient restClient;

  @Value("${menfis.mercado-pago-access-token}")
  private String accessToken;

  @Value("${menfis.frontend-url}")
  private String frontendUrl;

  @Value("${menfis.backend-url}")
  private String backendUrl;

  @Value("${menfis.mercado-pago-webhook-secret:}")
  private String webhookSecret;

  public PaymentService(JdbcTemplate jdbc, ObjectMapper mapper, OrderService orders, RestClient.Builder builder) {
    this.jdbc = jdbc;
    this.mapper = mapper;
    this.orders = orders;
    this.restClient = builder.baseUrl("https://api.mercadopago.com").build();
  }

  public PixResponse createPix(String orderId) {
    if (accessToken == null || accessToken.isBlank()) {
      throw new IllegalStateException("MERCADO_PAGO_ACCESS_TOKEN is required");
    }
    var order = orders.get(orderId);
    String encodedOrderId = URLEncoder.encode(order.id(), StandardCharsets.UTF_8);
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("items", List.of(Map.of(
        "title", "Pedido " + order.id() + " - Menfi's Burger",
        "quantity", 1,
        "currency_id", "BRL",
        "unit_price", order.total()
      )));
    payload.put("external_reference", order.id());
    String notificationUrl = notificationUrl();
    if (notificationUrl != null) {
      payload.put("notification_url", notificationUrl);
    }
    payload.put("back_urls", Map.of(
        "success", frontendUrl + "/?payment=success&orderId=" + encodedOrderId,
        "failure", frontendUrl + "/?payment=failure&orderId=" + encodedOrderId,
        "pending", frontendUrl + "/?payment=pending&orderId=" + encodedOrderId
      ));
    payload.put("statement_descriptor", "MENFISBURGUER");
    if (frontendUrl != null && frontendUrl.startsWith("https://")) {
      payload.put("auto_return", "approved");
    }

    String paymentMethod = order.paymentMethod() == null ? "" : order.paymentMethod().toUpperCase();
    if ("PIX".equals(paymentMethod)) {
      payload.put("payment_methods", Map.of(
        "excluded_payment_types", List.of(
          Map.of("id", "credit_card"),
          Map.of("id", "debit_card"),
          Map.of("id", "ticket"),
          Map.of("id", "atm")
        ),
        "installments", 1
      ));
    } else if ("CARTAO".equals(paymentMethod)) {
      payload.put("payment_methods", Map.of(
        "excluded_payment_types", List.of(
          Map.of("id", "ticket"),
          Map.of("id", "atm"),
          Map.of("id", "bank_transfer")
        )
      ));
    }

    JsonNode response = restClient.post()
      .uri("/checkout/preferences")
      .header("Authorization", "Bearer " + accessToken)
      .contentType(MediaType.APPLICATION_JSON)
      .body(payload)
      .retrieve()
      .body(JsonNode.class);

    String preferenceId = response.path("id").asText();
    String checkoutUrl = response.path("init_point").asText(null);
    String sandboxUrl = response.path("sandbox_init_point").asText(null);
    jdbc.update(
      """
      insert into payments(order_id, provider, provider_preference_id, method, status, amount, checkout_url, raw_payload)
      values (?, 'MERCADO_PAGO', ?, ?, 'pending', ?, ?, ?::jsonb)
      """,
      order.id(),
      preferenceId,
      order.paymentMethod(),
      order.total(),
      checkoutUrl == null ? sandboxUrl : checkoutUrl,
      response.toString()
    );
    return new PixResponse(order.id(), checkoutUrl, sandboxUrl, preferenceId);
  }

  public void processMercadoPagoWebhook(String eventId, String dataId, String xSignature, String xRequestId, JsonNode payload) {
    validateWebhookSignature(dataId, xSignature, xRequestId);

    if (eventId == null || eventId.isBlank()) eventId = payload.path("id").asText();
    if (eventId == null || eventId.isBlank()) eventId = java.util.UUID.randomUUID().toString();
    int inserted = jdbc.update(
      "insert into webhook_events(id, provider, event_type, payload) values (?, 'MERCADO_PAGO', ?, ?::jsonb) on conflict (id) do nothing",
      eventId,
      payload.path("type").asText(null),
      payload.toString()
    );
    if (inserted == 0) return;

    String paymentId = payload.path("data").path("id").asText("");
    if (paymentId.isBlank() && dataId != null) paymentId = dataId;
    if (paymentId.isBlank()) paymentId = payload.path("id").asText("");
    if (paymentId.isBlank() || accessToken == null || accessToken.isBlank()) return;

    JsonNode payment = restClient.get()
      .uri("/v1/payments/{id}", paymentId)
      .header("Authorization", "Bearer " + accessToken)
      .retrieve()
      .body(JsonNode.class);

    String orderId = payment.path("external_reference").asText("");
    String status = payment.path("status").asText("unknown");
    if (!orderId.isBlank()) {
      orders.markPaid(orderId, payment.path("id").asText(paymentId), status);
      jdbc.update(
        "update payments set provider_payment_id = ?, status = ?, raw_payload = ?::jsonb, updated_at = now() where order_id = ?",
        payment.path("id").asText(paymentId),
        status,
        payment.toString(),
        orderId
      );
    }
  }

  private String notificationUrl() {
    if (backendUrl == null || !backendUrl.startsWith("https://")) return null;
    String separator = backendUrl.contains("?") ? "&" : "?";
    return backendUrl + "/payments/webhook/mercadopago" + separator + "source_news=webhooks";
  }

  private void validateWebhookSignature(String dataId, String xSignature, String xRequestId) {
    if (webhookSecret == null || webhookSecret.isBlank()) return;
    if (xSignature == null || xSignature.isBlank() || xRequestId == null || xRequestId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mercado Pago webhook signature is missing");
    }

    String ts = null;
    String v1 = null;
    for (String part : xSignature.split(",")) {
      String[] keyValue = part.split("=", 2);
      if (keyValue.length != 2) continue;
      String key = keyValue[0].trim();
      String value = keyValue[1].trim();
      if ("ts".equals(key)) ts = value;
      if ("v1".equals(key)) v1 = value;
    }

    if (ts == null || v1 == null) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mercado Pago webhook signature is incomplete");
    }

    String id = dataId == null ? "" : dataId.toLowerCase();
    String signedTemplate = "id:" + id + ";request-id:" + xRequestId + ";ts:" + ts + ";";
    try {
      Mac hmac = Mac.getInstance("HmacSHA256");
      hmac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      String expected = HexFormat.of().formatHex(hmac.doFinal(signedTemplate.getBytes(StandardCharsets.UTF_8)));
      if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), v1.getBytes(StandardCharsets.UTF_8))) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mercado Pago webhook signature is invalid");
      }
    } catch (ResponseStatusException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mercado Pago webhook signature validation failed", ex);
    }
  }
}
