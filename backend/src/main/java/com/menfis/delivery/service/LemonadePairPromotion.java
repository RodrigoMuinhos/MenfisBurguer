package com.menfis.delivery.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Lemonades are sold in pairs: every second lemonade in the order completes a
 * pair that costs {@link #PAIR_PRICE} in total; an unpaired lemonade keeps its
 * regular price. Flavors can be mixed and add-ons (vodka, cachaça...) are not
 * part of the promotion.
 */
final class LemonadePairPromotion {
  static final BigDecimal PAIR_PRICE = new BigDecimal("37.90");

  private LemonadePairPromotion() {}

  static boolean isLemonade(Object productId) {
    return productId != null && String.valueOf(productId).endsWith("-lemonade");
  }

  /**
   * @param unitBasePrices the base price (without add-ons) of each lemonade unit, in order
   * @return how much the pairs save compared with the regular unit prices
   */
  static BigDecimal discount(List<BigDecimal> unitBasePrices) {
    BigDecimal discount = BigDecimal.ZERO;
    for (int i = 1; i < unitBasePrices.size(); i += 2) {
      BigDecimal pairRegular = unitBasePrices.get(i - 1).add(unitBasePrices.get(i));
      discount = discount.add(pairRegular.subtract(PAIR_PRICE).max(BigDecimal.ZERO));
    }
    return discount.setScale(2, RoundingMode.HALF_UP);
  }
}
