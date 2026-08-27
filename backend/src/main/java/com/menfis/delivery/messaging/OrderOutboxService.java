package com.menfis.delivery.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class OrderOutboxService {
  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;

  public OrderOutboxService(JdbcTemplate jdbc, ObjectMapper mapper) {
    this.jdbc = jdbc;
    this.mapper = mapper;
  }

  public void enqueueOrderPaid(String orderId, String origin, OffsetDateTime paidAt) {
    OrderPaidEvent event = new OrderPaidEvent("ORDER_PAID", orderId, origin, paidAt);
    jdbc.update(
      """
      insert into order_outbox(event_type, aggregate_id, payload)
      values ('ORDER_PAID', ?, ?::jsonb)
      on conflict (event_type, aggregate_id) do nothing
      """,
      orderId,
      json(event)
    );
  }

  private String json(OrderPaidEvent event) {
    try {
      return mapper.writeValueAsString(event);
    } catch (JsonProcessingException ex) {
      throw new IllegalArgumentException("invalid_order_outbox_payload", ex);
    }
  }
}
