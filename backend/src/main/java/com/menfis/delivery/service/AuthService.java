package com.menfis.delivery.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Locale;

import javax.crypto.SecretKey;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.menfis.delivery.dto.ApiDtos.LoginResponse;
import com.menfis.delivery.web.AuthController;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class AuthService {
  private static final String DEFAULT_ADMIN_LOGIN = "menfisburguer@adm.com";
  private static final String DEFAULT_ADMIN_PASSWORD = "menfis728";

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
    String rawPassword = password == null ? "" : password;
    if (normalizedLogin.isBlank()) {
      throw new IllegalArgumentException("invalid_credentials");
    }

    AdminCredential admin = findAdminByLogin(normalizedLogin);
    if (admin == null) {
      bootstrapDefaultAdmin(normalizedLogin, rawPassword);
      bootstrapAdminFromEnvironment(normalizedLogin);
      bootstrapDeliveryFromEnvironment(normalizedLogin, rawPassword);
      admin = findAdminByLogin(normalizedLogin);
    }
    if (admin == null) {
      throw new IllegalArgumentException("invalid_credentials");
    }
    if (rawPassword.isBlank() || !encoder.matches(rawPassword, admin.passwordHash())) {
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

  public LoginResponse adminSession() {
    if (!"local".equalsIgnoreCase(environment)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "admin_session_local_only");
    }
    return new LoginResponse(issueToken("admin-direct", "ADMIN"), "ADMIN");
  }

  public LoginResponse deliverySession() {
    if (!"local".equalsIgnoreCase(environment)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "delivery_session_local_only");
    }
    return new LoginResponse(issueToken("delivery-local", "DELIVERY"), "DELIVERY");
  }

  public LoginResponse customerSession(long customerId) {
    return new LoginResponse(issueToken("customer:" + customerId, "CUSTOMER", 60L * 60L * 24L * 180L), "CUSTOMER");
  }

  private String issueToken(String subject, String role) {
    return issueToken(subject, role, 60L * 60L * 12L);
  }

  private String issueToken(String subject, String role, long ttlSeconds) {
    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    return Jwts.builder()
      .subject(subject)
      .claim("role", role)
      .issuedAt(Date.from(Instant.now()))
      .expiration(Date.from(Instant.now().plusSeconds(ttlSeconds)))
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

  private void bootstrapAdminFromEnvironment(String normalizedLogin) {
    bootstrapAccountFromEnvironment(
      normalizedLogin,
      null,
      System.getenv("ADMIN_LOGIN"),
      System.getenv("ADMIN_PASSWORD"),
      System.getenv("ADMIN_NAME"),
      "ADMIN",
      "Administrador Menfi's"
    );
  }

  private void bootstrapDefaultAdmin(String normalizedLogin, String rawPassword) {
    if (!DEFAULT_ADMIN_LOGIN.equals(normalizedLogin) || !DEFAULT_ADMIN_PASSWORD.equals(rawPassword)) return;
    bootstrapAccountFromEnvironment(
      normalizedLogin,
      rawPassword,
      DEFAULT_ADMIN_LOGIN,
      DEFAULT_ADMIN_PASSWORD,
      "Administrador Menfi's",
      "ADMIN",
      "Administrador Menfi's"
    );
  }

  private void bootstrapDeliveryFromEnvironment(String normalizedLogin, String rawPassword) {
    bootstrapAccountFromEnvironment(
      normalizedLogin,
      rawPassword,
      System.getenv("DELIVERY_LOGIN"),
      System.getenv("DELIVERY_PASSWORD"),
      System.getenv("DELIVERY_NAME"),
      "DELIVERY",
      "Entregador Menfi's"
    );
  }

  private void bootstrapAccountFromEnvironment(
      String normalizedLogin,
      String rawPassword,
      String seedLogin,
      String seedPassword,
      String seedName,
      String role,
      String defaultName) {
    if (seedLogin == null || seedPassword == null) return;

    String expectedLogin = seedLogin.trim().toLowerCase(Locale.ROOT);
    if (expectedLogin.isBlank() || !expectedLogin.equals(normalizedLogin)) return;
    if (rawPassword != null && !seedPassword.equals(rawPassword)) return;

    Integer existing = jdbc.queryForObject(
      "select count(*) from admins where lower(login) = ?",
      Integer.class,
      expectedLogin
    );
    if (existing != null && existing > 0) return;

    jdbc.update(
      """
      insert into admins (name, login, password_hash, role, active)
      values (?, ?, ?, ?, true)
      """,
      seedName == null || seedName.isBlank() ? defaultName : seedName.trim(),
      expectedLogin,
      encoder.encode(seedPassword),
      role
    );
  }

  public Claims requireAdmin(String authorization) {
    return requireRole(resolveAuthorization(authorization), "ADMIN");
  }

  public Claims requireDelivery(String authorization) {
    return requireRole(authorization, "DELIVERY");
  }

  public Claims requireDeliveryOrAdmin(String authorization) {
    return requireAnyRole(resolveAuthorization(authorization), "DELIVERY", "ADMIN");
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

  private String resolveAuthorization(String authorization) {
    if (authorization != null && !authorization.isBlank()) return authorization;
    if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
      return authorization;
    }
    HttpServletRequest request = attributes.getRequest();
    Cookie[] cookies = request.getCookies();
    if (cookies == null) return authorization;
    for (Cookie cookie : cookies) {
      if (AuthController.ADMIN_SESSION_COOKIE.equals(cookie.getName())
          && cookie.getValue() != null
          && !cookie.getValue().isBlank()) {
        return "Bearer " + cookie.getValue();
      }
    }
    return authorization;
  }

  public Long optionalCustomer(String authorization) {
    if (authorization == null || authorization.isBlank()) return null;
    return requireCustomer(authorization);
  }

  private io.jsonwebtoken.Claims requireRole(String authorization, String requiredRole) {
    return requireAnyRole(authorization, requiredRole);
  }

  private io.jsonwebtoken.Claims requireAnyRole(String authorization, String... allowedRoles) {
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
      String actualRole = claims.get("role", String.class);
      boolean allowed = false;
      for (String role : allowedRoles) {
        if (role.equals(actualRole)) {
          allowed = true;
          break;
        }
      }
      if (!allowed) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "role_required");
      }
      return claims;
    } catch (ResponseStatusException ex) {
      throw ex;
    } catch (JwtException | IllegalArgumentException ex) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_token");
    }
  }

  public String currentAdminLogin(String authorization) {
    var claims = requireAdmin(authorization);
    return claims.getSubject();
  }

  public void updateAdminCredentials(String authorization, String login, String password) {
    String currentLogin = currentAdminLogin(authorization);
    String normalizedLogin = login == null ? "" : login.trim().toLowerCase(Locale.ROOT);
    String rawPassword = password == null ? "" : password.trim();
    if (normalizedLogin.isBlank() || rawPassword.length() < 6) {
      throw new IllegalArgumentException("invalid_admin_credentials");
    }
    jdbc.update(
      """
      update admins
      set login = ?, password_hash = ?
      where lower(login) = lower(?) and role = 'ADMIN' and active = true
      """,
      normalizedLogin,
      encoder.encode(rawPassword),
      currentLogin
    );
  }

  private record AdminCredential(String login, String passwordHash, String role) {}
}
