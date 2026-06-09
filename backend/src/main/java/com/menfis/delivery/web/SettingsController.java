package com.menfis.delivery.web;

import com.menfis.delivery.service.AuthService;
import com.menfis.delivery.service.SettingsService;
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

  @PatchMapping("/reset-real-operation")
  public Map<String, Object> resetRealOperation(
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return settings.resetRealOperation();
  }

  public record PayOnDeliveryRequest(boolean enabled) {}
  public record TestModeRequest(boolean enabled) {}
}
