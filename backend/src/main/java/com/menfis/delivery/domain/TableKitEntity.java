package com.menfis.delivery.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "table_kits")
public class TableKitEntity {
  @Id @GeneratedValue public UUID id;
  public String name;
  public String code;
  public String qrToken;
  public String status;
  public String lightState;
  public boolean active;
  public String deviceId;
  public OffsetDateTime createdAt;
  public OffsetDateTime updatedAt;
}
