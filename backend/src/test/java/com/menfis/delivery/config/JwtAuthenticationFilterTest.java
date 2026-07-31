package com.menfis.delivery.config;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

class JwtAuthenticationFilterTest {
  private static final String SECRET = "test-secret-with-at-least-thirty-two-bytes";

  @AfterEach
  void clearSecurityContext() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void authenticatesValidBearerTokenWithRole() throws Exception {
    JwtAuthenticationFilter filter = new JwtAuthenticationFilter(SECRET);
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token("admin@example.com", "ADMIN"));

    filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> {
      var authentication = SecurityContextHolder.getContext().getAuthentication();
      assertThat(authentication).isNotNull();
      assertThat(authentication.getName()).isEqualTo("admin@example.com");
      assertThat(authentication.getAuthorities())
        .extracting("authority")
        .containsExactly("ROLE_ADMIN");
    });
  }

  @Test
  void ignoresInvalidBearerToken() throws Exception {
    JwtAuthenticationFilter filter = new JwtAuthenticationFilter(SECRET);
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer invalid-token");

    filter.doFilter(request, new MockHttpServletResponse(), (req, res) ->
      assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull()
    );
  }

  private String token(String subject, String role) {
    return Jwts.builder()
      .subject(subject)
      .claim("role", role)
      .issuedAt(new Date())
      .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
      .compact();
  }
}
