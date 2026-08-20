package com.menfis.delivery.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

@Component
public class OrderOutboxDispatcher {
  private static final Logger log = LoggerFactory.getLogger(OrderOutboxDispatcher.class);
  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;
  private final OrderEventPublisher publisher;
  private final TransactionTemplate transactions;

  public OrderOutboxDispatcher(
      JdbcTemplate jdbc, ObjectMapper mapper, OrderEventPublisher publisher, TransactionTemplate transactions) {
    this.jdbc = jdbc;
    this.mapper = mapper;
    this.publisher = publisher;
    this.transactions = transactions;
  }

  @Scheduled(fixedDelayString = "${menfis.order-outbox.delay-ms:2000}", initialDelayString = "${menfis.order-outbox.initial-delay-ms:2000}")
  public void dispatch() {
    List<UUID> ids = jdbc.queryForList(
      """
      select id from order_outbox
      where (status in ('PENDING', 'FAILED') and available_at <= now())
         or (status = 'PROCESSING' and locked_at < now() - interval '2 minutes')
      order by created_at
      limit 25
      """,
      UUID.class
    );
    ids.forEach(this::dispatchOne);
  }

  void dispatchOne(UUID id) {
    try {
      transactions.executeWithoutResult(ignored -> {
        List<String> payloads = jdbc.queryForList(
          """
          update order_outbox set status = 'PROCESSING', locked_at = now(), attempts = attempts + 1, updated_at = now()
          where id = ? and ((status in ('PENDING', 'FAILED') and available_at <= now())
            or (status = 'PROCESSING' and locked_at < now() - interval '2 minutes'))
          returning payload::text
          """,
          String.class,
          id
        );
        if (payloads.isEmpty()) return;
        try {
          OrderPaidEvent event = mapper.readValue(payloads.get(0), OrderPaidEvent.class);
          publisher.publishOrderPaid(event.orderId(), event.origin(), event.paidAt());
          jdbc.update(
            "update order_outbox set status = 'PUBLISHED', published_at = now(), locked_at = null, last_error = null, updated_at = now() where id = ?",
            id
          );
        } catch (Exception ex) {
          throw new OutboxDispatchException(ex);
        }
      });
    } catch (OutboxDispatchException ex) {
      String error = ex.getCause() == null ? ex.getMessage() : ex.getCause().getMessage();
      jdbc.update(
        """
        update order_outbox set status = 'FAILED', locked_at = null, attempts = attempts + 1,
          available_at = now() + (least(attempts + 1, 10) * interval '5 seconds'),
          last_error = left(?, 1000), updated_at = now()
        where id = ?
        """,
        error == null ? "unknown_publish_error" : error,
        id
      );
      log.warn("Order outbox publish failed id={}; retry scheduled", id, ex.getCause());
    }
  }

  private static final class OutboxDispatchException extends RuntimeException {
    private OutboxDispatchException(Throwable cause) { super(cause); }
  }
}
