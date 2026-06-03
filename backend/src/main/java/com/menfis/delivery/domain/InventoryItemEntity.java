package com.menfis.delivery.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "inventory_items")
public class InventoryItemEntity {
  @Id
  public String id;
  public String name;
  public String unit;
  public BigDecimal quantity;
  public BigDecimal minQuantity;
  public LocalDate expiresAt;
  public Boolean active;
}
