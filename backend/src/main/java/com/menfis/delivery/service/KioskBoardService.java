package com.menfis.delivery.service;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class KioskBoardService {
  private final JdbcTemplate jdbc;
  private final SettingsService settings;

  public KioskBoardService(JdbcTemplate jdbc, SettingsService settings) {
    this.jdbc = jdbc;
    this.settings = settings;
  }

  public record BoardOrder(
      String id,
      long number,
      String customerName,
      String status,
      OffsetDateTime createdAt) {}

  public List<BoardOrder> listToday() {
    return jdbc.query(
      """
      select id, number, customer_name, status, created_at
      from orders
      where channel = 'KIOSK'
        and status in (
          'CREATED', 'PAYMENT_PENDING', 'PAYMENT_PROOF_PENDING',
          'PAYMENT_APPROVED', 'PAID', 'ACCEPTED', 'IN_PREPARATION', 'READY'
        )
        and created_at >= current_date
        and test_mode = ?
      order by created_at asc, number asc
      """,
      (rs, rowNum) -> new BoardOrder(
        rs.getString("id"),
        rs.getLong("number"),
        rs.getString("customer_name"),
        rs.getString("status"),
        rs.getObject("created_at", OffsetDateTime.class)
      ),
      settings.testModeEnabled()
    );
  }
}
