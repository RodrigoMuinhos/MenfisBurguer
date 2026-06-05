package com.menfis.delivery.web;

import com.menfis.delivery.dto.ApiDtos.OrderResponse;
import com.menfis.delivery.service.AuthService;
import com.menfis.delivery.service.KdsService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/kds/orders")
public class KdsController {
  private final KdsService kds;
  private final AuthService auth;

  public KdsController(KdsService kds, AuthService auth) {
    this.kds = kds;
    this.auth = auth;
  }

  @GetMapping
  public Map<String, List<OrderResponse>> board(
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return kds.board();
  }

  @PatchMapping("/{id}/advance")
  public OrderResponse advance(
      @PathVariable String id,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return kds.advance(id, "kds");
  }
}
