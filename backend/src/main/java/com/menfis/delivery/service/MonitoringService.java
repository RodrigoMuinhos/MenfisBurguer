package com.menfis.delivery.service;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class MonitoringService {
  private final JdbcTemplate jdbc;
  private final SettingsService settings;

  public MonitoringService(JdbcTemplate jdbc, SettingsService settings) {
    this.jdbc = jdbc;
    this.settings = settings;
  }

  public Map<String, Object> operations() {
    boolean testMode = settings.testModeEnabled();
    return Map.of(
      "summary", summary(testMode),
      "orders", recentOrders(testMode),
      "rabbitmqEvents", rabbitmqEvents(),
      "statusHistory", statusHistory(),
      "auditLogs", auditLogs()
    );
  }

  private Map<String, Object> summary(boolean testMode) {
    return jdbc.queryForMap(
      """
      select
        count(*) filter (where status not in ('DELIVERED', 'CANCELLED')) as active_orders,
        count(*) filter (where status in ('PAYMENT_PENDING', 'PAYMENT_PROOF_PENDING')) as payment_pending,
        count(*) filter (where status in ('PAYMENT_APPROVED', 'PAID', 'ACCEPTED', 'IN_PREPARATION')) as kitchen_flow,
        count(*) filter (where status = 'READY') as ready,
        count(*) filter (where status = 'OUT_FOR_DELIVERY') as out_for_delivery,
        count(*) filter (where status = 'DELIVERED') as delivered_today
      from orders
      where test_mode = ?
        and created_at >= now() - interval '1 day'
      """,
      testMode
    );
  }

  private List<Map<String, Object>> recentOrders(boolean testMode) {
    return jdbc.queryForList(
      """
      select id, number, status, payment_status, payment_method, channel, total, updated_at, created_at
      from orders
      where test_mode = ?
      order by updated_at desc nulls last, created_at desc
      limit 20
      """,
      testMode
    );
  }

  private List<Map<String, Object>> rabbitmqEvents() {
    return jdbc.queryForList(
      """
      select event_type, order_id, processed, created_at, processed_at
      from order_event_log
      order by created_at desc
      limit 20
      """
    );
  }

  private List<Map<String, Object>> statusHistory() {
    return jdbc.queryForList(
      """
      select order_id, from_status, to_status, changed_by, reason, created_at
      from order_status_history
      order by created_at desc
      limit 30
      """
    );
  }

  private List<Map<String, Object>> auditLogs() {
    return jdbc.queryForList(
      """
      select actor, action, entity_type, entity_id, metadata, created_at
      from audit_logs
      where entity_type = 'ORDER'
      order by created_at desc
      limit 30
      """
    );
  }
}
