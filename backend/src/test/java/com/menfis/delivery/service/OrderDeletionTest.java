package com.menfis.delivery.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.menfis.delivery.messaging.OrderEventPublisher;
import com.menfis.delivery.messaging.OrderLifecycleEventPublisher;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.jdbc.core.JdbcTemplate;

class OrderDeletionTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final AuditService audit = mock(AuditService.class);
  private final OrderService service = new OrderService(
    jdbc,
    new ObjectMapper(),
    audit,
    mock(OrderEventService.class),
    mock(SettingsService.class),
    mock(CustomerService.class),
    mock(OrderEventPublisher.class),
    mock(OrderLifecycleEventPublisher.class),
    mock(PricingService.class)
  );

  @Test
  void permanentlyDeletesDeliveredOrderAndItsBlockingReferences() {
    when(jdbc.queryForObject("select status from orders where id = ?", String.class, "order-1"))
      .thenReturn("DELIVERED");
    when(jdbc.update("delete from orders where id = ?", "order-1")).thenReturn(1);

    service.deleteCancelled("order-1");

    InOrder deletion = inOrder(jdbc);
    deletion.verify(jdbc).update("delete from stock_movements where order_id = ?", "order-1");
    deletion.verify(jdbc).update("delete from order_event_log where order_id = ?", "order-1");
    deletion.verify(jdbc).update("delete from orders where id = ?", "order-1");
    verify(audit).log("admin", "ORDER_DELETED", "ORDER", "order-1", Map.of("status", "DELIVERED"));
  }

  @Test
  void refusesDeletionOfActiveOrder() {
    when(jdbc.queryForObject("select status from orders where id = ?", String.class, "order-2"))
      .thenReturn("IN_PREPARATION");

    assertThrows(IllegalArgumentException.class, () -> service.deleteCancelled("order-2"));

    verify(jdbc, never()).update("delete from orders where id = ?", "order-2");
  }
}
