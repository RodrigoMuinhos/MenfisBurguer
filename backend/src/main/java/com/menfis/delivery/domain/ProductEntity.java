package com.menfis.delivery.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class ProductEntity {
  @Id
  public String id;
  public String name;
  public String description;
  public BigDecimal basePrice;
  public Boolean active;
  public String imageUrl;
}
