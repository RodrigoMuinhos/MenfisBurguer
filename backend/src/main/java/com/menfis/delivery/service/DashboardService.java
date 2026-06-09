package com.menfis.delivery.service;

import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {
  private final JdbcTemplate jdbc;
  private final SettingsService settings;

  public DashboardService(JdbcTemplate jdbc, SettingsService settings) {
    this.jdbc = jdbc;
    this.settings = settings;
  }

  public Map<String, Object> summary() {
    boolean testMode = settings.testModeEnabled();
    Map<String, Object> kpis = jdbc.queryForMap(
      """
      select
        coalesce(sum(total), 0) as total_sales,
        count(*) as order_count,
        coalesce(avg(total), 0) as average_ticket,
        count(*) filter (where channel = 'DELIVERY') as delivery_count,
        count(*) filter (where channel = 'KIOSK') as kiosk_count
      from orders
      where created_at >= current_date and status <> 'CANCELLED' and test_mode = ?
      """,
      testMode
    );
    return Map.of(
      "summary", kpis,
      "status", jdbc.queryForList("select status, count(*) as total from orders where created_at >= current_date and test_mode = ? group by status order by status", testMode),
      "latestOrders", jdbc.queryForList("select id, number, total, status, channel, delivery_type, created_at from orders where test_mode = ? order by created_at desc limit 10", testMode)
    );
  }

  public Object orders() {
    return jdbc.queryForList("select id, number, total, status, channel, delivery_type, payment_status, created_at from orders where test_mode = ? order by created_at desc limit 100", settings.testModeEnabled());
  }
}
