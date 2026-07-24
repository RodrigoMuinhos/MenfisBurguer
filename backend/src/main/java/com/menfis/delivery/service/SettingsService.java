package com.menfis.delivery.service;

import java.util.Map;
import java.util.List;
import java.util.LinkedHashMap;
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
  public static final String SOLD_OUT = "sold_out_enabled";
  public static final String PRESENTATION = "presentation_settings";
  public static final String PROMO_CARDS = "promo_cards";
  public static final String SPECIAL_OFFER = "special_offer_settings";
  public static final String LEMONADE_SETTINGS = "lemonade_settings";
  private static final String DEFAULT_LEMONADE_SETTINGS = """
    {"badgeLabels":{"pink-lemonade":"","purple-lemonade":"","sunset-lemonade":"Em breve"},"enabledFlavors":["pink-lemonade","purple-lemonade","sunset-lemonade"],"flavorOrder":["pink-lemonade","purple-lemonade","sunset-lemonade"],"heroOrder":["hero.png","hero2.png","hero3.png"]}
    """;
  public static final String SOLD_OUT_MESSAGE = """
    FELIZMENTE, HOJE ESGOTAMOS TUDO!

    Agradecemos demais a todos vocês que compraram e colaboraram com a gente hoje.

    Nosso estoque foi totalmente vendido, mas não se preocupe: amanhã tem mais Menfi’s Burger esperando por você.

    Ative o alerta abaixo para ser avisado assim que voltarmos a receber pedidos.
    """;
  private static final String DEFAULT_OPERATING_HOURS = """
    {"days":[
      {"day":0,"label":"Domingo","open":true,"soldOut":true,"start":"18:00","end":"22:00"},
      {"day":1,"label":"Segunda","open":false,"soldOut":true,"start":"18:00","end":"22:00"},
      {"day":2,"label":"Terça","open":true,"soldOut":true,"start":"18:00","end":"22:00"},
      {"day":3,"label":"Quarta","open":true,"soldOut":true,"start":"18:00","end":"22:00"},
      {"day":4,"label":"Quinta","open":true,"soldOut":true,"start":"18:00","end":"22:00"},
      {"day":5,"label":"Sexta","open":true,"soldOut":true,"start":"18:00","end":"22:00"},
      {"day":6,"label":"Sábado","open":true,"soldOut":true,"start":"18:00","end":"22:00"}
    ]}
    """;
  private static final String DEFAULT_PRESENTATION = """
    {"enabled":true,"intervalSeconds":6,"imageCount":1,"images":["/descanso.png"],"carouselProductIds":["triple-combo","tropikal-menfis","tropikal-barbecue","smash-nutella-marshmallow"],"carouselIntervalSeconds":3}
    """;
  private static final String DEFAULT_PROMO_CARDS = """
    [
      {"id":"mfb10","enabled":true,"eyebrow":"Primeira compra?","title":"MFB10","copy":"Ganhe 10% OFF no primeiro pedido","value":"10%","suffix":"OFF","icon":"gift"},
      {"id":"combolove","enabled":true,"eyebrow":"Quarta-feira","title":"LOV50","copy":"Na compra de um combo, o segundo sai com 50% OFF","value":"50%","suffix":"2o combo","icon":"flame"}
    ]
    """;
  private static final String DEFAULT_SPECIAL_OFFER = """
    {"enabled":true,"oncePerSession":true,"productId":"triple-combo","title":"Combo Triple Menfi's — O Matador de Fome","description":"3 carnes suculentas, cheddar derretido, salada, molho Menfi's e muito capricho. Um combo pesado, feito para quem chega com fome de verdade.","image":"/menu/supercombomnfis.png","price":65.9,"primaryButton":"Adicionar ao pedido","secondaryButton":"Ver cardápio"}
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

  public boolean soldOutEnabled() {
    return Boolean.parseBoolean(value(SOLD_OUT, "false"));
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

  public Map<String, Object> presentationSettings() {
    try {
      return objectMapper.readValue(value(PRESENTATION, DEFAULT_PRESENTATION), new TypeReference<>() {});
    } catch (Exception ignored) {
      try {
        return objectMapper.readValue(DEFAULT_PRESENTATION, new TypeReference<>() {});
      } catch (Exception fallbackError) {
        return Map.of("enabled", true, "intervalSeconds", 6, "imageCount", 1, "images", List.of("/descanso.png"), "carouselProductIds", List.of("triple-combo", "tropikal-menfis", "tropikal-barbecue", "smash-nutella-marshmallow"), "carouselIntervalSeconds", 3);
      }
    }
  }

  public List<Map<String, Object>> promoCards() {
    try {
      return objectMapper.readValue(value(PROMO_CARDS, DEFAULT_PROMO_CARDS), new TypeReference<>() {});
    } catch (Exception ignored) {
      try {
        return objectMapper.readValue(DEFAULT_PROMO_CARDS, new TypeReference<>() {});
      } catch (Exception fallbackError) {
        return List.of();
      }
    }
  }

  public Map<String, Object> specialOfferSettings() {
    try {
      return objectMapper.readValue(value(SPECIAL_OFFER, DEFAULT_SPECIAL_OFFER), new TypeReference<>() {});
    } catch (Exception ignored) {
      try {
        return objectMapper.readValue(DEFAULT_SPECIAL_OFFER, new TypeReference<>() {});
      } catch (Exception fallbackError) {
        return Map.of();
      }
    }
  }

  public Map<String, Object> lemonadeSettings() {
    try {
      return objectMapper.readValue(value(LEMONADE_SETTINGS, DEFAULT_LEMONADE_SETTINGS), new TypeReference<>() {});
    } catch (Exception ignored) {
      try {
        return objectMapper.readValue(DEFAULT_LEMONADE_SETTINGS, new TypeReference<>() {});
      } catch (Exception fallbackError) {
        return Map.of();
      }
    }
  }

  public Map<String, Object> publicSettings() {
    OperatingStatus operatingStatus = operatingStatus();
    boolean soldOut = soldOutEnabled();
    boolean soldOutActive = isSoldOutNow();
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("payOnDeliveryEnabled", payOnDeliveryEnabled());
    response.put("testModeEnabled", testModeEnabled());
    response.put("featuredProductId", featuredProductId());
    response.put("demoTableEnabled", demoTableEnabled());
    response.put("operatingHours", operatingHours());
    response.put("presentation", presentationSettings());
    response.put("promoCards", promoCards());
    response.put("specialOffer", specialOfferSettings());
    response.put("lemonade", lemonadeSettings());
    response.put("soldOutEnabled", soldOut);
    response.put("soldOutActive", soldOutActive);
    response.put("soldOutMessage", SOLD_OUT_MESSAGE);
    response.put("operatingNow", !soldOutActive && operatingStatus.open());
    response.put("operatingHoursSummary", operatingStatus.summary());
    response.put("operatingHoursMessage", soldOutActive ? SOLD_OUT_MESSAGE : operatingStatus.message());
    return response;
  }

  /** The restaurant schedule is evaluated in its local operating timezone, never in the server timezone. */
  public boolean isOperatingNow() {
    return !isSoldOutNow() && operatingStatus().open();
  }

  public boolean isSoldOutNow() {
    if (!soldOutEnabled()) return false;
    Map<String, Object> config = operatingHours();
    Object rawDays = config.get("days");
    List<?> days = rawDays instanceof List<?> list ? list : List.of();
    int currentDay = currentOperatingDay();
    for (Object entry : days) {
      if (!(entry instanceof Map<?, ?> day)) continue;
      if (number(day.get("day")) != currentDay) continue;
      Object rawSoldOut = day.get("soldOut");
      return rawSoldOut == null || Boolean.TRUE.equals(rawSoldOut);
    }
    return true;
  }

  private OperatingStatus operatingStatus() {
    Map<String, Object> config = operatingHours();
    Object rawDays = config.get("days");
    List<?> days = rawDays instanceof List<?> list ? list : List.of();
    ZonedDateTime now = ZonedDateTime.now(ZoneId.of("America/Sao_Paulo"));
    int currentDay = currentOperatingDay();
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

  private int currentOperatingDay() {
    ZonedDateTime now = ZonedDateTime.now(ZoneId.of("America/Sao_Paulo"));
    return now.getDayOfWeek().getValue() % 7; // Java: Sunday=7; UI: Sunday=0.
  }

  public Map<String, Object> setSoldOutEnabled(boolean enabled) {
    jdbc.update(
      """
      insert into app_settings(key, value, updated_at)
      values (?, ?, now())
      on conflict (key) do update set value = excluded.value, updated_at = now()
      """,
      SOLD_OUT,
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

  public Map<String, Object> setPresentationSettings(Map<String, Object> presentation) {
    try {
      jdbc.update(
        """
        insert into app_settings(key, value, updated_at)
        values (?, ?, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()
        """,
        PRESENTATION,
        objectMapper.writeValueAsString(presentation == null ? Map.of() : presentation)
      );
    } catch (Exception e) {
      throw new IllegalArgumentException("Apresentação inválida.");
    }
    return publicSettings();
  }

  public Map<String, Object> setLemonadeSettings(Map<String, Object> lemonade) {
    try {
      jdbc.update(
        """
        insert into app_settings(key, value, updated_at)
        values (?, ?, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()
        """,
        LEMONADE_SETTINGS,
        objectMapper.writeValueAsString(lemonade == null ? Map.of() : lemonade)
      );
    } catch (Exception error) {
      throw new IllegalArgumentException("invalid_lemonade_settings", error);
    }
    return publicSettings();
  }

  public Map<String, Object> setPromoCards(List<Map<String, Object>> promoCards) {
    try {
      jdbc.update(
        """
        insert into app_settings(key, value, updated_at)
        values (?, ?, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()
        """,
        PROMO_CARDS,
        objectMapper.writeValueAsString(promoCards == null ? List.of() : promoCards)
      );
    } catch (Exception e) {
      throw new IllegalArgumentException("Cards promocionais inválidos.");
    }
    return publicSettings();
  }

  public Map<String, Object> setSpecialOfferSettings(Map<String, Object> specialOffer) {
    try {
      jdbc.update(
        """
        insert into app_settings(key, value, updated_at)
        values (?, ?, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()
        """,
        SPECIAL_OFFER,
        objectMapper.writeValueAsString(specialOffer == null ? Map.of() : specialOffer)
      );
    } catch (Exception e) {
      throw new IllegalArgumentException("Pop-up promocional inválido.");
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
