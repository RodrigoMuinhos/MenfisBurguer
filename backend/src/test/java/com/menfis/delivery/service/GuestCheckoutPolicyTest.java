package com.menfis.delivery.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.menfis.delivery.domain.DeliveryType;
import com.menfis.delivery.domain.OrderChannel;
import org.junit.jupiter.api.Test;

class GuestCheckoutPolicyTest {
  @Test
  void guestCanCreateDeliveryWithNameAndAddress() {
    assertDoesNotThrow(() -> OrderService.validateGuestCheckout(
      OrderChannel.DELIVERY,
      DeliveryType.DELIVERY,
      null,
      "Marina",
      "Rua das Flores, 42"
    ));
  }

  @Test
  void guestNameIsRequired() {
    assertThrows(IllegalArgumentException.class, () -> OrderService.validateGuestCheckout(
      OrderChannel.DELIVERY,
      DeliveryType.DELIVERY,
      null,
      " ",
      "Rua das Flores, 42"
    ));
  }

  @Test
  void guestDeliveryAddressIsRequired() {
    assertThrows(IllegalArgumentException.class, () -> OrderService.validateGuestCheckout(
      OrderChannel.DELIVERY,
      DeliveryType.DELIVERY,
      null,
      "Marina",
      ""
    ));
  }

  @Test
  void authenticatedCustomerKeepsExistingFlow() {
    assertDoesNotThrow(() -> OrderService.validateGuestCheckout(
      OrderChannel.DELIVERY,
      DeliveryType.DELIVERY,
      42L,
      null,
      null
    ));
  }
}
