package com.menfis.delivery.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;

import com.menfis.delivery.dto.DiningDtos.DiningDashboardResponse;
import com.menfis.delivery.service.AuthService;
import com.menfis.delivery.service.DiningService;
import com.menfis.delivery.service.DiningOrderService;
import com.menfis.delivery.web.StaffDiningController;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
  controllers = StaffDiningController.class,
  properties = "menfis.jwt-secret=test-secret-with-at-least-thirty-two-bytes"
)
@Import(SecurityConfig.class)
class DiningSecurityAccessTest {
  private static final String SECRET = "test-secret-with-at-least-thirty-two-bytes";

  @Autowired private MockMvc mvc;
  @MockBean private DiningService dining;
  @MockBean private AuthService auth;
  @MockBean private DiningOrderService diningOrders;

  @Test
  void staffDashboardRequiresAuthentication() throws Exception {
    mvc.perform(get("/api/staff/dining/dashboard"))
      .andExpect(status().isForbidden());
  }

  @Test
  void staffRoleCanAccessDashboard() throws Exception {
    when(dining.dashboard()).thenReturn(new DiningDashboardResponse(List.of(), List.of(), List.of()));
    mvc.perform(get("/api/staff/dining/dashboard")
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("STAFF")))
      .andExpect(status().isOk());
  }

  @Test
  void deliveryRoleCannotAccessStaffDashboard() throws Exception {
    mvc.perform(get("/api/staff/dining/dashboard")
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("DELIVERY")))
      .andExpect(status().isForbidden());
  }

  private String token(String role) {
    return Jwts.builder()
      .subject("staff@menfis.local")
      .claim("role", role)
      .issuedAt(new Date())
      .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
      .compact();
  }
}
