package com.menfis.delivery.service;

import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {
  private final JdbcTemplate jdbc;

  public DashboardService(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public Map<String, Object> summary() {
    Map<String, Object> kpis = jdbc.queryForMap(
      """
      select
        coalesce(sum(total), 0) as total_sales,
        count(*) as order_count,
        coalesce(avg(total), 0) as average_ticket,
        count(*) filter (where delivery_type = 'DELIVERY' or delivery_type = 'delivery') as delivery_count,
        count(*) filter (where delivery_type = 'RETIRADA' or delivery_type = 'retirada') as pickup_count
      from orders
      where created_at >= current_date and status not in ('CANCELED', 'PAYMENT_FAILED')
      """
    );
    return Map.of(
      "summary", kpis,
      "status", jdbc.queryForList("select status, count(*) as total from orders where created_at >= current_date group by status order by status"),
      "latestOrders", jdbc.queryForList("select id, number, total, status, delivery_type, created_at from orders order by created_at desc limit 10")
    );
  }

  public Object orders() {
    return jdbc.queryForList("select id, number, total, status, delivery_type, payment_status, created_at from orders order by created_at desc limit 100");
  }
}
