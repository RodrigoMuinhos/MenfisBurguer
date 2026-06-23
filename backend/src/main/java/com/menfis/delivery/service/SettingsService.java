package com.menfis.delivery.service;

import java.util.Map;
import java.util.List;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class SettingsService {
  public static final String PAY_ON_DELIVERY = "pay_on_delivery_enabled";
  public static final String TEST_MODE = "test_mode_enabled";
  public static final String FEATURED_PRODUCT = "featured_product_id";
  public static final String DEMO_TABLE = "demo_table_enabled";
  public static final String OPERATING_HOURS = "operating_hours";
  private static final String DEFAULT_OPERATING_HOURS = """
    {"days":[
      {"day":0,"label":"Domingo","open":true,"start":"18:00","end":"22:00"},
      {"day":1,"label":"Segunda","open":false,"start":"18:00","end":"22:00"},
      {"day":2,"label":"Terça","open":true,"start":"18:00","end":"22:00"},
      {"day":3,"label":"Quarta","open":true,"start":"18:00","end":"22:00"},
      {"day":4,"label":"Quinta","open":true,"start":"18:00","end":"22:00"},
      {"day":5,"label":"Sexta","open":true,"start":"18:00","end":"22:00"},
      {"day":6,"label":"Sábado","open":true,"start":"18:00","end":"22:00"}
    ]}
    """;

  private final JdbcTemplate jdbc;
  private final ObjectMapper objectMapper;

  public SettingsService(JdbcTemplate jdbc, ObjectMapper objectMapper) {
    this.jdbc = jdbc;
    this.objectMapper = objectMapper;
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

  public Map<String, Object> operatingHours() {
    try {
      return objectMapper.readValue(value(OPERATING_HOURS, DEFAULT_OPERATING_HOURS), new TypeReference<>() {});
    } catch (Exception ignored) {
      try {
        return objectMapper.readValue(DEFAULT_OPERATING_HOURS, new TypeReference<>() {});
      } catch (Exception fallbackError) {
        return Map.of("days", java.util.List.of());
      }
    }
  }

  public Map<String, Object> publicSettings() {
    OperatingStatus operatingStatus = operatingStatus();
    return Map.of(
      "payOnDeliveryEnabled", payOnDeliveryEnabled(),
      "testModeEnabled", testModeEnabled(),
      "featuredProductId", featuredProductId(),
      "demoTableEnabled", demoTableEnabled(),
      "operatingHours", operatingHours(),
      "operatingNow", operatingStatus.open(),
      "operatingHoursSummary", operatingStatus.summary(),
      "operatingHoursMessage", operatingStatus.message()
    );
  }

  /** The restaurant schedule is evaluated in its local operating timezone, never in the server timezone. */
  public boolean isOperatingNow() {
    return operatingStatus().open();
  }

  private OperatingStatus operatingStatus() {
    Map<String, Object> config = operatingHours();
    Object rawDays = config.get("days");
    List<?> days = rawDays instanceof List<?> list ? list : List.of();
    ZonedDateTime now = ZonedDateTime.now(ZoneId.of("America/Sao_Paulo"));
    int currentDay = now.getDayOfWeek().getValue() % 7; // Java: Sunday=7; UI: Sunday=0.
    int currentMinutes = now.getHour() * 60 + now.getMinute();
    boolean open = false;
    java.util.ArrayList<String> summaries = new java.util.ArrayList<>();

    for (Object entry : days) {
      if (!(entry instanceof Map<?, ?> day)) continue;
      boolean enabled = Boolean.TRUE.equals(day.get("open"));
      String label = stringValue(day.get("label"), "Dia");
      String start = stringValue(day.get("start"), "00:00");
      String end = stringValue(day.get("end"), "00:00");
      if (enabled) summaries.add(label + ", das " + start + " às " + end);
      if (enabled && number(day.get("day")) == currentDay) {
        int startMinutes = minutes(start);
        int endMinutes = minutes(end);
        if (startMinutes < endMinutes && currentMinutes >= startMinutes && currentMinutes < endMinutes) open = true;
      }
    }
    String summary = summaries.isEmpty() ? "Nenhum horário configurado." : String.join(" · ", summaries);
    String message = open
      ? "Estamos atendendo agora."
      : "Estamos fechados no momento. Assim que abrirmos, você será informado e poderá finalizar seu pedido. Horários: " + summary;
    return new OperatingStatus(open, summary, message);
  }

  private int minutes(String value) {
    try {
      String[] parts = value.split(":", 2);
      int hours = Integer.parseInt(parts[0]);
      int minutes = Integer.parseInt(parts[1]);
      return hours * 60 + minutes;
    } catch (Exception ignored) {
      return -1;
    }
  }

  private int number(Object value) {
    if (value instanceof Number number) return number.intValue();
    try { return Integer.parseInt(String.valueOf(value)); } catch (Exception ignored) { return -1; }
  }

  private String stringValue(Object value, String fallback) {
    return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
  }

  private record OperatingStatus(boolean open, String summary, String message) {}

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

  public Map<String, Object> setOperatingHours(Map<String, Object> operatingHours) {
    try {
      jdbc.update(
        """
        insert into app_settings(key, value, updated_at)
        values (?, ?, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()
        """,
        OPERATING_HOURS,
        objectMapper.writeValueAsString(operatingHours == null ? Map.of() : operatingHours)
      );
    } catch (Exception e) {
      throw new IllegalArgumentException("Horário de funcionamento inválido.");
    }
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
