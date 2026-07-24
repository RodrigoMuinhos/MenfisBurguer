package com.menfis.delivery.web;

import com.menfis.delivery.dto.ApiDtos.LoginRequest;
import com.menfis.delivery.dto.ApiDtos.LoginResponse;
import com.menfis.delivery.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.Duration;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
  public static final String ADMIN_SESSION_COOKIE = "menfis_admin_session";
  private static final Duration ADMIN_SESSION_DURATION = Duration.ofHours(12);

  private final AuthService auth;

  public AuthController(AuthService auth) {
    this.auth = auth;
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(
      @Valid @RequestBody LoginRequest request,
      HttpServletResponse response) {
    LoginResponse session = auth.login(request.login(), request.password());
    if ("ADMIN".equals(session.role())) {
      setAdminCookie(response, session.token());
      return ResponseEntity.ok(Map.of("role", session.role()));
    }
    return ResponseEntity.ok(session);
  }

  @PostMapping("/kds")
  public Map<String, String> kds(HttpServletResponse response) {
    LoginResponse session = auth.kdsSession();
    setAdminCookie(response, session.token());
    return Map.of("role", session.role());
  }

  @PostMapping("/admin")
  public Map<String, String> admin(HttpServletResponse response) {
    LoginResponse session = auth.adminSession();
    setAdminCookie(response, session.token());
    return Map.of("role", session.role());
  }

  @PostMapping("/delivery")
  public LoginResponse delivery() {
    return auth.deliverySession();
  }

  @GetMapping("/admin/session")
  public Map<String, String> adminSession(HttpServletRequest request) {
    var claims = auth.requireAdmin(request.getHeader(HttpHeaders.AUTHORIZATION));
    return Map.of("role", "ADMIN", "user", claims.getSubject());
  }

  @PostMapping("/admin/logout")
  public ResponseEntity<Void> adminLogout(HttpServletResponse response) {
    response.addHeader(HttpHeaders.SET_COOKIE, adminCookie("", Duration.ZERO).toString());
    return ResponseEntity.noContent().build();
  }

  private void setAdminCookie(HttpServletResponse response, String token) {
    response.addHeader(HttpHeaders.SET_COOKIE, adminCookie(token, ADMIN_SESSION_DURATION).toString());
  }

  private ResponseCookie adminCookie(String value, Duration maxAge) {
    return ResponseCookie.from(ADMIN_SESSION_COOKIE, value)
      .httpOnly(true)
      .secure(true)
      .sameSite("Strict")
      .path("/")
      .maxAge(maxAge)
      .build();
  }
}
