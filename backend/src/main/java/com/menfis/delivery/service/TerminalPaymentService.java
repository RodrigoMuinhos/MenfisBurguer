package com.menfis.delivery.service;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class TerminalPaymentService {
  private final OrderService orders;
  private final RestClient terminal;
  private final String environment;
  private final boolean terminalPaymentEnabled;

  public TerminalPaymentService(
      OrderService orders,
      RestClient.Builder builder,
      @Value("${menfis.environment:local}") String environment,
      @Value("${menfis.terminal-payment-enabled:false}") boolean terminalPaymentEnabled,
      @Value("${menfis.terminal-payment-url:http://127.0.0.1:8081}") String terminalUrl) {
    this.orders = orders;
    this.terminal = builder.baseUrl(terminalUrl).build();
    this.environment = environment;
    this.terminalPaymentEnabled = terminalPaymentEnabled;
  }

  public JsonNode availability() {
    requireKioskEnvironment();
    return terminal.get()
      .uri("/api/terminal/availability")
      .retrieve()
      .body(JsonNode.class);
  }

  public Map<String, Object> start(String orderId, String method) {
    requireKioskEnvironment();
    String normalizedMethod = normalizeMethod(method);
    var pendingOrder = orders.requirePendingKioskMobOrder(orderId);

    JsonNode created = terminal.post()
      .uri("/api/payments")
      .contentType(MediaType.APPLICATION_JSON)
      .body(Map.of(
        "amountCents", pendingOrder.amountCents(),
        "method", normalizedMethod
      ))
      .retrieve()
      .body(JsonNode.class);

    String paymentId = created == null ? "" : created.path("id").asText("");
    if (paymentId.isBlank()) {
      throw new IllegalStateException("terminal_payment_not_created");
    }

    String status = created == null ? "WAITING_TERMINAL" : created.path("status").asText("WAITING_TERMINAL");
    return response(created, paymentId, status, false);
  }

  public Map<String, Object> status(String orderId, String paymentId, String method) {
    requireKioskEnvironment();
    String normalizedMethod = normalizeMethod(method);
    orders.requirePendingKioskMobOrder(orderId);
    JsonNode result = terminal.get()
      .uri("/api/payments/{id}", paymentId)
      .retrieve()
      .body(JsonNode.class);
    String status = result == null ? "COMMUNICATION_ERROR" : result.path("status").asText("COMMUNICATION_ERROR");
    if (isTerminalStatus(status) && !"APPROVED".equals(status)) {
      orders.failTerminalPayment(orderId, paymentId, status);
      return response(result, paymentId, status, false);
    }
    if ("APPROVED".equals(status)) {
      orders.approveTerminalPayment(
        orderId,
        paymentId,
        normalizedMethod,
        result.path("authorizationCode").asText(""),
        result.path("sitefNsu").asText("")
      );
      return response(result, paymentId, status, true);
    }
    return response(result, paymentId, status, false);
  }

  public Map<String, Object> cancel(String orderId, String paymentId) {
    requireKioskEnvironment();
    orders.requirePendingKioskMobOrder(orderId);
    terminal.post().uri("/api/payments/{id}/cancel", paymentId).retrieve().toBodilessEntity();
    long deadline = System.nanoTime() + java.time.Duration.ofSeconds(30).toNanos();
    while (System.nanoTime() < deadline) {
      JsonNode result = terminal.get()
        .uri("/api/payments/{id}", paymentId)
        .retrieve()
        .body(JsonNode.class);
      String status = result == null ? "COMMUNICATION_ERROR" : result.path("status").asText("");
      if ("CANCELLED".equals(status)) {
        orders.failTerminalPayment(orderId, paymentId, status);
        return response(result, paymentId, status, false);
      }
      if (isTerminalStatus(status)) {
        throw new IllegalStateException("terminal_cancel_finished_as_" + status.toLowerCase());
      }
      try {
        Thread.sleep(250);
      } catch (InterruptedException interrupted) {
        Thread.currentThread().interrupt();
        throw new IllegalStateException("terminal_cancel_interrupted", interrupted);
      }
    }
    throw new IllegalStateException("terminal_cancel_timeout");
  }

  public void completeCustomerName(String orderId, String customerName) {
    requireKioskEnvironment();
    orders.completeTerminalCustomerName(orderId, customerName);
  }

  private void cancelTerminal(String paymentId) {
    try {
      terminal.post().uri("/api/payments/{id}/cancel", paymentId).retrieve().toBodilessEntity();
    } catch (RuntimeException ignored) {
      // O status do pedido permanece pendente/falho para conciliação manual.
    }
  }

  private void requireKioskEnvironment() {
    if (!isTerminalPaymentEnabled(environment, terminalPaymentEnabled)) {
      throw new IllegalStateException("terminal_payment_disabled");
    }
  }

  static boolean isTerminalPaymentEnabled(String environment, boolean enabled) {
    return enabled && "kiosk-menfis-desktop".equalsIgnoreCase(environment);
  }

  private static String normalizeMethod(String method) {
    String normalized = method == null ? "" : method.trim().toUpperCase();
    if (!normalized.equals("DEBIT") && !normalized.equals("CREDIT") && !normalized.equals("PIX")) {
      throw new IllegalArgumentException("terminal_payment_method_invalid");
    }
    return normalized;
  }

  private static boolean isTerminalStatus(String status) {
    return switch (status) {
      case "APPROVED", "DECLINED", "CANCELLED", "TIMEOUT",
           "TERMINAL_DISCONNECTED", "COMMUNICATION_ERROR" -> true;
      default -> false;
    };
  }

  private static Map<String, Object> response(
      JsonNode result,
      String paymentId,
      String status,
      boolean approved) {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("approved", approved);
    response.put("paymentId", paymentId);
    response.put("status", status);
    response.put("message", result == null ? "Falha de comunicação com o terminal" : result.path("message").asText(""));
    if (result != null && !result.path("qrCode").asText("").isBlank()) {
      response.put("qrCode", result.path("qrCode").asText());
    }
    return response;
  }
}
