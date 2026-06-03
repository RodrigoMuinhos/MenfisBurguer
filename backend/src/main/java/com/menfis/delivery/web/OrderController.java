package com.menfis.delivery.web;

import com.menfis.delivery.domain.OrderStatus;
import com.menfis.delivery.dto.ApiDtos.CreateOrderRequest;
import com.menfis.delivery.dto.ApiDtos.OrderResponse;
import com.menfis.delivery.dto.ApiDtos.PatchStatusRequest;
import com.menfis.delivery.dto.ApiDtos.StatusResponse;
import com.menfis.delivery.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/orders")
public class OrderController {
  private final OrderService orders;

  public OrderController(OrderService orders) {
    this.orders = orders;
  }

  @PostMapping
  public OrderResponse create(@Valid @RequestBody CreateOrderRequest request) {
    return orders.create(request);
  }

  @GetMapping("/{id}")
  public OrderResponse get(@PathVariable String id) {
    return orders.get(id);
  }

  @GetMapping("/{id}/status")
  public StatusResponse status(@PathVariable String id) {
    return orders.status(id);
  }

  @PatchMapping("/{id}/status")
  public OrderResponse patchStatus(@PathVariable String id, @Valid @RequestBody PatchStatusRequest request) {
    return orders.changeStatus(id, OrderStatus.valueOf(request.status()), request.actor(), request.reason());
  }
}
