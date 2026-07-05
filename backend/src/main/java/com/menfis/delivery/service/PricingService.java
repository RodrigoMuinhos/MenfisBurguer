package com.menfis.delivery.service;

import com.menfis.delivery.dto.ApiDtos.PricingProductRequest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PricingService {
  private final JdbcTemplate jdbc;
  private final SettingsService settings;

  public PricingService(JdbcTemplate jdbc, SettingsService settings) {
    this.jdbc = jdbc;
    this.settings = settings;
  }

  public List<Map<String, Object>> list() {
    return jdbc.queryForList(
      """
      select *,
        case when kind = 'combo' then base_cost + fries_cost + default_drink_cost else base_cost end as total_cost,
        case when kind = 'combo' then sale_price + drink_surcharge else sale_price end as price_with_alternative_drink,
        sale_price - case when kind = 'combo' then base_cost + fries_cost + default_drink_cost else base_cost end as gross_profit,
        case when sale_price > 0 then (case when kind = 'combo' then base_cost + fries_cost + default_drink_cost else base_cost end) / sale_price else 0 end as cmv,
        case when sale_price > 0 then (sale_price - case when kind = 'combo' then base_cost + fries_cost + default_drink_cost else base_cost end) / sale_price else 0 end as gross_margin,
        ceil(((case when kind = 'combo' then base_cost + fries_cost + default_drink_cost else base_cost end) / greatest(target_cmv, 0.01)) + 0.01) - 0.10 as recommended_price,
        case
          when sale_price <= 0 then 'ruim'
          when (case when kind = 'combo' then base_cost + fries_cost + default_drink_cost else base_cost end) / sale_price <= 0.35 then 'saudavel'
          when (case when kind = 'combo' then base_cost + fries_cost + default_drink_cost else base_cost end) / sale_price <= 0.40 then 'atencao'
          else 'ruim'
        end as status
      from pricing_products
      where test_mode = ?
      order by
        case kind when 'sandwich' then 1 when 'combo' then 2 when 'side' then 3 when 'drink' then 4 else 5 end,
        name asc
      """,
      settings.testModeEnabled()
    );
  }

  public Map<String, Object> upsert(PricingProductRequest request) {
    return jdbc.queryForMap(
      """
      insert into pricing_products (
        id, code, name, category, kind, base_cost, fries_cost, default_drink_cost,
        alternative_drink_cost, drink_surcharge, sale_price, target_cmv, active, notes, test_mode, updated_at
      )
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())
      on conflict (id) do update set
        code = excluded.code,
        name = excluded.name,
        category = excluded.category,
        kind = excluded.kind,
        base_cost = excluded.base_cost,
        fries_cost = excluded.fries_cost,
        default_drink_cost = excluded.default_drink_cost,
        alternative_drink_cost = excluded.alternative_drink_cost,
        drink_surcharge = excluded.drink_surcharge,
        sale_price = excluded.sale_price,
        target_cmv = excluded.target_cmv,
        active = excluded.active,
        notes = excluded.notes,
        test_mode = excluded.test_mode,
        updated_at = now()
      returning *
      """,
      request.id(),
      request.code(),
      request.name(),
      request.category(),
      request.kind(),
      nz(request.baseCost()),
      nz(request.friesCost()),
      nz(request.defaultDrinkCost()),
      nz(request.alternativeDrinkCost()),
      nz(request.drinkSurcharge()),
      nz(request.salePrice()),
      nz(request.targetCmv()).compareTo(BigDecimal.ZERO) > 0 ? request.targetCmv() : new BigDecimal("0.35"),
      request.active() == null || request.active(),
      request.notes(),
      settings.testModeEnabled()
    );
  }

  public void delete(String id) {
    jdbc.update("update pricing_products set active = false, updated_at = now() where id = ? and test_mode = ?", id, settings.testModeEnabled());
  }

  @Transactional
  public void snapshotOrderCosts(String orderId) {
    jdbc.update("delete from order_cost_snapshots where order_id = ?", orderId);
    List<Map<String, Object>> items = jdbc.queryForList(
      """
      select id, product_id, name, quantity, unit_price, total_price, metadata
      from order_items
      where order_id = ?
      order by id
      """,
      orderId
    );
    for (Map<String, Object> item : items) {
      String productId = String.valueOf(item.get("product_id"));
      BigDecimal quantity = new BigDecimal(String.valueOf(item.get("quantity")));
      BigDecimal salePrice = (BigDecimal) item.get("total_price");
      BigDecimal unitCost = productCost(productId);
      BigDecimal cost = unitCost.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
      BigDecimal profit = salePrice.subtract(cost).setScale(2, RoundingMode.HALF_UP);
      BigDecimal cmv = salePrice.compareTo(BigDecimal.ZERO) > 0
        ? cost.divide(salePrice, 4, RoundingMode.HALF_UP)
        : BigDecimal.ZERO;
      BigDecimal margin = salePrice.compareTo(BigDecimal.ZERO) > 0
        ? profit.divide(salePrice, 4, RoundingMode.HALF_UP)
        : BigDecimal.ZERO;
      jdbc.update(
        """
        insert into order_cost_snapshots (
          order_id, order_item_id, product_id, product_name, quantity, sale_price_snapshot,
          cost_snapshot, gross_profit_snapshot, cmv_snapshot, margin_snapshot, test_mode
        )
        values (?, ?::uuid, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        orderId,
        item.get("id").toString(),
        productId,
        item.get("name").toString(),
        quantity.intValue(),
        salePrice,
        cost,
        profit,
        cmv,
        margin,
        settings.testModeEnabled()
      );
    }
  }

  private BigDecimal productCost(String productId) {
    try {
      return jdbc.queryForObject(
        """
        select case when kind = 'combo' then base_cost + fries_cost + default_drink_cost else base_cost end
        from pricing_products
        where id = ? and test_mode = ?
        """,
        BigDecimal.class,
        normalizeProductId(productId),
        settings.testModeEnabled()
      );
    } catch (EmptyResultDataAccessException e) {
      return BigDecimal.ZERO;
    }
  }

  private String normalizeProductId(String productId) {
    return switch (productId) {
      case "combo-menfis" -> "combo";
      case "combo-menfis-bacon" -> "bacon-combo";
      case "combo-menfis-chicken" -> "chicken-combo";
      case "super-combo-menfis" -> "combo2";
      case "super-combo-menfis-bacon" -> "bacon-super-combo";
      case "super-combo-menfis-chicken" -> "chicken-super-combo";
      case "combo-coca-adicional" -> "coca-zero";
      case "coca-zero" -> "coca-zero";
      default -> productId;
    };
  }

  private BigDecimal nz(BigDecimal value) {
    return value == null ? BigDecimal.ZERO : value;
  }
}
