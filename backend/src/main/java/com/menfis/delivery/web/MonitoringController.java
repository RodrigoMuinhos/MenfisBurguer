package com.menfis.delivery.web;

import com.menfis.delivery.service.AuthService;
import com.menfis.delivery.service.MonitoringService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/monitoring", "/api/monitoring"})
public class MonitoringController {
  private final MonitoringService monitoring;
  private final AuthService auth;

  public MonitoringController(MonitoringService monitoring, AuthService auth) {
    this.monitoring = monitoring;
    this.auth = auth;
  }

  @GetMapping("/operations")
  public Map<String, Object> operations(
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return monitoring.operations();
  }
}
