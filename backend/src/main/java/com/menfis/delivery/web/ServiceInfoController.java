package com.menfis.delivery.web;

import java.time.Instant;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ServiceInfoController {
  private final String environment;

  public ServiceInfoController(
      @Value("${menfis.environment:local}") String environment) {
    this.environment = environment;
  }

  @GetMapping("/")
  public Map<String, Object> serviceInfo() {
    return Map.of(
      "service", "menfis-delivery-backend",
      "environment", environment,
      "status", "UP",
      "health", "/actuator/health",
      "timestamp", Instant.now().toString()
    );
  }
}
