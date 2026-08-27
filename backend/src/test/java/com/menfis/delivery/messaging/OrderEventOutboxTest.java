package com.menfis.delivery.messaging;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

class OrderEventOutboxTest {
  private JdbcTemplate jdbc;
  private RabbitTemplate rabbit;
  private OrderEventPublisher publisher;

  @BeforeEach
  void setUp() {
    jdbc = org.mockito.Mockito.mock(JdbcTemplate.class);
    rabbit = org.mockito.Mockito.mock(RabbitTemplate.class);
    publisher = new OrderEventPublisher(rabbit, new ObjectMapper(), jdbc);
  }

  @Test
  void storesOrderPaidInOutboxBeforeAnyRabbitPublication() {
    publisher.enqueueOrderPaid("order-1", "PIX", OffsetDateTime.parse("2026-08-18T10:00:00-03:00"));

    verify(jdbc).update(contains("insert into order_event_outbox"), any(), any(), any(), any());
    verify(rabbit, never()).invoke(any());
  }

  @Test
  void marksClaimedDesktopEventAsPublishedWithoutRabbit() {
    when(jdbc.queryForList(anyString())).thenReturn(List.of(pendingRow()));
    when(jdbc.queryForObject(anyString(), eq(Boolean.class), any())).thenReturn(true);
    ReflectionTestUtils.setField(publisher, "rabbitEnabled", false);

    publisher.dispatchPending();

    verify(jdbc).update(contains("status = 'PUBLISHED'"), (Object[]) any());
    verify(rabbit, never()).invoke(any());
  }

  @Test
  void failedRabbitPublicationReturnsEventToRetryableState() {
    when(jdbc.queryForList(anyString())).thenReturn(List.of(pendingRow()));
    when(jdbc.queryForObject(anyString(), eq(Boolean.class), any())).thenReturn(true);
    when(rabbit.invoke(any())).thenThrow(new AmqpException("broker_unavailable"));
    ReflectionTestUtils.setField(publisher, "rabbitEnabled", true);

    publisher.dispatchPending();

    verify(jdbc).update(anyString(), eq("broker_unavailable"), eq("00000000-0000-0000-0000-000000000001"));
  }

  private Map<String, Object> pendingRow() {
    return Map.of(
      "id", "00000000-0000-0000-0000-000000000001",
      "aggregate_id", "order-1",
      "origin", "PIX",
      "occurred_at", Timestamp.from(Instant.parse("2026-08-18T13:00:00Z"))
    );
  }
}
