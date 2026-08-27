package com.menfis.delivery.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class TerminalPaymentEnvironmentTest {

  @Test
  void enablesTerminalOnlyForExplicitDesktopEnvironment() {
    assertTrue(TerminalPaymentService.isTerminalPaymentEnabled("kiosk-menfis-desktop", true));
    assertTrue(TerminalPaymentService.isTerminalPaymentEnabled("KIOSK-MENFIS-DESKTOP", true));
  }

  @Test
  void keepsTerminalDisabledForDeployAndOrdinaryLocalEnvironments() {
    assertFalse(TerminalPaymentService.isTerminalPaymentEnabled("production", true));
    assertFalse(TerminalPaymentService.isTerminalPaymentEnabled("local", true));
    assertFalse(TerminalPaymentService.isTerminalPaymentEnabled("kiosk-menfis-desktop", false));
    assertFalse(TerminalPaymentService.isTerminalPaymentEnabled(null, true));
  }
}
