package com.menfis.delivery.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import org.junit.jupiter.api.Test;

class SalesPlanningCalculatorTest {
  @Test
  void calculatesRequiredOrdersWithFinancialRounding() {
    assertEquals(2, SalesPlanningCalculator.requiredOrders(
      new BigDecimal("350.00"), new BigDecimal("280.00"), new BigDecimal("42.75")
    ));
    assertEquals(0, SalesPlanningCalculator.requiredOrders(
      new BigDecimal("350.00"), new BigDecimal("360.00"), new BigDecimal("42.75")
    ));
  }

  @Test
  void calculatesWeeklyGrowth() {
    assertEquals(new BigDecimal("8.00"), SalesPlanningCalculator.growth(
      new BigDecimal("1080.00"), new BigDecimal("1000.00")
    ));
  }

  @Test
  void distributesRemainingGoalUsingHistoricalWeightsWithoutLosingCents() {
    var weights = new LinkedHashMap<Integer, BigDecimal>();
    weights.put(6, new BigDecimal("60"));
    weights.put(7, new BigDecimal("40"));
    var result = SalesPlanningCalculator.distribute(new BigDecimal("600.00"), weights);
    assertEquals(new BigDecimal("360.00"), result.get(6));
    assertEquals(new BigDecimal("240.00"), result.get(7));
  }
}
