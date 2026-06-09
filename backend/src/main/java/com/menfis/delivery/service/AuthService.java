package com.menfis.delivery.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Locale;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.menfis.delivery.dto.ApiDtos.LoginResponse;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class AuthService {
  private final JdbcTemplate jdbc;
  private final PasswordEncoder encoder;

  @Value("${menfis.jwt-secret}")
  private String jwtSecret;

  @Value("${menfis.environment:local}")
  private String environment;

  public AuthService(JdbcTemplate jdbc, PasswordEncoder encoder) {
    this.jdbc = jdbc;
    this.encoder = encoder;
  }

  public LoginResponse login(String login, String password) {
    String normalizedLogin = login == null ? "" : login.trim().toLowerCase(Locale.ROOT);
    if (normalizedLogin.isBlank() || password == null || password.isBlank()) {
      throw new IllegalArgumentException("invalid_credentials");
    }

    AdminCredential admin = findAdminByLogin(normalizedLogin);
    if (admin == null) {
      bootstrapAdminFromEnvironment(normalizedLogin, password);
      admin = findAdminByLogin(normalizedLogin);
    }
    if (admin == null || !encoder.matches(password, admin.passwordHash())) {
      throw new IllegalArgumentException("invalid_credentials");
    }

    return new LoginResponse(issueToken(admin.login(), admin.role()), admin.role());
  }

  public LoginResponse kdsSession() {
    if (!"local".equalsIgnoreCase(environment)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "kds_session_local_only");
    }
    return new LoginResponse(issueToken("kds-local", "ADMIN"), "ADMIN");
  }

  public LoginResponse deliverySession() {
    if (!"local".equalsIgnoreCase(environment)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "delivery_session_local_only");
    }
    return new LoginResponse(issueToken("delivery-local", "DELIVERY"), "DELIVERY");
  }

  public LoginResponse customerSession(long customerId) {
    return new LoginResponse(issueToken("customer:" + customerId, "CUSTOMER"), "CUSTOMER");
  }

  private String issueToken(String subject, String role) {
    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    return Jwts.builder()
      .subject(subject)
      .claim("role", role)
      .issuedAt(Date.from(Instant.now()))
      .expiration(Date.from(Instant.now().plusSeconds(60 * 60 * 12)))
      .signWith(key)
      .compact();
  }

  private AdminCredential findAdminByLogin(String normalizedLogin) {
    try {
      return jdbc.queryForObject(
        """
        select login, password_hash, role
        from admins
        where active = true and lower(login) = ?
        limit 1
        """,
        (rs, rowNum) -> new AdminCredential(
          rs.getString("login"),
          rs.getString("password_hash"),
          rs.getString("role")
        ),
        normalizedLogin
      );
    } catch (EmptyResultDataAccessException ex) {
      return null;
    }
  }

  private void bootstrapAdminFromEnvironment(String normalizedLogin, String rawPassword) {
    String seedLogin = System.getenv("ADMIN_LOGIN");
    String seedPassword = System.getenv("ADMIN_PASSWORD");
    if (seedLogin == null || seedPassword == null) return;

    String expectedLogin = seedLogin.trim().toLowerCase(Locale.ROOT);
    if (expectedLogin.isBlank() || !expectedLogin.equals(normalizedLogin)) return;
    if (!seedPassword.equals(rawPassword)) return;

    Integer existing = jdbc.queryForObject(
      "select count(*) from admins where lower(login) = ?",
      Integer.class,
      expectedLogin
    );
    if (existing != null && existing > 0) return;

    jdbc.update(
      """
      insert into admins (name, login, password_hash, role, active)
      values (?, ?, ?, 'ADMIN', true)
      """,
      defaultAdminName(),
      expectedLogin,
      encoder.encode(seedPassword)
    );
  }

  private String defaultAdminName() {
    String envName = System.getenv("ADMIN_NAME");
    return envName == null || envName.isBlank() ? "Administrador Menfi's" : envName.trim();
  }

  public void requireAdmin(String authorization) {
    requireRole(authorization, "ADMIN");
  }

  public void requireDelivery(String authorization) {
    requireRole(authorization, "DELIVERY");
  }

  public long requireCustomer(String authorization) {
    var claims = requireRole(authorization, "CUSTOMER");
    String subject = claims.getSubject();
    if (subject == null || !subject.startsWith("customer:")) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_customer_token");
    }
    try {
      return Long.parseLong(subject.substring("customer:".length()));
    } catch (NumberFormatException ex) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_customer_token");
    }
  }

  private io.jsonwebtoken.Claims requireRole(String authorization, String requiredRole) {
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "token_required");
    }
    try {
      SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
      var claims = Jwts.parser()
        .verifyWith(key)
        .build()
        .parseSignedClaims(authorization.substring("Bearer ".length()))
        .getPayload();
      if (!requiredRole.equals(claims.get("role", String.class))) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "role_required");
      }
      return claims;
    } catch (ResponseStatusException ex) {
      throw ex;
    } catch (JwtException | IllegalArgumentException ex) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_token");
    }
  }

  private record AdminCredential(String login, String passwordHash, String role) {}
}
