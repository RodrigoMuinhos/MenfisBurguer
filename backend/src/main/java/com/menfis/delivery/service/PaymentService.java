package com.menfis.delivery.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menfis.delivery.dto.ApiDtos.ClubPreferenceResponse;
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
import java.util.UUID;
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

  @Value("${menfis.environment:local}")
  private String environment;

  @Value("${menfis.frontend-url}")
  private String frontendUrl;

  @Value("${menfis.backend-url}")
  private String backendUrl;

  @Value("${menfis.mercado-pago-webhook-secret:}")
  private String webhookSecret;

  @Value("${menfis.default-payer-email:}")
  private String defaultPayerEmail;

  @Value("${menfis.default-card-payer-email:}")
  private String defaultCardPayerEmail;

  public PaymentService(JdbcTemplate jdbc, ObjectMapper mapper, OrderService orders, RestClient.Builder builder) {
    this.jdbc = jdbc;
    this.mapper = mapper;
    this.orders = orders;
    this.restClient = builder.baseUrl("https://api.mercadopago.com").build();
  }

  public PixResponse createPix(String orderId) {
    if (accessToken == null || accessToken.isBlank()) {
      throw new IllegalStateException("mercado_pago_not_configured");
    }
    validateEnvironment();
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
    String cardPayerEmail = configuredPayerEmail(defaultCardPayerEmail, "test@testuser.com");
    if (cardPayerEmail != null) {
      payload.put("payer", Map.of("email", cardPayerEmail));
    }
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
    String selectedCheckoutUrl = preferSandboxCheckout() ? sandboxUrl : checkoutUrl;
    if (selectedCheckoutUrl == null || selectedCheckoutUrl.isBlank()) {
      throw new IllegalStateException("Mercado Pago did not return a checkout URL for " + environment);
    }
    jdbc.update(
      """
      insert into payments(order_id, provider, provider_preference_id, method, status, amount, checkout_url, raw_payload)
      values (?, 'MERCADO_PAGO', ?, ?, 'pending', ?, ?, ?::jsonb)
      """,
      order.id(),
      preferenceId,
      order.paymentMethod(),
      order.total(),
      selectedCheckoutUrl,
      response.toString()
    );
    return new PixResponse(order.id(), selectedCheckoutUrl, sandboxUrl, preferenceId, null, null, "pending", null, null, null, null);
  }

  public ClubPreferenceResponse createClubPreference(long customerId, String planId) {
    if (accessToken == null || accessToken.isBlank()) {
      throw new IllegalStateException("mercado_pago_not_configured");
    }
    validateEnvironment();
    ClubPlan plan = clubPlan(planId);
    UUID subscriptionId = UUID.randomUUID();

    jdbc.update(
      """
      insert into customer_club_subscriptions (
        id,
        customer_id,
        plan,
        status,
        payment_status,
        free_shipping_total,
        discount_total,
        updated_at
      )
      values (?, ?, ?, 'pending', 'pending', ?, ?, now())
      """,
      subscriptionId,
      customerId,
      plan.id(),
      plan.freeShippingTotal(),
      plan.discountTotal()
    );

    String externalReference = clubExternalReference(subscriptionId);
    String encodedSubscriptionId = URLEncoder.encode(subscriptionId.toString(), StandardCharsets.UTF_8);
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("items", List.of(Map.of(
      "title", plan.label() + " - Menfi's Burger",
      "quantity", 1,
      "currency_id", "BRL",
      "unit_price", plan.price()
    )));
    payload.put("external_reference", externalReference);
    String notificationUrl = notificationUrl();
    if (notificationUrl != null) payload.put("notification_url", notificationUrl);
    payload.put("back_urls", Map.of(
      "success", frontendUrl + "/?club=success&subscriptionId=" + encodedSubscriptionId,
      "failure", frontendUrl + "/?club=failure&subscriptionId=" + encodedSubscriptionId,
      "pending", frontendUrl + "/?club=pending&subscriptionId=" + encodedSubscriptionId
    ));
    payload.put("statement_descriptor", "MENFISCLUB");
    if (frontendUrl != null && frontendUrl.startsWith("https://")) {
      payload.put("auto_return", "approved");
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
    String selectedCheckoutUrl = preferSandboxCheckout() ? sandboxUrl : checkoutUrl;
    if (selectedCheckoutUrl == null || selectedCheckoutUrl.isBlank()) {
      throw new IllegalStateException("Mercado Pago did not return a checkout URL for " + environment);
    }

    jdbc.update(
      "update customer_club_subscriptions set provider_preference_id = ?, updated_at = now() where id = ?",
      preferenceId,
      subscriptionId
    );

    return new ClubPreferenceResponse(subscriptionId.toString(), selectedCheckoutUrl, sandboxUrl, preferenceId, "pending");
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
    String payerEmail = configuredPayerEmail(defaultPayerEmail, "test_user_br@testuser.com");
    if (payerEmail != null) {
      payload.put("payer", Map.of("email", payerEmail));
    }

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

    String externalReference = payment.path("external_reference").asText("");
    if (externalReference.startsWith("MENFISCLUB-")) {
      processClubPayment(payment, paymentId);
      return;
    }

    String orderId = internalOrderId(externalReference);
    String status = payment.path("status").asText("unknown");
    if (!orderId.isBlank()) {
      updateOrderPaymentMethod(orderId, mercadoPagoPaymentMethod(payment));
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

  private boolean preferSandboxCheckout() {
    return !isProduction();
  }

  private boolean isProduction() {
    return "production".equalsIgnoreCase(environment);
  }

  private String configuredPayerEmail(String configured, String localDefault) {
    if (configured != null && !configured.isBlank()) return configured.trim();
    return isProduction() ? null : localDefault;
  }

  private void validateEnvironment() {
    if (!isProduction()) return;
    if (frontendUrl == null || !frontendUrl.startsWith("https://")) {
      throw new IllegalStateException("Production FRONTEND_URL must use HTTPS");
    }
    if (backendUrl == null || !backendUrl.startsWith("https://")) {
      throw new IllegalStateException("Production BACKEND_URL must use HTTPS");
    }
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
    updateOrderPaymentMethod(orderId, mercadoPagoPaymentMethod(payment));
    orders.markPaid(orderId, providerPaymentId, status);
    jdbc.update(
      "update payments set provider_payment_id = ?, status = ?, raw_payload = ?::jsonb, updated_at = now() where order_id = ?",
      providerPaymentId,
      status,
      mpOrder.toString(),
      orderId
    );
  }

  private void processClubPayment(JsonNode payment, String fallbackPaymentId) {
    String externalReference = payment.path("external_reference").asText("");
    String rawId = externalReference.substring("MENFISCLUB-".length());
    UUID subscriptionId;
    try {
      subscriptionId = UUID.fromString(rawId);
    } catch (IllegalArgumentException ex) {
      return;
    }
    String status = payment.path("status").asText("unknown");
    boolean active = "approved".equalsIgnoreCase(status);
    String subscriptionStatus = active
      ? "active"
      : ("rejected".equalsIgnoreCase(status) || "cancelled".equalsIgnoreCase(status) ? "failed" : "pending");

    var rows = jdbc.queryForList(
      """
      update customer_club_subscriptions
      set
        status = ?,
        payment_status = ?,
        provider_payment_id = ?,
        started_at = case when ? then coalesce(started_at, now()) else started_at end,
        expires_at = case when ? then coalesce(expires_at, now() + interval '31 days') else expires_at end,
        updated_at = now()
      where id = ?
      returning customer_id, plan
      """,
      subscriptionStatus,
      status,
      payment.path("id").asText(fallbackPaymentId),
      active,
      active,
      subscriptionId
    );
    if (!active || rows.isEmpty()) return;
    Map<String, Object> row = rows.get(0);
    String plan = String.valueOf(row.get("plan"));
    jdbc.update(
      """
      update customers
      set
        club_level = ?,
        club_expires_at = now() + interval '31 days',
        club_subscription_id = ?,
        updated_at = now()
      where id = ?
      """,
      "gold".equalsIgnoreCase(plan) ? "Gold" : "Silver",
      subscriptionId,
      row.get("customer_id")
    );
  }

  private ClubPlan clubPlan(String planId) {
    if ("silver".equalsIgnoreCase(planId)) {
      return new ClubPlan("silver", "Menfi's Club Silver", new BigDecimal("6.90"), 5, 5);
    }
    if ("gold".equalsIgnoreCase(planId)) {
      return new ClubPlan("gold", "Menfi's Club Gold", new BigDecimal("12.90"), 10, 5);
    }
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_club_plan");
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

  private void updateOrderPaymentMethod(String orderId, String paymentMethod) {
    if (paymentMethod == null || paymentMethod.isBlank()) return;
    jdbc.update(
      "update orders set payment_provider = 'MERCADO_PAGO', payment_method = ?, updated_at = now() where id = ?",
      paymentMethod,
      orderId
    );
  }

  private String mercadoPagoPaymentMethod(JsonNode payment) {
    String type = firstText(
      payment.path("payment_type_id"),
      payment.path("payment_method").path("type")
    );
    String id = firstText(
      payment.path("payment_method_id"),
      payment.path("payment_method").path("id")
    );

    if ("credit_card".equalsIgnoreCase(type)) return "CREDIT_CARD";
    if ("debit_card".equalsIgnoreCase(type)) return "DEBIT_CARD";
    if ("pix".equalsIgnoreCase(id) || "bank_transfer".equalsIgnoreCase(type)) return "PIX";
    return null;
  }

  private String firstText(JsonNode... nodes) {
    for (JsonNode node : nodes) {
      if (node != null && !node.isMissingNode() && !node.isNull()) {
        String value = node.asText("");
        if (!value.isBlank()) return value;
      }
    }
    return "";
  }

  private String money(BigDecimal value) {
    return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
  }

  private String mercadoPagoExternalReference(String orderId) {
    return "MENFIS-" + orderId.replaceAll("[^0-9A-Za-z_-]", "");
  }

  private String clubExternalReference(UUID subscriptionId) {
    return "MENFISCLUB-" + subscriptionId;
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

  private record ClubPlan(String id, String label, BigDecimal price, int freeShippingTotal, int discountTotal) {}
}
