package com.menfis.delivery.web;

import com.menfis.delivery.dto.ApiDtos.OrderResponse;
import com.menfis.delivery.service.AuthService;
import com.menfis.delivery.service.KdsService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/kitchen/orders", "/api/kitchen/orders"})
public class KitchenController {
  private final KdsService kds;
  private final AuthService auth;

  public KitchenController(KdsService kds, AuthService auth) {
    this.kds = kds;
    this.auth = auth;
  }

  @GetMapping
  public List<OrderResponse> list(
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return kds.listKitchenOrders();
  }
}
