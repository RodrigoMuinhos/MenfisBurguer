package com.menfis.delivery.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.menfis.delivery.service.DashboardService;
import com.menfis.delivery.web.DashboardController;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
  controllers = DashboardController.class,
  properties = "menfis.jwt-secret=test-secret-with-at-least-thirty-two-bytes"
)
@Import(SecurityConfig.class)
class SecurityAccessTest {
  private static final String SECRET = "test-secret-with-at-least-thirty-two-bytes";

  @Autowired
  private MockMvc mvc;

  @MockBean
  private DashboardService dashboardService;

  @Test
  void rejectsAnonymousDashboardAccess() throws Exception {
    mvc.perform(get("/dashboard/summary"))
      .andExpect(status().isForbidden());
  }

  @Test
  void acceptsAuthenticatedAdminDashboardAccess() throws Exception {
    mvc.perform(get("/dashboard/summary")
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("ADMIN")))
      .andExpect(status().isOk());
  }

  @Test
  void rejectsDeliveryRoleFromDashboard() throws Exception {
    mvc.perform(get("/dashboard/summary")
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("DELIVERY")))
      .andExpect(status().isForbidden());
  }

  private String token(String role) {
    return Jwts.builder()
      .subject("admin@example.com")
      .claim("role", role)
      .issuedAt(new Date())
      .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
      .compact();
  }
}
