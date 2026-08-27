package com.menfis.delivery.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;

class OrderReceivedHoldTest {
  private final OffsetDateTime now = OffsetDateTime.parse("2026-08-19T12:00:00-03:00");

  @Test
  void remainsReceivedBeforeFiveMinutes() {
    assertFalse(OrderService.receivedHoldElapsed(now.minusMinutes(4).minusSeconds(59), now));
  }

  @Test
  void entersPreparationAtFiveMinutes() {
    assertTrue(OrderService.receivedHoldElapsed(now.minusMinutes(5), now));
  }

  @Test
  void unpaidOrderDoesNotEnterPreparation() {
    assertFalse(OrderService.receivedHoldElapsed(null, now));
  }
}
