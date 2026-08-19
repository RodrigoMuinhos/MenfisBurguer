package com.menfis.delivery.messaging;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.menfis.delivery.dto.ApiDtos.OrderResponse;
import com.menfis.delivery.service.AuditService;
import com.menfis.delivery.service.OrderEventService;
import com.menfis.delivery.service.OrderService;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

class KitchenOrderProcessorHoldTest {
  @Test
  void paidEventKeepsOrderReceivedInsteadOfSendingItStraightToPreparation() {
    JdbcTemplate jdbc = mock(JdbcTemplate.class);
    OrderService orders = mock(OrderService.class);
    OrderEventService events = mock(OrderEventService.class);
    AuditService audit = mock(AuditService.class);
    OrderLifecycleEventPublisher lifecycle = mock(OrderLifecycleEventPublisher.class);
    List<String> updates = new ArrayList<>();

    when(jdbc.queryForObject(anyString(), eq(Boolean.class), any(), any()))
      .thenThrow(new EmptyResultDataAccessException(1));
    when(jdbc.queryForMap(anyString(), any())).thenReturn(Map.of(
      "id", "#1500",
      "status", "PAYMENT_APPROVED",
      "channel", "KIOSK",
      "paid_at", OffsetDateTime.parse("2026-08-19T12:00:00-03:00")
    ));
    doAnswer(invocation -> {
      updates.add(invocation.getArgument(0));
      return 1;
    }).when(jdbc).update(anyString(), any(Object[].class));
    when(orders.get("#1500")).thenReturn(mock(OrderResponse.class));

    KitchenOrderProcessor processor = new KitchenOrderProcessor(
      jdbc, new ObjectMapper().findAndRegisterModules(), orders, events, audit, lifecycle
    );
    processor.process(new OrderPaidEvent(
      "ORDER_PAID",
      "#1500",
      "MOCK",
      OffsetDateTime.parse("2026-08-19T12:00:00-03:00")
    ));

    assertFalse(updates.stream().anyMatch(sql -> sql.contains("status = 'IN_PREPARATION'")));
    assertFalse(updates.stream().anyMatch(sql -> sql.contains("to_status") && sql.contains("IN_PREPARATION")));
  }
}
