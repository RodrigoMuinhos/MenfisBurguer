package com.menfis.delivery.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;

public final class SalesPlanningCalculator {
  private static final BigDecimal HUNDRED = new BigDecimal("100");

  private SalesPlanningCalculator() {}

  public static BigDecimal money(BigDecimal value) {
    return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
  }

  public static BigDecimal percentage(BigDecimal value, BigDecimal reference) {
    if (reference == null || reference.signum() <= 0) return BigDecimal.ZERO.setScale(2);
    return money(value).multiply(HUNDRED).divide(reference, 2, RoundingMode.HALF_UP);
  }

  public static BigDecimal growth(BigDecimal current, BigDecimal previous) {
    if (previous == null || previous.signum() <= 0) {
      return current != null && current.signum() > 0 ? HUNDRED.setScale(2) : BigDecimal.ZERO.setScale(2);
    }
    return money(current).subtract(money(previous))
      .multiply(HUNDRED)
      .divide(previous, 2, RoundingMode.HALF_UP);
  }

  public static int requiredOrders(BigDecimal goal, BigDecimal revenue, BigDecimal averageTicket) {
    BigDecimal missing = money(goal).subtract(money(revenue)).max(BigDecimal.ZERO);
    if (missing.signum() == 0 || averageTicket == null || averageTicket.signum() <= 0) return 0;
    return missing.divide(averageTicket, 0, RoundingMode.CEILING).intValue();
  }

  public static Map<Integer, BigDecimal> distribute(
    BigDecimal remaining,
    Map<Integer, BigDecimal> historicalWeights
  ) {
    Map<Integer, BigDecimal> result = new LinkedHashMap<>();
    if (historicalWeights.isEmpty()) return result;
    BigDecimal totalWeight = historicalWeights.values().stream()
      .map(value -> value == null ? BigDecimal.ZERO : value.max(BigDecimal.ZERO))
      .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal allocated = BigDecimal.ZERO;
    int index = 0;
    for (var entry : historicalWeights.entrySet()) {
      index++;
      BigDecimal target;
      if (index == historicalWeights.size()) {
        target = money(remaining).subtract(allocated).max(BigDecimal.ZERO);
      } else {
        BigDecimal weight = totalWeight.signum() > 0
          ? entry.getValue().max(BigDecimal.ZERO).divide(totalWeight, 8, RoundingMode.HALF_UP)
          : BigDecimal.ONE.divide(BigDecimal.valueOf(historicalWeights.size()), 8, RoundingMode.HALF_UP);
        target = money(money(remaining).multiply(weight));
        allocated = allocated.add(target);
      }
      result.put(entry.getKey(), target);
    }
    return result;
  }
}
