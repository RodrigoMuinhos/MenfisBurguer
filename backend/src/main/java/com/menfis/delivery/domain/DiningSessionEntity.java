package com.menfis.delivery.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "dining_sessions")
public class DiningSessionEntity {
  @Id @GeneratedValue public UUID id;
  public UUID publicId;
  public UUID tableId;
  public UUID tableKitId;
  public String customerName;
  public String status;
  public OffsetDateTime openedAt;
  public OffsetDateTime closedAt;
  public UUID openedByStaffId;
  public UUID closedByStaffId;
  public OffsetDateTime createdAt;
  public OffsetDateTime updatedAt;
}
