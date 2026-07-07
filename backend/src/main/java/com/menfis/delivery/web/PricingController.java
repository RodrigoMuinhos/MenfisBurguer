package com.menfis.delivery.web;

import com.menfis.delivery.dto.ApiDtos.PricingProductRequest;
import com.menfis.delivery.service.AuthService;
import com.menfis.delivery.service.PricingService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pricing")
public class PricingController {
  private final PricingService pricing;
  private final AuthService auth;

  public PricingController(PricingService pricing, AuthService auth) {
    this.pricing = pricing;
    this.auth = auth;
  }

  @GetMapping
  public List<Map<String, Object>> list() {
    return pricing.list();
  }

  @PostMapping("/products")
  public Map<String, Object> create(
      @Valid @RequestBody PricingProductRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return pricing.upsert(request);
  }

  @PatchMapping("/products/{id}")
  public Map<String, Object> update(
      @PathVariable String id,
      @Valid @RequestBody PricingProductRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return pricing.upsert(new PricingProductRequest(
      id,
      request.code(),
      request.name(),
      request.category(),
      request.kind(),
      request.baseCost(),
      request.friesCost(),
      request.defaultDrinkCost(),
      request.alternativeDrinkCost(),
      request.drinkSurcharge(),
      request.salePrice(),
      request.targetCmv(),
      request.active(),
      request.notes(),
      request.imageUrl(),
      request.originalPrice()
    ));
  }

  @DeleteMapping("/products/{id}")
  public void delete(
      @PathVariable String id,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    pricing.delete(id);
  }
}
