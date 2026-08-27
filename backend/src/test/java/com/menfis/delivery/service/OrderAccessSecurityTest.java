package com.menfis.delivery.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

class OrderAccessSecurityTest {
  private JdbcTemplate jdbc;
  private AuthService auth;
  private OrderService orders;

  @BeforeEach
  void setUp() {
    jdbc = mock(JdbcTemplate.class);
    auth = mock(AuthService.class);
    orders = new OrderService(
      jdbc,
      new ObjectMapper(),
      mock(AuditService.class),
      mock(OrderEventService.class),
      mock(SettingsService.class),
      mock(CustomerService.class),
      mock(com.menfis.delivery.messaging.OrderEventPublisher.class),
      mock(com.menfis.delivery.messaging.OrderLifecycleEventPublisher.class),
      mock(PricingService.class)
    );
  }

  @Test
  void sequentialIdWithoutProofLooksNotFound() {
    when(jdbc.queryForMap(anyString(), eq("#1001")))
      .thenReturn(Map.of("customer_id", 42L, "tracking_token_hash", sha256("valid-token")));
    when(auth.optionalOrderIdentity(null)).thenReturn(null);

    ResponseStatusException error = assertThrows(
      ResponseStatusException.class,
      () -> orders.requireOrderAccess("#1001", null, null, auth)
    );

    assertEquals(404, error.getStatusCode().value());
  }

  @Test
  void opaqueTrackingTokenGrantsOnlyPossessionBasedAccess() {
    when(jdbc.queryForMap(anyString(), eq("#1001")))
      .thenReturn(Map.of("customer_id", 42L, "tracking_token_hash", sha256("valid-token")));
    when(auth.optionalOrderIdentity(null)).thenReturn(null);

    assertDoesNotThrow(() -> orders.requireOrderAccess("#1001", null, "valid-token", auth));
    assertThrows(
      ResponseStatusException.class,
      () -> orders.requireOrderAccess("#1001", null, "wrong-token", auth)
    );
  }

  @Test
  void customerCanOnlyReadOwnedOrder() {
    when(jdbc.queryForMap(anyString(), eq("#1001")))
      .thenReturn(Map.of("customer_id", 42L, "tracking_token_hash", sha256("valid-token")));
    when(auth.optionalOrderIdentity("owner"))
      .thenReturn(new AuthService.OrderIdentity("CUSTOMER", 42L));
    when(auth.optionalOrderIdentity("other"))
      .thenReturn(new AuthService.OrderIdentity("CUSTOMER", 99L));

    assertDoesNotThrow(() -> orders.requireOrderAccess("#1001", "owner", null, auth));
    assertThrows(
      ResponseStatusException.class,
      () -> orders.requireOrderAccess("#1001", "other", null, auth)
    );
  }

  @Test
  void operationalRolesCanReadWithoutPublicToken() {
    when(jdbc.queryForMap(anyString(), eq("#1001")))
      .thenReturn(Map.of("customer_id", 42L, "tracking_token_hash", sha256("valid-token")));
    when(auth.optionalOrderIdentity("admin"))
      .thenReturn(new AuthService.OrderIdentity("ADMIN", null));

    assertDoesNotThrow(() -> orders.requireOrderAccess("#1001", "admin", null, auth));
  }

  private static String sha256(String value) {
    try {
      return HexFormat.of().formatHex(
        MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))
      );
    } catch (Exception ex) {
      throw new IllegalStateException(ex);
    }
  }
}
