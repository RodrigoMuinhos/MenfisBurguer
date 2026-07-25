package com.menfis.delivery.web;

import com.menfis.delivery.service.SalesPlanningService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/reports/sales-planning", "/api/reports/sales-planning"})
public class SalesPlanningController {
  private final SalesPlanningService planning;

  public SalesPlanningController(SalesPlanningService planning) {
    this.planning = planning;
  }

  @GetMapping
  public Map<String, Object> overview() {
    return planning.overview();
  }

  @GetMapping("/daily")
  public Object daily() {
    return planning.overview().get("daily");
  }

  @GetMapping("/weekly")
  public Object weekly() {
    return planning.overview().get("weekly");
  }

  @GetMapping("/comparison")
  public Object comparison() {
    return planning.overview().get("comparison");
  }
}
