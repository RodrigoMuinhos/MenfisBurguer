package com.menfis.delivery.messaging;

import java.time.OffsetDateTime;
import java.util.Map;

public record OrderLifecycleEvent(
  String eventId,
  String eventType,
  String orderId,
  String fromStatus,
  String toStatus,
  String origin,
  String actor,
  String reason,
  OffsetDateTime occurredAt,
  Map<String, Object> payload
) {}
