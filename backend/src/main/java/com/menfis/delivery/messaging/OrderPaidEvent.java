package com.menfis.delivery.messaging;

import java.time.OffsetDateTime;

public record OrderPaidEvent(
  String eventType,
  String orderId,
  String origin,
  OffsetDateTime paidAt
) {}
