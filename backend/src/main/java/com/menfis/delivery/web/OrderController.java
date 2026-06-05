package com.menfis.delivery.web;

import com.menfis.delivery.domain.OrderStatus;
import com.menfis.delivery.dto.ApiDtos.CreateOrderRequest;
import com.menfis.delivery.dto.ApiDtos.OrderResponse;
import com.menfis.delivery.dto.ApiDtos.PatchStatusRequest;
import com.menfis.delivery.dto.ApiDtos.StatusResponse;
import com.menfis.delivery.service.OrderEventService;
import com.menfis.delivery.service.OrderService;
import com.menfis.delivery.service.AuthService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/orders")
public class OrderController {
  private final OrderService orders;
  private final OrderEventService events;
  private final AuthService auth;

  public OrderController(OrderService orders, OrderEventService events, AuthService auth) {
    this.orders = orders;
    this.events = events;
    this.auth = auth;
  }

  @PostMapping
  public OrderResponse create(@Valid @RequestBody CreateOrderRequest request) {
    return orders.create(request);
  }

  @GetMapping
  public List<OrderResponse> list(@RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return orders.listRecent();
  }

  @GetMapping("/{id}")
  public OrderResponse get(@PathVariable String id) {
    return orders.get(id);
  }

  @GetMapping("/{id}/status")
  public StatusResponse status(@PathVariable String id) {
    return orders.status(id);
  }

  @GetMapping(value = "/{id}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter events(@PathVariable String id) {
    return events.subscribe(id, orders.get(id));
  }

  @PatchMapping("/{id}/status")
  public OrderResponse patchStatus(
      @PathVariable String id,
      @Valid @RequestBody PatchStatusRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return orders.changeStatus(id, OrderStatus.valueOf(request.status()), request.actor(), request.reason());
  }
}
