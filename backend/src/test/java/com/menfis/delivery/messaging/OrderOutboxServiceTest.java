package com.menfis.delivery.messaging;

import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class OrderOutboxServiceTest {
  @Test
  void enqueuesDiningPaymentIdempotently() {
    JdbcTemplate jdbc = mock(JdbcTemplate.class);
    OrderOutboxService outbox = new OrderOutboxService(
      jdbc,
      new ObjectMapper().registerModule(new JavaTimeModule())
    );
    OffsetDateTime paidAt = OffsetDateTime.now();

    outbox.enqueueOrderPaid("#1702", "DINING_QR", paidAt);

    verify(jdbc).update(
      contains("on conflict (event_type, aggregate_id) do nothing"),
      eq("#1702"),
      contains("\"origin\":\"DINING_QR\"")
    );
  }
}
