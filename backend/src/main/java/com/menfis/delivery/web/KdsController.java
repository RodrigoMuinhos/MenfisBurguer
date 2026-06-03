package com.menfis.delivery.web;

import com.menfis.delivery.dto.ApiDtos.OrderResponse;
import com.menfis.delivery.service.KdsService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/kds/orders")
public class KdsController {
  private final KdsService kds;

  public KdsController(KdsService kds) {
    this.kds = kds;
  }

  @GetMapping
  public Map<String, List<OrderResponse>> board() {
    return kds.board();
  }

  @PatchMapping("/{id}/advance")
  public OrderResponse advance(@PathVariable String id) {
    return kds.advance(id, "kds");
  }
}
