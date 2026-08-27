package com.menfis.delivery.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.menfis.delivery.domain.TableLightState;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class ManualTableLightGatewayTest {
  @Test
  void updatesConceptualLightStateWithoutHardwareDependency() {
    JdbcTemplate jdbc = org.mockito.Mockito.mock(JdbcTemplate.class);
    UUID kitId = UUID.randomUUID();
    when(jdbc.update(
      "update table_kits set light_state = ?, updated_at = now() where id = ?",
      "BLUE",
      kitId
    )).thenReturn(1);

    new ManualTableLightGateway(jdbc).setState(kitId, TableLightState.BLUE);

    verify(jdbc).update(
      "update table_kits set light_state = ?, updated_at = now() where id = ?",
      "BLUE",
      kitId
    );
  }

  @Test
  void rejectsUnknownKit() {
    JdbcTemplate jdbc = org.mockito.Mockito.mock(JdbcTemplate.class);
    UUID kitId = UUID.randomUUID();
    when(jdbc.update(
      "update table_kits set light_state = ?, updated_at = now() where id = ?",
      "GREEN",
      kitId
    )).thenReturn(0);

    assertThrows(
      IllegalArgumentException.class,
      () -> new ManualTableLightGateway(jdbc).setState(kitId, TableLightState.GREEN)
    );
  }
}
