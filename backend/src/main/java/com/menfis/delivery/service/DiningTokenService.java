package com.menfis.delivery.service;

import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.stereotype.Service;

@Service
public class DiningTokenService {
  private static final int TOKEN_BYTES = 32;
  private final SecureRandom secureRandom;

  public DiningTokenService() {
    this(new SecureRandom());
  }

  DiningTokenService(SecureRandom secureRandom) {
    this.secureRandom = secureRandom;
  }

  public String generate() {
    byte[] bytes = new byte[TOKEN_BYTES];
    secureRandom.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }
}
