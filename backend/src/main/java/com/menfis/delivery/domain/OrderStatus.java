package com.menfis.delivery.domain;

public enum OrderStatus {
  DRAFT,
  PENDING_PAYMENT,
  PAID,
  RECEIVED,
  PREPARING,
  READY,
  OUT_FOR_DELIVERY,
  DELIVERED,
  CANCELED,
  PAYMENT_FAILED
}
