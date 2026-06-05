package com.menfis.delivery.service;

import com.menfis.delivery.dto.ApiDtos.LoginResponse;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class AuthService {
  private final PasswordEncoder encoder;

  @Value("${menfis.jwt-secret}")
  private String jwtSecret;

  public AuthService(PasswordEncoder encoder) {
    this.encoder = encoder;
  }

  public LoginResponse login(String login, String password) {
    String devLogin = System.getenv().getOrDefault("ADMIN_LOGIN", "04411750317");
    String devPassword = System.getenv().getOrDefault("ADMIN_PASSWORD", "rodrigo123");
    if (!login.equals(devLogin) || !password.equals(devPassword)) {
      throw new IllegalArgumentException("invalid_credentials");
    }
    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    String token = Jwts.builder()
      .subject(login)
      .claim("role", "ADMIN")
      .issuedAt(Date.from(Instant.now()))
      .expiration(Date.from(Instant.now().plusSeconds(60 * 60 * 8)))
      .signWith(key)
      .compact();
    return new LoginResponse(token, "ADMIN");
  }

  public void requireAdmin(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "admin_token_required");
    }
    try {
      SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
      var claims = Jwts.parser()
        .verifyWith(key)
        .build()
        .parseSignedClaims(authorization.substring("Bearer ".length()))
        .getPayload();
      if (!"ADMIN".equals(claims.get("role", String.class))) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "admin_role_required");
      }
    } catch (ResponseStatusException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_admin_token");
    }
  }
}
