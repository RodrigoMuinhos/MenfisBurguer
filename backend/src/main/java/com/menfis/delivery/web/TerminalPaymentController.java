package com.menfis.delivery.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.menfis.delivery.service.TerminalPaymentService;
import com.menfis.delivery.service.OrderService;
import com.menfis.delivery.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestHeader;

@RestController
@RequestMapping({"/terminal-payments", "/api/terminal-payments"})
public class TerminalPaymentController {
  private final TerminalPaymentService terminalPayments;
  private final OrderService orders;
  private final AuthService auth;

  public TerminalPaymentController(TerminalPaymentService terminalPayments, OrderService orders, AuthService auth) {
    this.terminalPayments = terminalPayments;
    this.orders = orders;
    this.auth = auth;
  }

  @GetMapping("/availability")
  public JsonNode availability() {
    return terminalPayments.availability();
  }

  @PostMapping
  public Map<String, Object> charge(
      @RequestHeader(name = "Authorization", required = false) String authorization,
      @RequestHeader(name = "X-Order-Token", required = false) String trackingToken,
      @Valid @RequestBody TerminalChargeRequest request) {
    orders.requireOrderAccess(request.orderId(), authorization, trackingToken, auth);
    return terminalPayments.start(request.orderId(), request.method());
  }

  @GetMapping("/{paymentId}")
  public Map<String, Object> status(
      @PathVariable String paymentId,
      @RequestHeader(name = "Authorization", required = false) String authorization,
      @RequestHeader(name = "X-Order-Token", required = false) String trackingToken,
      @NotBlank String orderId,
      @NotBlank String method) {
    orders.requireOrderAccess(orderId, authorization, trackingToken, auth);
    return terminalPayments.status(orderId, paymentId, method);
  }

  @PostMapping("/{paymentId}/cancel")
  public Map<String, Object> cancel(
      @PathVariable String paymentId,
      @RequestHeader(name = "Authorization", required = false) String authorization,
      @RequestHeader(name = "X-Order-Token", required = false) String trackingToken,
      @Valid @RequestBody TerminalCancelRequest request) {
    orders.requireOrderAccess(request.orderId(), authorization, trackingToken, auth);
    return terminalPayments.cancel(request.orderId(), paymentId);
  }

  @PostMapping("/customer-name")
  public Map<String, Object> customerName(
      @RequestHeader(name = "Authorization", required = false) String authorization,
      @RequestHeader(name = "X-Order-Token", required = false) String trackingToken,
      @Valid @RequestBody TerminalCustomerNameRequest request) {
    orders.requireOrderAccess(request.orderId(), authorization, trackingToken, auth);
    terminalPayments.completeCustomerName(request.orderId(), request.customerName());
    return Map.of("updated", true);
  }

  public record TerminalChargeRequest(@NotBlank String orderId, @NotBlank String method) {}
  public record TerminalCancelRequest(@NotBlank String orderId) {}
  public record TerminalCustomerNameRequest(
    @NotBlank String orderId,
    @NotBlank String customerName
  ) {}
}
