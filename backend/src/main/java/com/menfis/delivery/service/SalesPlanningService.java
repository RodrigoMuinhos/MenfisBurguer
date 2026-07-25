package com.menfis.delivery.service;

import static com.menfis.delivery.service.SalesPlanningCalculator.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class SalesPlanningService {
  private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Sao_Paulo");
  private static final BigDecimal RECOMMENDED_GROWTH = new BigDecimal("0.08");
  private static final String BILLABLE = """
    status in ('PAYMENT_APPROVED','PAID','ACCEPTED','IN_PREPARATION','READY','OUT_FOR_DELIVERY','DELIVERED')
    """;

  private final JdbcTemplate jdbc;
  private final SettingsService settings;
  private final Clock clock;

  public SalesPlanningService(JdbcTemplate jdbc, SettingsService settings) {
    this(jdbc, settings, Clock.system(BUSINESS_ZONE));
  }

  SalesPlanningService(JdbcTemplate jdbc, SettingsService settings, Clock clock) {
    this.jdbc = jdbc;
    this.settings = settings;
    this.clock = clock;
  }

  public Map<String, Object> overview() {
    LocalDate today = LocalDate.now(clock.withZone(BUSINESS_ZONE));
    LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    List<Map<String, Object>> history = dailyHistory(today.minusWeeks(12), today);
    Map<LocalDate, DaySales> days = new LinkedHashMap<>();
    history.forEach(row -> {
      Object rawDate = row.get("sale_date");
      LocalDate date = rawDate instanceof LocalDate localDate
        ? localDate
        : ((java.sql.Date) rawDate).toLocalDate();
      days.put(date, new DaySales(money((BigDecimal) row.get("revenue")), ((Number) row.get("orders_count")).intValue()));
    });

    DaySales todaySales = days.getOrDefault(today, DaySales.ZERO);
    BigDecimal maintenance = weekdayAverage(days, today.getDayOfWeek(), today.minusWeeks(4), today.minusDays(1));
    if (maintenance.signum() == 0) maintenance = average(days, today.minusDays(28), today.minusDays(1));
    BigDecimal recommended = money(maintenance.multiply(BigDecimal.ONE.add(RECOMMENDED_GROWTH)));
    BigDecimal ideal = weekdayMaximum(days, today.getDayOfWeek(), today.minusWeeks(12), today.minusDays(1)).max(recommended);
    BigDecimal minimum = money(maintenance.multiply(new BigDecimal("0.70")));
    BigDecimal ticket = todaySales.orders() > 0
      ? todaySales.revenue().divide(BigDecimal.valueOf(todaySales.orders()), 2, RoundingMode.HALF_UP)
      : historicalTicket(days, today.getDayOfWeek(), today.minusWeeks(4), today.minusDays(1));
    BigDecimal projection = projectedToday(today, todaySales.revenue(), days);
    BigDecimal missing = recommended.subtract(todaySales.revenue()).max(BigDecimal.ZERO);

    Map<String, Object> daily = new LinkedHashMap<>();
    daily.put("date", today);
    daily.put("revenue", todaySales.revenue());
    daily.put("target", recommended);
    daily.put("minimumGoal", minimum);
    daily.put("maintenanceGoal", maintenance);
    daily.put("recommendedGoal", recommended);
    daily.put("idealGoal", ideal);
    daily.put("targetPercentage", percentage(todaySales.revenue(), recommended));
    daily.put("missingRevenue", missing);
    daily.put("averageTicket", ticket);
    daily.put("ordersCount", todaySales.orders());
    daily.put("requiredOrders", requiredOrders(recommended, todaySales.revenue(), ticket));
    daily.put("projectedRevenue", projection);
    daily.put("status", todaySales.revenue().compareTo(recommended) >= 0 ? "ACHIEVED" : projection.compareTo(recommended) >= 0 ? "ON_TRACK" : "BELOW");

    BigDecimal currentWeek = sum(days, weekStart, today);
    LocalDate previousStart = weekStart.minusWeeks(1);
    BigDecimal previousWeek = sum(days, previousStart, previousStart.plusDays(6));
    BigDecimal fourWeekAverage = BigDecimal.ZERO;
    for (int i = 1; i <= 4; i++) {
      LocalDate start = weekStart.minusWeeks(i);
      fourWeekAverage = fourWeekAverage.add(sum(days, start, start.plusDays(6)));
    }
    fourWeekAverage = money(fourWeekAverage.divide(BigDecimal.valueOf(4), 4, RoundingMode.HALF_UP));
    BigDecimal weeklyTarget = money(previousWeek.multiply(BigDecimal.ONE.add(RECOMMENDED_GROWTH)));
    if (weeklyTarget.signum() == 0) weeklyTarget = money(fourWeekAverage.multiply(BigDecimal.ONE.add(RECOMMENDED_GROWTH)));
    BigDecimal remaining = weeklyTarget.subtract(currentWeek).max(BigDecimal.ZERO);
    Map<Integer, BigDecimal> weights = new LinkedHashMap<>();
    for (LocalDate date = today; !date.isAfter(weekStart.plusDays(6)); date = date.plusDays(1)) {
      weights.put(date.getDayOfWeek().getValue(), weekdayAverage(days, date.getDayOfWeek(), today.minusWeeks(8), today.minusDays(1)));
    }
    Map<Integer, BigDecimal> targets = distribute(remaining, weights);
    List<Map<String, Object>> dailyTargets = new ArrayList<>();
    for (LocalDate date = today; !date.isAfter(weekStart.plusDays(6)); date = date.plusDays(1)) {
      BigDecimal value = targets.getOrDefault(date.getDayOfWeek().getValue(), BigDecimal.ZERO);
      dailyTargets.add(Map.of(
        "date", date,
        "dayOfWeek", dayLabel(date.getDayOfWeek()),
        "historicalWeight", percentage(weights.get(date.getDayOfWeek().getValue()), weights.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add)),
        "target", value
      ));
    }
    Map<String, Object> weekly = new LinkedHashMap<>();
    weekly.put("weekStart", weekStart);
    weekly.put("weekEnd", weekStart.plusDays(6));
    weekly.put("currentRevenue", currentWeek);
    weekly.put("weeklyTarget", weeklyTarget);
    weekly.put("previousWeekRevenue", previousWeek);
    weekly.put("fourWeekAverage", fourWeekAverage);
    weekly.put("remainingRevenue", remaining);
    weekly.put("remainingDays", dailyTargets.size());
    weekly.put("growthPercentage", growth(currentWeek, previousWeek));
    weekly.put("projectedClosingRevenue", projection.add(sum(days, weekStart, today.minusDays(1))));
    weekly.put("dailyTargets", dailyTargets);

    return Map.of(
      "generatedAt", LocalDateTime.now(clock.withZone(BUSINESS_ZONE)),
      "timezone", BUSINESS_ZONE.getId(),
      "daily", daily,
      "weekly", weekly,
      "comparison", weeklyComparison(days, weekStart),
      "rules", Map.of("growthPercentage", 8, "stabilityRange", 3)
    );
  }

  private List<Map<String, Object>> dailyHistory(LocalDate start, LocalDate end) {
    return jdbc.queryForList(
      """
      select (created_at at time zone 'America/Sao_Paulo')::date as sale_date,
             coalesce(sum(total), 0)::numeric as revenue,
             count(*) as orders_count
      from orders
      where test_mode = ?
        and %s
        and (created_at at time zone 'America/Sao_Paulo')::date between ? and ?
      group by sale_date
      order by sale_date
      """.formatted(BILLABLE),
      settings.testModeEnabled(), start, end
    );
  }

  private List<Map<String, Object>> weeklyComparison(Map<LocalDate, DaySales> days, LocalDate currentStart) {
    List<Map<String, Object>> rows = new ArrayList<>();
    BigDecimal previous = null;
    for (int offset = -3; offset <= 0; offset++) {
      LocalDate start = currentStart.plusWeeks(offset);
      LocalDate end = offset == 0 ? LocalDate.now(clock.withZone(BUSINESS_ZONE)) : start.plusDays(6);
      BigDecimal revenue = sum(days, start, end);
      int orders = orderCount(days, start, end);
      BigDecimal change = previous == null ? BigDecimal.ZERO : growth(revenue, previous);
      String status = offset == 0 ? "PARTIAL" : change.abs().compareTo(new BigDecimal("3")) <= 0 ? "STABLE" : change.signum() > 0 ? "GROWTH" : "DECLINE";
      rows.add(Map.of(
        "weekStart", start, "weekEnd", end, "revenue", revenue, "orders", orders,
        "averageTicket", orders == 0 ? BigDecimal.ZERO.setScale(2) : revenue.divide(BigDecimal.valueOf(orders), 2, RoundingMode.HALF_UP),
        "growthPercentage", change, "status", status
      ));
      previous = revenue;
    }
    return rows;
  }

  private BigDecimal projectedToday(LocalDate today, BigDecimal revenue, Map<LocalDate, DaySales> days) {
    if (revenue.signum() == 0) return BigDecimal.ZERO.setScale(2);
    int hour = LocalDateTime.now(clock.withZone(BUSINESS_ZONE)).getHour();
    BigDecimal historicalTotal = jdbc.queryForObject(
      """
      select coalesce(sum(total), 0)::numeric from orders
      where test_mode = ? and %s
        and extract(isodow from created_at at time zone 'America/Sao_Paulo') = ?
        and (created_at at time zone 'America/Sao_Paulo')::date between ? and ?
      """.formatted(BILLABLE),
      BigDecimal.class, settings.testModeEnabled(), today.getDayOfWeek().getValue(), today.minusWeeks(8), today.minusDays(1)
    );
    BigDecimal historicalElapsed = jdbc.queryForObject(
      """
      select coalesce(sum(total), 0)::numeric from orders
      where test_mode = ? and %s
        and extract(isodow from created_at at time zone 'America/Sao_Paulo') = ?
        and extract(hour from created_at at time zone 'America/Sao_Paulo') <= ?
        and (created_at at time zone 'America/Sao_Paulo')::date between ? and ?
      """.formatted(BILLABLE),
      BigDecimal.class, settings.testModeEnabled(), today.getDayOfWeek().getValue(), hour, today.minusWeeks(8), today.minusDays(1)
    );
    if (historicalTotal == null || historicalElapsed == null || historicalElapsed.signum() <= 0) return revenue;
    BigDecimal elapsedShare = historicalElapsed.divide(historicalTotal, 8, RoundingMode.HALF_UP);
    return elapsedShare.signum() <= 0 ? revenue : money(revenue.divide(elapsedShare, 2, RoundingMode.HALF_UP));
  }

  private BigDecimal weekdayAverage(Map<LocalDate, DaySales> days, DayOfWeek weekday, LocalDate start, LocalDate end) {
    List<BigDecimal> values = days.entrySet().stream().filter(e -> !e.getKey().isBefore(start) && !e.getKey().isAfter(end) && e.getKey().getDayOfWeek() == weekday).map(e -> e.getValue().revenue()).toList();
    return values.isEmpty() ? BigDecimal.ZERO.setScale(2) : money(values.stream().reduce(BigDecimal.ZERO, BigDecimal::add).divide(BigDecimal.valueOf(values.size()), 4, RoundingMode.HALF_UP));
  }

  private BigDecimal weekdayMaximum(Map<LocalDate, DaySales> days, DayOfWeek weekday, LocalDate start, LocalDate end) {
    return days.entrySet().stream().filter(e -> !e.getKey().isBefore(start) && !e.getKey().isAfter(end) && e.getKey().getDayOfWeek() == weekday).map(e -> e.getValue().revenue()).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO).setScale(2);
  }

  private BigDecimal average(Map<LocalDate, DaySales> days, LocalDate start, LocalDate end) {
    long count = start.datesUntil(end.plusDays(1)).count();
    return count == 0 ? BigDecimal.ZERO.setScale(2) : money(sum(days, start, end).divide(BigDecimal.valueOf(count), 4, RoundingMode.HALF_UP));
  }

  private BigDecimal historicalTicket(Map<LocalDate, DaySales> days, DayOfWeek weekday, LocalDate start, LocalDate end) {
    BigDecimal revenue = BigDecimal.ZERO; int orders = 0;
    for (var entry : days.entrySet()) if (!entry.getKey().isBefore(start) && !entry.getKey().isAfter(end) && entry.getKey().getDayOfWeek() == weekday) { revenue = revenue.add(entry.getValue().revenue()); orders += entry.getValue().orders(); }
    return orders == 0 ? BigDecimal.ZERO.setScale(2) : revenue.divide(BigDecimal.valueOf(orders), 2, RoundingMode.HALF_UP);
  }

  private BigDecimal sum(Map<LocalDate, DaySales> days, LocalDate start, LocalDate end) {
    if (end.isBefore(start)) return BigDecimal.ZERO.setScale(2);
    return money(days.entrySet().stream().filter(e -> !e.getKey().isBefore(start) && !e.getKey().isAfter(end)).map(e -> e.getValue().revenue()).reduce(BigDecimal.ZERO, BigDecimal::add));
  }

  private int orderCount(Map<LocalDate, DaySales> days, LocalDate start, LocalDate end) {
    return days.entrySet().stream().filter(e -> !e.getKey().isBefore(start) && !e.getKey().isAfter(end)).mapToInt(e -> e.getValue().orders()).sum();
  }

  private String dayLabel(DayOfWeek day) {
    return switch (day) { case MONDAY -> "Segunda"; case TUESDAY -> "Terça"; case WEDNESDAY -> "Quarta"; case THURSDAY -> "Quinta"; case FRIDAY -> "Sexta"; case SATURDAY -> "Sábado"; case SUNDAY -> "Domingo"; };
  }

  private record DaySales(BigDecimal revenue, int orders) {
    private static final DaySales ZERO = new DaySales(BigDecimal.ZERO.setScale(2), 0);
  }
}
