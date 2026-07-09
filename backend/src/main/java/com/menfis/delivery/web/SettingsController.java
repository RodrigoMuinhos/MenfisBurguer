package com.menfis.delivery.web;

import com.menfis.delivery.service.AuthService;
import com.menfis.delivery.service.SettingsService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/settings")
public class SettingsController {
  private final SettingsService settings;
  private final AuthService auth;

  public SettingsController(SettingsService settings, AuthService auth) {
    this.settings = settings;
    this.auth = auth;
  }

  @GetMapping("/public")
  public Map<String, Object> publicSettings() {
    return settings.publicSettings();
  }

  @PatchMapping("/pay-on-delivery")
  public Map<String, Object> setPayOnDelivery(
      @RequestBody PayOnDeliveryRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return settings.setPayOnDeliveryEnabled(request.enabled());
  }

  @PatchMapping("/test-mode")
  public Map<String, Object> setTestMode(
      @RequestBody TestModeRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return settings.setTestModeEnabled(request.enabled());
  }

  @PatchMapping("/demo-table")
  public Map<String, Object> setDemoTable(
      @RequestBody DemoTableRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return settings.setDemoTableEnabled(request.enabled());
  }

  @PatchMapping("/sold-out")
  public Map<String, Object> setSoldOut(
      @RequestBody SoldOutRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return settings.setSoldOutEnabled(request.enabled());
  }

  @PatchMapping("/featured-product")
  public Map<String, Object> setFeaturedProduct(
      @RequestBody FeaturedProductRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return settings.setFeaturedProductId(request.productId());
  }

  @PatchMapping("/operating-hours")
  public Map<String, Object> setOperatingHours(
      @RequestBody OperatingHoursRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return settings.setOperatingHours(request.operatingHours());
  }

  @PatchMapping("/presentation")
  public Map<String, Object> setPresentation(
      @RequestBody PresentationRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return settings.setPresentationSettings(request.presentation());
  }

  @PatchMapping("/promo-cards")
  public Map<String, Object> setPromoCards(
      @RequestBody PromoCardsRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return settings.setPromoCards(request.promoCards());
  }

  @PatchMapping("/special-offer")
  public Map<String, Object> setSpecialOffer(
      @RequestBody SpecialOfferRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return settings.setSpecialOfferSettings(request.specialOffer());
  }

  @GetMapping("/admin-credentials")
  public Map<String, Object> adminCredentials(
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    return Map.of("login", auth.currentAdminLogin(authorization));
  }

  @PatchMapping("/admin-credentials")
  public Map<String, Object> setAdminCredentials(
      @RequestBody AdminCredentialsRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.updateAdminCredentials(authorization, request.login(), request.password());
    return Map.of("login", request.login().trim().toLowerCase());
  }

  @PatchMapping("/reset-real-operation")
  public Map<String, Object> resetRealOperation(
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return settings.resetRealOperation();
  }

  public record PayOnDeliveryRequest(boolean enabled) {}
  public record TestModeRequest(boolean enabled) {}
  public record DemoTableRequest(boolean enabled) {}
  public record SoldOutRequest(boolean enabled) {}
  public record FeaturedProductRequest(String productId) {}
  public record OperatingHoursRequest(Map<String, Object> operatingHours) {}
  public record PresentationRequest(Map<String, Object> presentation) {}
  public record PromoCardsRequest(List<Map<String, Object>> promoCards) {}
  public record SpecialOfferRequest(Map<String, Object> specialOffer) {}
  public record AdminCredentialsRequest(String login, String password) {}
}
