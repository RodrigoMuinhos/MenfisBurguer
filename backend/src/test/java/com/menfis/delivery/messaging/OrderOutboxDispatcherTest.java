package com.menfis.delivery.messaging;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

class OrderOutboxDispatcherTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final OrderEventPublisher publisher = mock(OrderEventPublisher.class);
  private final TransactionTemplate transactions = mock(TransactionTemplate.class);
  private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
  private final OrderOutboxDispatcher dispatcher = new OrderOutboxDispatcher(jdbc, mapper, publisher, transactions);

  @BeforeEach
  void executeTransactionCallback() {
    doAnswer(invocation -> {
      @SuppressWarnings("unchecked")
      Consumer<TransactionStatus> callback = invocation.getArgument(0);
      callback.accept(mock(TransactionStatus.class));
      return null;
    }).when(transactions).executeWithoutResult(any());
  }

  @Test
  void marksPublishedOnlyAfterRabbitAcceptsEvent() throws Exception {
    UUID id = UUID.randomUUID();
    OrderPaidEvent event = new OrderPaidEvent("ORDER_PAID", "#1700", "DINING_QR", OffsetDateTime.now());
    when(jdbc.queryForList(anyString(), eq(String.class), eq(id))).thenReturn(List.of(mapper.writeValueAsString(event)));

    dispatcher.dispatchOne(id);

    verify(publisher).publishOrderPaid(eq(event.orderId()), eq(event.origin()), any(OffsetDateTime.class));
    verify(jdbc).update(contains("status = 'PUBLISHED'"), eq(id));
    verify(jdbc, never()).update(contains("status = 'FAILED'"), any(), eq(id));
  }

  @Test
  void schedulesRetryWhenRabbitPublishFails() throws Exception {
    UUID id = UUID.randomUUID();
    OrderPaidEvent event = new OrderPaidEvent("ORDER_PAID", "#1701", "DINING_QR", OffsetDateTime.now());
    when(jdbc.queryForList(anyString(), eq(String.class), eq(id))).thenReturn(List.of(mapper.writeValueAsString(event)));
    org.mockito.Mockito.doThrow(new IllegalStateException("rabbit_offline"))
      .when(publisher).publishOrderPaid(eq(event.orderId()), eq(event.origin()), any(OffsetDateTime.class));

    dispatcher.dispatchOne(id);

    verify(jdbc).update(contains("status = 'FAILED'"), eq("rabbit_offline"), eq(id));
    verify(jdbc, never()).update(contains("status = 'PUBLISHED'"), eq(id));
  }
}
