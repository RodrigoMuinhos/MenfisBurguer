package com.menfis.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class DiningTokenServiceTest {
  @Test
  void generatesLongUrlSafeNonSequentialTokens() {
    DiningTokenService service = new DiningTokenService();
    Set<String> tokens = new HashSet<>();

    for (int index = 0; index < 1000; index++) {
      String token = service.generate();
      assertThat(token).hasSizeGreaterThanOrEqualTo(32);
      assertThat(token).matches("[A-Za-z0-9_-]+");
      tokens.add(token);
    }

    assertThat(tokens).hasSize(1000);
  }
}
