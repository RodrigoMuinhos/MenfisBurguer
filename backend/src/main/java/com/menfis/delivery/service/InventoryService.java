package com.menfis.delivery.service;

import com.menfis.delivery.dto.ApiDtos.InventoryItemRequest;
import com.menfis.delivery.dto.ApiDtos.StockMovementRequest;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {
  private final JdbcTemplate jdbc;
  private final AuditService audit;
  private final SettingsService settings;

  public InventoryService(JdbcTemplate jdbc, AuditService audit, SettingsService settings) {
    this.jdbc = jdbc;
    this.audit = audit;
    this.settings = settings;
  }

  public List<Map<String, Object>> list() {
    boolean testMode = settings.testModeEnabled();
    return jdbc.queryForList(
      """
      select id, name, unit, active, updated_at,
        case when ? then test_quantity else quantity end as quantity,
        case when ? then test_min_quantity else min_quantity end as min_quantity,
        case when ? then test_unit_cost else unit_cost end as unit_cost,
        case when ? then test_entry_date else entry_date end as entry_date,
        case when ? then test_expires_at else expires_at end as expires_at,
        case when ? then test_quantity <= test_min_quantity else quantity <= min_quantity end as critical,
        case when ? then test_expires_at is not null and test_expires_at <= current_date + interval '7 days'
          else expires_at is not null and expires_at <= current_date + interval '7 days'
        end as expiring_soon
      from inventory_items
      where active = true
      order by critical desc, expiring_soon desc, name asc
      """,
      testMode,
      testMode,
      testMode,
      testMode,
      testMode,
      testMode,
      testMode
    );
  }

  public Map<String, Object> upsert(InventoryItemRequest request) {
    boolean testMode = settings.testModeEnabled();
    if (testMode) {
      return jdbc.queryForMap(
        """
        insert into inventory_items(id, name, unit, test_quantity, test_min_quantity, test_unit_cost, test_entry_date, test_expires_at, active, updated_at)
        values (?, ?, ?, ?, ?, ?, ?, ?, true, now())
        on conflict (id) do update set
          name = excluded.name,
          unit = excluded.unit,
          test_quantity = excluded.test_quantity,
          test_min_quantity = excluded.test_min_quantity,
          test_unit_cost = excluded.test_unit_cost,
          test_entry_date = excluded.test_entry_date,
          test_expires_at = excluded.test_expires_at,
          active = true,
          updated_at = now()
        returning id, name, unit, test_quantity as quantity, test_min_quantity as min_quantity,
          test_unit_cost as unit_cost, test_entry_date as entry_date, test_expires_at as expires_at, active, updated_at
        """,
        request.id(),
        request.name(),
        request.unit(),
        request.quantity(),
        request.minQuantity(),
        request.unitCost() == null ? BigDecimal.ZERO : request.unitCost(),
        request.entryDate(),
        request.expiryDate()
      );
    }
    return jdbc.queryForMap(
      """
      insert into inventory_items(id, name, unit, quantity, min_quantity, unit_cost, entry_date, expires_at, active, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, true, now())
      on conflict (id) do update set
        name = excluded.name,
        unit = excluded.unit,
        quantity = excluded.quantity,
        min_quantity = excluded.min_quantity,
        unit_cost = excluded.unit_cost,
        entry_date = excluded.entry_date,
        expires_at = excluded.expires_at,
        active = true,
        updated_at = now()
      returning *
      """,
      request.id(),
      request.name(),
      request.unit(),
      request.quantity(),
      request.minQuantity(),
      request.unitCost() == null ? BigDecimal.ZERO : request.unitCost(),
      request.entryDate(),
      request.expiryDate()
    );
  }

  public List<Map<String, Object>> movements() {
    return jdbc.queryForList(
      """
      select sm.*, ii.name as item_name
      from stock_movements sm
      join inventory_items ii on ii.id = sm.inventory_item_id
      where sm.test_mode = ?
      order by sm.created_at desc
      limit 300
      """,
      settings.testModeEnabled()
    );
  }

  @Transactional
  public Map<String, Object> movement(String itemId, StockMovementRequest request) {
    boolean testMode = settings.testModeEnabled();
    String quantityColumn = testMode ? "test_quantity" : "quantity";
    BigDecimal before = jdbc.queryForObject("select " + quantityColumn + " from inventory_items where id = ? for update", BigDecimal.class, itemId);
    BigDecimal delta = "entrada".equalsIgnoreCase(request.type()) ? request.quantity() : request.quantity().negate();
    BigDecimal after = before.add(delta);
    jdbc.update("update inventory_items set " + quantityColumn + " = ?, updated_at = now() where id = ?", after, itemId);
    jdbc.update(
      """
      insert into stock_movements(inventory_item_id, type, quantity, quantity_before, quantity_after, note, test_mode)
      values (?, ?, ?, ?, ?, ?, ?)
      """,
      itemId,
      request.type().toUpperCase(),
      delta,
      before,
      after,
      request.note(),
      testMode
    );
    audit.log("admin", "STOCK_MOVEMENT_CREATED", "INVENTORY_ITEM", itemId, Map.of("delta", delta, "after", after));
    return jdbc.queryForMap(
      "select id, name, unit, " + quantityColumn + " as quantity, " +
        (testMode ? "test_min_quantity" : "min_quantity") + " as min_quantity, " +
        (testMode ? "test_unit_cost" : "unit_cost") + " as unit_cost, " +
        (testMode ? "test_entry_date" : "entry_date") + " as entry_date, " +
        (testMode ? "test_expires_at" : "expires_at") + " as expires_at, active, updated_at from inventory_items where id = ?",
      itemId
    );
  }

  public void delete(String itemId) {
    boolean testMode = settings.testModeEnabled();
    String quantityColumn = testMode ? "test_quantity" : "quantity";
    Map<String, Object> before = jdbc.queryForMap("select * from inventory_items where id = ?", itemId);
    if (testMode) {
      jdbc.update(
        """
        update inventory_items set test_quantity = 0, test_min_quantity = 0, test_unit_cost = 0,
          test_entry_date = null, test_expires_at = null, updated_at = now()
        where id = ?
        """,
        itemId
      );
    } else {
      jdbc.update("update inventory_items set active = false, updated_at = now() where id = ?", itemId);
    }
    jdbc.update(
      """
      insert into stock_movements(inventory_item_id, type, quantity, quantity_before, quantity_after, note, test_mode)
      values (?, 'EXCLUSAO', ?, ?, 0, ?, ?)
      """,
      itemId,
      ((BigDecimal) before.get(quantityColumn)).negate(),
      before.get(quantityColumn),
      testMode ? "Item zerado no modo teste" : "Item desativado no ADM",
      testMode
    );
    audit.log("admin", "INVENTORY_ITEM_DELETED", "INVENTORY_ITEM", itemId, Map.of());
  }

  @Transactional
  public void deductForOrder(String orderId) {
    List<Map<String, Object>> deductions = jdbc.queryForList(
      """
      select inventory_item_id, sum(quantity) as quantity
      from (
        select pi.inventory_item_id, pi.quantity * oi.quantity as quantity
        from order_items oi
        join product_ingredients pi on pi.product_id = oi.product_id
        where oi.order_id = ?

        union all

        select pi.inventory_item_id, pi.quantity * oi.quantity as quantity
        from order_items oi
        cross join lateral jsonb_array_elements_text(coalesce(oi.metadata->'addonIds', '[]'::jsonb)) addon(addon_id)
        join product_ingredients pi on pi.product_id = addon.addon_id
        where oi.order_id = ?
      ) deductions
      group by inventory_item_id
      """,
      orderId,
      orderId
    );

    for (Map<String, Object> row : deductions) {
      String itemId = (String) row.get("inventory_item_id");
      BigDecimal qty = (BigDecimal) row.get("quantity");
      boolean testMode = settings.testModeEnabled();
      String quantityColumn = testMode ? "test_quantity" : "quantity";
      BigDecimal before = jdbc.queryForObject("select " + quantityColumn + " from inventory_items where id = ? for update", BigDecimal.class, itemId);
      BigDecimal after = before.subtract(qty).max(BigDecimal.ZERO);
      jdbc.update("update inventory_items set " + quantityColumn + " = ?, updated_at = now() where id = ?", after, itemId);
      jdbc.update(
        """
        insert into stock_movements(inventory_item_id, order_id, type, quantity, quantity_before, quantity_after, note, test_mode)
        values (?, ?, 'SAIDA', ?, ?, ?, ?, ?)
        """,
        itemId,
        orderId,
        qty.negate(),
        before,
        after,
        "Baixa automática por pedido em produção",
        testMode
      );
    }
    audit.log("system", "ORDER_STOCK_DEDUCTED", "ORDER", orderId, Map.of("items", deductions.size()));
  }
}
