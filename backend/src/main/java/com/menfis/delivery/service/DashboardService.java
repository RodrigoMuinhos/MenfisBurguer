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
        count(*) filter (where channel = 'KIOSK') as kiosk_count,
        coalesce((
          select sum(ocs.cost_snapshot)
          from order_cost_snapshots ocs
          join orders so on so.id = ocs.order_id
          where so.created_at >= current_date and so.status <> 'CANCELLED' and so.test_mode = ?
        ), 0) as estimated_cost,
        coalesce(sum(total), 0) - coalesce((
          select sum(ocs.cost_snapshot)
          from order_cost_snapshots ocs
          join orders so on so.id = ocs.order_id
          where so.created_at >= current_date and so.status <> 'CANCELLED' and so.test_mode = ?
        ), 0) as gross_profit,
        case when coalesce(sum(total), 0) > 0 then coalesce((
          select sum(ocs.cost_snapshot)
          from order_cost_snapshots ocs
          join orders so on so.id = ocs.order_id
          where so.created_at >= current_date and so.status <> 'CANCELLED' and so.test_mode = ?
        ), 0) / coalesce(sum(total), 0) else 0 end as cmv
      from orders
      where created_at >= current_date and status <> 'CANCELLED' and test_mode = ?
      """,
      testMode,
      testMode,
      testMode,
      testMode
    );
    return Map.of(
      "summary", kpis,
      "status", jdbc.queryForList("select status, count(*) as total from orders where created_at >= current_date and test_mode = ? group by status order by status", testMode),
      "latestOrders", jdbc.queryForList("select id, number, total, status, channel, delivery_type, created_at from orders where test_mode = ? order by created_at desc limit 10", testMode),
      "productProfit", jdbc.queryForList(
        """
        select product_id, product_name, sum(quantity) as quantity, sum(sale_price_snapshot) as revenue,
          sum(cost_snapshot) as cost, sum(gross_profit_snapshot) as gross_profit,
          case when sum(sale_price_snapshot) > 0 then sum(cost_snapshot) / sum(sale_price_snapshot) else 0 end as cmv
        from order_cost_snapshots
        where test_mode = ? and created_at >= current_date
        group by product_id, product_name
        order by gross_profit desc
        limit 20
        """,
        testMode
      )
    );
  }

  public Object orders() {
    return jdbc.queryForList("select id, number, total, status, channel, delivery_type, payment_status, created_at from orders where test_mode = ? order by created_at desc limit 100", settings.testModeEnabled());
  }
}
