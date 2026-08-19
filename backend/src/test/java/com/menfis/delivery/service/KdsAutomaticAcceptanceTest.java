package com.menfis.delivery.service;

import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.menfis.delivery.domain.OrderStatus;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class KdsAutomaticAcceptanceTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final OrderService orders = mock(OrderService.class);
  private final InventoryService inventory = mock(InventoryService.class);
  private final SettingsService settings = mock(SettingsService.class);
  private final KdsService service = new KdsService(jdbc, orders, inventory, settings);

  @Test
  void acceptsPaidOrderWithoutFiveMinuteHoldWhenEnabled() {
    when(settings.automaticOrderAcceptanceEnabled()).thenReturn(true);
    when(settings.testModeEnabled()).thenReturn(false);
    when(jdbc.queryForList(contains("paid_at <= now()"), org.mockito.ArgumentMatchers.eq(String.class),
      org.mockito.ArgumentMatchers.eq("0 seconds"), org.mockito.ArgumentMatchers.eq(false)))
      .thenReturn(List.of("#1400"));

    service.moveDueOrdersToPreparation();

    verify(inventory).deductForOrder("#1400");
    verify(orders).changeStatus(
      "#1400",
      OrderStatus.IN_PREPARATION,
      "system",
      "automatic_order_acceptance_enabled"
    );
  }

  @Test
  void keepsFiveMinuteHoldWhenDisabled() {
    when(settings.automaticOrderAcceptanceEnabled()).thenReturn(false);
    when(settings.testModeEnabled()).thenReturn(false);
    when(jdbc.queryForList(contains("paid_at <= now()"), org.mockito.ArgumentMatchers.eq(String.class),
      org.mockito.ArgumentMatchers.eq("5 minutes"), org.mockito.ArgumentMatchers.eq(false)))
      .thenReturn(List.of());

    service.moveDueOrdersToPreparation();

    verify(jdbc).queryForList(contains("paid_at <= now()"), org.mockito.ArgumentMatchers.eq(String.class),
      org.mockito.ArgumentMatchers.eq("5 minutes"), org.mockito.ArgumentMatchers.eq(false));
  }
}
