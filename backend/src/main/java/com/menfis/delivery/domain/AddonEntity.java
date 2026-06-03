package com.menfis.delivery.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "addons")
public class AddonEntity {
  @Id
  public String id;
  public String name;
  public BigDecimal price;
  public Boolean active;
}
