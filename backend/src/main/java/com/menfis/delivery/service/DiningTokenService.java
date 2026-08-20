package com.menfis.delivery.service;

import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.stereotype.Service;

@Service
public class DiningTokenService {
  private static final int TOKEN_BYTES = 32;
  private static final int PUBLIC_TOKEN_BYTES = 12;
  private final SecureRandom secureRandom;

  public DiningTokenService() {
    this(new SecureRandom());
  }

  DiningTokenService(SecureRandom secureRandom) {
    this.secureRandom = secureRandom;
  }

  public String generate() {
    return generate(TOKEN_BYTES);
  }

  public String generatePublic() {
    return generate(PUBLIC_TOKEN_BYTES);
  }

  private String generate(int size) {
    byte[] bytes = new byte[size];
    secureRandom.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }
}
