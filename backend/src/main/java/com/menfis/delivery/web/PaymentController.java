package com.menfis.delivery.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.menfis.delivery.dto.ApiDtos.ClubPreferenceRequest;
import com.menfis.delivery.dto.ApiDtos.ClubPreferenceResponse;
import com.menfis.delivery.dto.ApiDtos.PixRequest;
import com.menfis.delivery.dto.ApiDtos.PixResponse;
import com.menfis.delivery.service.AuthService;
import com.menfis.delivery.service.PaymentService;
import com.menfis.delivery.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments")
public class PaymentController {
  private final PaymentService payments;
  private final AuthService auth;
  private final OrderService orders;

  public PaymentController(PaymentService payments, AuthService auth, OrderService orders) {
    this.payments = payments;
    this.auth = auth;
    this.orders = orders;
  }

  @PostMapping("/pix")
  public PixResponse pix(
      @RequestHeader(name = "Authorization", required = false) String authorization,
      @RequestHeader(name = "X-Order-Token", required = false) String trackingToken,
      @Valid @RequestBody PixRequest request) {
    orders.requireOrderAccess(request.orderId(), authorization, trackingToken, auth);
    return payments.createPix(request.orderId());
  }

  @PostMapping("/checkout")
  public PixResponse checkout(
      @RequestHeader(name = "Authorization", required = false) String authorization,
      @RequestHeader(name = "X-Order-Token", required = false) String trackingToken,
      @Valid @RequestBody PixRequest request) {
    orders.requireOrderAccess(request.orderId(), authorization, trackingToken, auth);
    return payments.createCheckout(request.orderId());
  }

  @GetMapping("/pix/{id}/status")
  public com.menfis.delivery.dto.ApiDtos.OrderResponse pixStatus(
      @PathVariable String id,
      @RequestHeader(name = "Authorization", required = false) String authorization,
      @RequestHeader(name = "X-Order-Token", required = false) String trackingToken) {
    orders.requireOrderAccess(id, authorization, trackingToken, auth);
    return payments.refreshPix(id);
  }

  @PostMapping("/club/preference")
  public ClubPreferenceResponse clubPreference(
    @RequestHeader(name = "Authorization", required = false) String authorization,
    @Valid @RequestBody ClubPreferenceRequest request
  ) {
    return payments.createClubPreference(auth.requireCustomer(authorization), request.plan());
  }

  @PostMapping("/webhook/mercadopago")
  public void mercadoPagoWebhook(
    @RequestParam(name = "id", required = false) String id,
    @RequestParam(name = "data.id", required = false) String dataId,
    @RequestHeader(name = "x-signature", required = false) String xSignature,
    @RequestHeader(name = "x-request-id", required = false) String xRequestId,
    @RequestBody JsonNode payload
  ) {
    payments.processMercadoPagoWebhook(id, dataId, xSignature, xRequestId, payload);
  }

  @GetMapping("/webhook/mercadopago")
  public void mercadoPagoWebhookGet(@RequestParam(name = "id", required = false) String id) {
    payments.processMercadoPagoWebhook(
      id,
      id,
      null,
      null,
      com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode().put("id", id == null ? "" : id)
    );
  }
}
