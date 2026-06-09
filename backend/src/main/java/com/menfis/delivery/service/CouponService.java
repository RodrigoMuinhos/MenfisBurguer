package com.menfis.delivery.service;

import com.menfis.delivery.dto.ApiDtos.CouponRequest;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class CouponService {
  private final JdbcTemplate jdbc;
  private final AuditService audit;
  private final SettingsService settings;

  public CouponService(JdbcTemplate jdbc, AuditService audit, SettingsService settings) {
    this.jdbc = jdbc;
    this.audit = audit;
    this.settings = settings;
  }

  public List<Map<String, Object>> list() {
    return jdbc.queryForList(
      """
      select code, label, type, value, active, test_mode, created_at, updated_at
      from coupons
      where test_mode = ?
      order by active desc, updated_at desc, code asc
      """,
      settings.testModeEnabled()
    );
  }

  public Map<String, Object> upsert(CouponRequest request) {
    boolean testMode = settings.testModeEnabled();
    Map<String, Object> coupon = jdbc.queryForMap(
      """
      insert into coupons(code, label, type, value, active, test_mode, updated_at)
      values (?, ?, ?, ?, coalesce(?, true), ?, now())
      on conflict (code, test_mode) do update set
        label = excluded.label,
        type = excluded.type,
        value = excluded.value,
        active = excluded.active,
        updated_at = now()
      returning code, label, type, value, active, test_mode, created_at, updated_at
      """,
      request.code().trim(),
      request.label(),
      request.type(),
      request.value(),
      request.active(),
      testMode
    );
    audit.log("admin", "COUPON_UPSERTED", "COUPON", request.code().trim(), Map.of("active", coupon.get("active")));
    return coupon;
  }

  public Map<String, Object> setActive(String code, boolean active) {
    boolean testMode = settings.testModeEnabled();
    Map<String, Object> coupon = jdbc.queryForMap(
      """
      update coupons
      set active = ?, updated_at = now()
      where lower(code) = lower(?) and test_mode = ?
      returning code, label, type, value, active, test_mode, created_at, updated_at
      """,
      active,
      code,
      testMode
    );
    audit.log("admin", active ? "COUPON_ENABLED" : "COUPON_DISABLED", "COUPON", code, Map.of());
    return coupon;
  }

  public void delete(String code) {
    jdbc.update("delete from coupons where lower(code) = lower(?) and test_mode = ?", code, settings.testModeEnabled());
    audit.log("admin", "COUPON_DELETED", "COUPON", code, Map.of());
  }
}
