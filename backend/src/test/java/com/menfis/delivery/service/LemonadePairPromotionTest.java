package com.menfis.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.api.Test;

class LemonadePairPromotionTest {
  private static final BigDecimal UNIT = new BigDecimal("24.90");

  @ParameterizedTest
  @CsvSource({
    "1, 24.90",
    "2, 37.90",
    "3, 62.80",
    "4, 75.80",
    "5, 100.70",
    "6, 113.70",
    "8, 151.60",
  })
  void pairsCost3790AndAnUnpairedLemonadeKeepsFullPrice(int quantity, String expectedTotal) {
    List<BigDecimal> units = Collections.nCopies(quantity, UNIT);
    BigDecimal regular = UNIT.multiply(BigDecimal.valueOf(quantity));

    BigDecimal total = regular.subtract(LemonadePairPromotion.discount(units));

    assertThat(total).isEqualByComparingTo(expectedTotal);
  }

  @Test
  void noLemonadesMeansNoDiscount() {
    assertThat(LemonadePairPromotion.discount(List.of())).isEqualByComparingTo("0");
  }

  @Test
  void onlyLemonadeProductsCount() {
    assertThat(LemonadePairPromotion.isLemonade("pink-lemonade")).isTrue();
    assertThat(LemonadePairPromotion.isLemonade("purple-lemonade")).isTrue();
    assertThat(LemonadePairPromotion.isLemonade("sunset-lemonade")).isTrue();
    assertThat(LemonadePairPromotion.isLemonade("combo-menfis")).isFalse();
    assertThat(LemonadePairPromotion.isLemonade(null)).isFalse();
  }
}
