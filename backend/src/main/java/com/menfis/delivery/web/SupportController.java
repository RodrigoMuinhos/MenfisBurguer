package com.menfis.delivery.web;

import com.menfis.delivery.dto.ApiDtos.SupportTicketRequest;
import com.menfis.delivery.dto.ApiDtos.SupportTicketResponse;
import com.menfis.delivery.service.AuthService;
import com.menfis.delivery.service.OrderService;
import com.menfis.delivery.service.SupportService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/support")
public class SupportController {
  private final SupportService support;
  private final AuthService auth;
  private final OrderService orders;

  public SupportController(SupportService support, AuthService auth, OrderService orders) {
    this.support = support;
    this.auth = auth;
    this.orders = orders;
  }

  @PostMapping("/tickets")
  public SupportTicketResponse create(
      @Valid @RequestBody SupportTicketRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization,
      @RequestHeader(name = "X-Order-Token", required = false) String trackingToken) {
    orders.requireOrderAccess(request.orderId(), authorization, trackingToken, auth);
    return support.create(request);
  }

  @GetMapping("/tickets")
  public List<SupportTicketResponse> list(@RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return support.list();
  }

  @GetMapping("/tickets/order/{orderId}")
  public List<SupportTicketResponse> listByOrder(
      @PathVariable String orderId,
      @RequestHeader(name = "Authorization", required = false) String authorization,
      @RequestHeader(name = "X-Order-Token", required = false) String trackingToken) {
    orders.requireOrderAccess(orderId, authorization, trackingToken, auth);
    return support.listByOrder(orderId);
  }

  @PatchMapping("/tickets/{id}/resolve")
  public SupportTicketResponse resolve(
      @PathVariable String id,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return support.resolve(id);
  }
}
