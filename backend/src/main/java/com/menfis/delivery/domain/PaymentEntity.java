package com.menfis.delivery.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class PaymentEntity {
  @Id
  public UUID id;
  public String orderId;
  public String provider;
  public String providerPaymentId;
  public String providerPreferenceId;
  public String method;
  public String status;
  public BigDecimal amount;
  public String checkoutUrl;
  public String qrCode;
  public OffsetDateTime createdAt;
}
