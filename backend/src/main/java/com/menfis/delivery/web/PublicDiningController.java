package com.menfis.delivery.web;

import com.menfis.delivery.dto.DiningDtos.DiningCustomerNameRequest;
import com.menfis.delivery.dto.DiningDtos.PublicDiningSessionResponse;
import com.menfis.delivery.dto.DiningDtos.CreateDiningOrderRequest;
import com.menfis.delivery.dto.DiningDtos.DiningOrderResponse;
import com.menfis.delivery.service.DiningOrderService;
import com.menfis.delivery.service.DiningService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/dining/kits")
public class PublicDiningController {
  private final DiningService dining;
  private final DiningOrderService diningOrders;

  public PublicDiningController(DiningService dining, DiningOrderService diningOrders) {
    this.dining = dining;
    this.diningOrders = diningOrders;
  }

  @GetMapping("/{token}/session")
  public PublicDiningSessionResponse session(@PathVariable String token) {
    return dining.resolvePublicSession(token);
  }

  @PostMapping("/{token}/session/customer-name")
  public PublicDiningSessionResponse identify(
      @PathVariable String token,
      @Valid @RequestBody DiningCustomerNameRequest request) {
    return dining.identifyCustomer(token, request.name());
  }

  @PostMapping("/{token}/orders")
  public DiningOrderResponse createOrder(
      @PathVariable String token,
      @Valid @RequestBody CreateDiningOrderRequest request) {
    return diningOrders.createAndRequestPayment(token, request.items(), request.idempotencyKey());
  }

  @GetMapping("/{token}/orders/{publicOrderId}")
  public DiningOrderResponse order(
      @PathVariable String token,
      @PathVariable UUID publicOrderId) {
    return diningOrders.getByPublicId(token, publicOrderId);
  }
}
