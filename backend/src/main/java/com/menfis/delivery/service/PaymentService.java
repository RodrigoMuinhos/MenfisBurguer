package com.menfis.delivery.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menfis.delivery.dto.ApiDtos.PixResponse;
import java.net.URLEncoder;
import java.math.BigDecimal;
import java.math.RoundingMode;
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

  @Value("${menfis.default-payer-email:test_user_br@testuser.com}")
  private String defaultPayerEmail;

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
    String paymentMethod = order.paymentMethod() == null ? "" : order.paymentMethod().toUpperCase();
    if ("PIX".equals(paymentMethod)) {
      return createPixOrder(order);
    }

    String encodedOrderId = URLEncoder.encode(order.id(), StandardCharsets.UTF_8);
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("items", List.of(Map.of(
        "title", "Pedido " + order.id() + " - Menfi's Burger",
        "quantity", 1,
        "currency_id", "BRL",
        "unit_price", order.total()
      )));
    payload.put("external_reference", mercadoPagoExternalReference(order.id()));
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

    if ("CARTAO".equals(paymentMethod)) {
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
    return new PixResponse(order.id(), checkoutUrl, sandboxUrl, preferenceId, null, null, "pending", null, null, null, null);
  }

  private PixResponse createPixOrder(com.menfis.delivery.dto.ApiDtos.OrderResponse order) {
    String amount = money(order.total());
    String idempotencyKey = java.util.UUID.randomUUID().toString();
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("type", "online");
    payload.put("total_amount", amount);
    payload.put("external_reference", mercadoPagoExternalReference(order.id()));
    payload.put("processing_mode", "automatic");
    payload.put("transactions", Map.of(
      "payments", List.of(Map.of(
        "amount", amount,
        "payment_method", Map.of(
          "id", "pix",
          "type", "bank_transfer"
        ),
        "expiration_time", "PT30M"
      ))
    ));
    payload.put("payer", Map.of(
      "email", defaultPayerEmail == null || defaultPayerEmail.isBlank() ? "test_user_br@testuser.com" : defaultPayerEmail
    ));

    JsonNode response = restClient.post()
      .uri("/v1/orders")
      .header("Authorization", "Bearer " + accessToken)
      .header("X-Idempotency-Key", idempotencyKey)
      .contentType(MediaType.APPLICATION_JSON)
      .body(payload)
      .retrieve()
      .body(JsonNode.class);

    JsonNode payment = response.path("transactions").path("payments").path(0);
    JsonNode method = payment.path("payment_method");
    String mpOrderId = response.path("id").asText(null);
    String providerPaymentId = payment.path("id").asText(null);
    String status = payment.path("status").asText(response.path("status").asText("action_required"));
    String statusDetail = payment.path("status_detail").asText(response.path("status_detail").asText(null));
    String ticketUrl = method.path("ticket_url").asText(null);
    String qrCode = method.path("qr_code").asText(null);
    String qrCodeBase64 = method.path("qr_code_base64").asText(null);

    jdbc.update(
      """
      insert into payments(order_id, provider, provider_payment_id, provider_preference_id, method, status, amount, checkout_url, qr_code, raw_payload)
      values (?, 'MERCADO_PAGO', ?, ?, ?, ?, ?, ?, ?, ?::jsonb)
      """,
      order.id(),
      providerPaymentId,
      mpOrderId,
      order.paymentMethod(),
      status,
      order.total(),
      ticketUrl,
      qrCode,
      response.toString()
    );

    jdbc.update(
      "update orders set payment_status = ?, payment_id = ?, updated_at = now() where id = ?",
      status,
      providerPaymentId == null ? mpOrderId : providerPaymentId,
      order.id()
    );

    return new PixResponse(order.id(), ticketUrl, null, null, mpOrderId, providerPaymentId, status, statusDetail, ticketUrl, qrCode, qrCodeBase64);
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

    if (paymentId.startsWith("ORD")) {
      processMercadoPagoOrder(paymentId);
      return;
    }

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

  private void processMercadoPagoOrder(String mercadoPagoOrderId) {
    JsonNode mpOrder = restClient.get()
      .uri("/v1/orders/{id}", mercadoPagoOrderId)
      .header("Authorization", "Bearer " + accessToken)
      .retrieve()
      .body(JsonNode.class);

    String orderId = internalOrderId(mpOrder.path("external_reference").asText(""));
    if (orderId.isBlank()) return;

    JsonNode payment = mpOrder.path("transactions").path("payments").path(0);
    String providerPaymentId = payment.path("id").asText(mercadoPagoOrderId);
    String status = normalizeOrderPaymentStatus(mpOrder, payment);
    orders.markPaid(orderId, providerPaymentId, status);
    jdbc.update(
      "update payments set provider_payment_id = ?, status = ?, raw_payload = ?::jsonb, updated_at = now() where order_id = ?",
      providerPaymentId,
      status,
      mpOrder.toString(),
      orderId
    );
  }

  private String normalizeOrderPaymentStatus(JsonNode mpOrder, JsonNode payment) {
    String orderStatus = mpOrder.path("status").asText("");
    String orderDetail = mpOrder.path("status_detail").asText("");
    String paymentStatus = payment.path("status").asText("");
    String paymentDetail = payment.path("status_detail").asText("");

    if ("processed".equalsIgnoreCase(orderStatus)
      || "accredited".equalsIgnoreCase(orderDetail)
      || "approved".equalsIgnoreCase(paymentStatus)
      || "accredited".equalsIgnoreCase(paymentDetail)) {
      return "approved";
    }
    if ("failed".equalsIgnoreCase(orderStatus)
      || "cancelled".equalsIgnoreCase(orderStatus)
      || "expired".equalsIgnoreCase(orderStatus)
      || "refunded".equalsIgnoreCase(orderStatus)
      || "charged_back".equalsIgnoreCase(orderStatus)) {
      return orderStatus;
    }
    return paymentStatus == null || paymentStatus.isBlank() ? orderStatus : paymentStatus;
  }

  private String money(BigDecimal value) {
    return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
  }

  private String mercadoPagoExternalReference(String orderId) {
    return "MENFIS-" + orderId.replaceAll("[^0-9A-Za-z_-]", "");
  }

  private String internalOrderId(String externalReference) {
    if (externalReference == null) return "";
    if (externalReference.startsWith("MENFIS-")) {
      String number = externalReference.substring("MENFIS-".length());
      return number.isBlank() ? "" : "#" + number;
    }
    return externalReference;
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
