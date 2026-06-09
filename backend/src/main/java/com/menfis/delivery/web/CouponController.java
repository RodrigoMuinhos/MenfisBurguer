package com.menfis.delivery.web;

import com.menfis.delivery.dto.ApiDtos.CouponRequest;
import com.menfis.delivery.service.CouponService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/coupons")
public class CouponController {
  private final CouponService coupons;

  public CouponController(CouponService coupons) {
    this.coupons = coupons;
  }

  @GetMapping
  public List<Map<String, Object>> list() {
    return coupons.list();
  }

  @GetMapping("/public")
  public List<Map<String, Object>> publicActive() {
    return coupons.listPublicActive();
  }

  @PostMapping
  public Map<String, Object> upsert(@Valid @RequestBody CouponRequest request) {
    return coupons.upsert(request);
  }

  @PatchMapping("/{code}/active")
  public Map<String, Object> setActive(@PathVariable String code, @RequestBody Map<String, Boolean> request) {
    return coupons.setActive(code, request.getOrDefault("active", true));
  }

  @DeleteMapping("/{code}")
  public void delete(@PathVariable String code) {
    coupons.delete(code);
  }
}
