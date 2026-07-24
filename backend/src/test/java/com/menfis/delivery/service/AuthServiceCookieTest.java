package com.menfis.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.menfis.delivery.web.AuthController;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

class AuthServiceCookieTest {
  private final AuthService auth = new AuthService(
    mock(JdbcTemplate.class),
    mock(PasswordEncoder.class)
  );

  @AfterEach
  void clearRequest() {
    RequestContextHolder.resetRequestAttributes();
  }

  @Test
  void requireAdminAcceptsProtectedAdminCookieWithoutAuthorizationHeader() {
    ReflectionTestUtils.setField(
      auth,
      "jwtSecret",
      "test-only-secret-with-at-least-thirty-two-bytes"
    );
    ReflectionTestUtils.setField(auth, "environment", "local");
    String token = auth.adminSession().token();

    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setCookies(new Cookie(AuthController.ADMIN_SESSION_COOKIE, token));
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

    assertThat(auth.requireAdmin(null).get("role", String.class)).isEqualTo("ADMIN");
  }
}
