package com.menfis.delivery.web;

import com.menfis.delivery.service.DashboardService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {
  private final DashboardService dashboard;

  public DashboardController(DashboardService dashboard) {
    this.dashboard = dashboard;
  }

  @GetMapping("/summary")
  public Map<String, Object> summary() {
    return dashboard.summary();
  }

  @GetMapping("/orders")
  public Object orders() {
    return dashboard.orders();
  }
}
