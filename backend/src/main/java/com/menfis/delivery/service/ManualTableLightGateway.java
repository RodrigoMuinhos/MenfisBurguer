package com.menfis.delivery.service;

import com.menfis.delivery.domain.TableLightState;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ManualTableLightGateway implements TableLightGateway {
  private final JdbcTemplate jdbc;

  public ManualTableLightGateway(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public void setState(UUID kitId, TableLightState state) {
    int updated = jdbc.update(
      "update table_kits set light_state = ?, updated_at = now() where id = ?",
      state.name(),
      kitId
    );
    if (updated != 1) throw new IllegalArgumentException("table_kit_not_found");
  }
}
