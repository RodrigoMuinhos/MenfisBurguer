package com.menfis.delivery.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "dining_tables")
public class DiningTableEntity {
  @Id @GeneratedValue public UUID id;
  public String name;
  public String code;
  public String area;
  public boolean active;
  @Column(name = "position_x") public Integer positionX;
  @Column(name = "position_y") public Integer positionY;
  public OffsetDateTime createdAt;
  public OffsetDateTime updatedAt;
}
