package com.menfis.delivery.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "orders")
public class OrderEntity {
  @Id
  public String id;
  public Long number;
  public String deliveryType;
  public String customerPhone;
  public String customerAddress;
  public BigDecimal subtotal;
  public BigDecimal deliveryFee;
  public BigDecimal total;
  public String paymentProvider;
  public String paymentMethod;
  public String paymentStatus;
  public String paymentId;
  public String status;
  public String idempotencyKey;
  public OffsetDateTime paidAt;
  public OffsetDateTime confirmedAt;
}
