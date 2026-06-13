package com.menfis.delivery.service;

import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class SettingsService {
  public static final String PAY_ON_DELIVERY = "pay_on_delivery_enabled";
  public static final String TEST_MODE = "test_mode_enabled";
  public static final String FEATURED_PRODUCT = "featured_product_id";
  public static final String DEMO_TABLE = "demo_table_enabled";

  private final JdbcTemplate jdbc;

  public SettingsService(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public boolean payOnDeliveryEnabled() {
    return Boolean.parseBoolean(value(PAY_ON_DELIVERY, "true"));
  }

  public boolean testModeEnabled() {
    return Boolean.parseBoolean(value(TEST_MODE, "false"));
  }

  public String featuredProductId() {
    return value(FEATURED_PRODUCT, "chicken-super-combo");
  }

  public boolean demoTableEnabled() {
    return Boolean.parseBoolean(value(DEMO_TABLE, "false"));
  }

  public Map<String, Object> publicSettings() {
    return Map.of(
      "payOnDeliveryEnabled", payOnDeliveryEnabled(),
      "testModeEnabled", testModeEnabled(),
      "featuredProductId", featuredProductId(),
      "demoTableEnabled", demoTableEnabled()
    );
  }

  public Map<String, Object> setPayOnDeliveryEnabled(boolean enabled) {
    jdbc.update(
      """
      insert into app_settings(key, value, updated_at)
      values (?, ?, now())
      on conflict (key) do update set value = excluded.value, updated_at = now()
      """,
      PAY_ON_DELIVERY,
      Boolean.toString(enabled)
    );
    return publicSettings();
  }

  public Map<String, Object> setTestModeEnabled(boolean enabled) {
    jdbc.update(
      """
      insert into app_settings(key, value, updated_at)
      values (?, ?, now())
      on conflict (key) do update set value = excluded.value, updated_at = now()
      """,
      TEST_MODE,
      Boolean.toString(enabled)
    );
    return publicSettings();
  }

  public Map<String, Object> setFeaturedProductId(String productId) {
    String cleaned = productId == null || productId.isBlank() ? "chicken-super-combo" : productId.trim();
    jdbc.update(
      """
      insert into app_settings(key, value, updated_at)
      values (?, ?, now())
      on conflict (key) do update set value = excluded.value, updated_at = now()
      """,
      FEATURED_PRODUCT,
      cleaned
    );
    return publicSettings();
  }

  public Map<String, Object> setDemoTableEnabled(boolean enabled) {
    jdbc.update(
      """
      insert into app_settings(key, value, updated_at)
      values (?, ?, now())
      on conflict (key) do update set value = excluded.value, updated_at = now()
      """,
      DEMO_TABLE,
      Boolean.toString(enabled)
    );
    return publicSettings();
  }

  public Map<String, Object> resetRealOperation() {
    jdbc.update("delete from support_tickets");
    jdbc.update("delete from stock_movements where order_id is not null and test_mode = false");
    jdbc.update("delete from orders where test_mode = false");
    jdbc.update("delete from coupons where test_mode = false");
    jdbc.update(
      """
      update inventory_items
      set quantity = 0,
          min_quantity = 0,
          unit_cost = 0,
          entry_date = null,
          expires_at = null,
          updated_at = now()
      """
    );
    jdbc.update("alter sequence order_number_seq restart with 1001");
    return publicSettings();
  }

  private String value(String key, String fallback) {
    return jdbc.query(
      "select value from app_settings where key = ?",
      rs -> rs.next() ? rs.getString("value") : fallback,
      key
    );
  }
}
