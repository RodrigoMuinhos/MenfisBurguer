package com.menfis.delivery.domain;

public enum OrderStatus {
  CREATED,
  PAYMENT_PENDING,
  PAID,
  ACCEPTED,
  IN_PREPARATION,
  READY,
  OUT_FOR_DELIVERY,
  DELIVERED,
  CANCELLED
}
