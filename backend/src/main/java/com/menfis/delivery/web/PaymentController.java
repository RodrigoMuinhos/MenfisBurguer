package com.menfis.delivery.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.menfis.delivery.dto.ApiDtos.PixRequest;
import com.menfis.delivery.dto.ApiDtos.PixResponse;
import com.menfis.delivery.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
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

  public PaymentController(PaymentService payments) {
    this.payments = payments;
  }

  @PostMapping("/pix")
  public PixResponse pix(@Valid @RequestBody PixRequest request) {
    return payments.createPix(request.orderId());
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
