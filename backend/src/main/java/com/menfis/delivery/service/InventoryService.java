package com.menfis.delivery.service;

import com.menfis.delivery.dto.ApiDtos.InventoryItemRequest;
import com.menfis.delivery.dto.ApiDtos.StockMovementRequest;
import java.math.BigDecimal;
import java.time.LocalDate;
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
      select id, name, unit, category, active, updated_at,
        case when ? then test_quantity else quantity end as quantity,
        case when ? then test_min_quantity else min_quantity end as min_quantity,
        case when ? then test_unit_cost else unit_cost end as unit_cost,
        case when ? then test_monthly_base_stock else monthly_base_stock end as monthly_base_stock,
        case
          when (case when ? then test_monthly_base_stock else monthly_base_stock end) > 0
            then round(((case when ? then test_quantity else quantity end) / (case when ? then test_monthly_base_stock else monthly_base_stock end)) * 100, 2)
          when (case when ? then test_min_quantity else min_quantity end) > 0
            then round(((case when ? then test_quantity else quantity end) / (case when ? then test_min_quantity else min_quantity end)) * 100, 2)
          else 100
        end as percent_remaining,
        case
          when (case when ? then test_quantity else quantity end) <= 0 then 'ALERTA_MAXIMO'
          when (case when ? then test_monthly_base_stock else monthly_base_stock end) > 0
            and ((case when ? then test_quantity else quantity end) / (case when ? then test_monthly_base_stock else monthly_base_stock end)) < 0.10 then 'ALERTA_MAXIMO'
          when (case when ? then test_monthly_base_stock else monthly_base_stock end) > 0
            and ((case when ? then test_quantity else quantity end) / (case when ? then test_monthly_base_stock else monthly_base_stock end)) <= 0.25 then 'ATENCAO'
          when (case when ? then test_quantity else quantity end) <= (case when ? then test_min_quantity else min_quantity end) then 'CRITICO'
          else 'NORMAL'
        end as smart_status,
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
      testMode,
      testMode,
      testMode,
      testMode,
      testMode,
      testMode,
      testMode,
      testMode,
      testMode,
      testMode,
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
        insert into inventory_items(id, name, unit, category, test_quantity, test_min_quantity, test_unit_cost, test_monthly_base_stock, test_entry_date, test_expires_at, active, updated_at)
        values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, now())
        on conflict (id) do update set
          name = excluded.name,
          unit = excluded.unit,
          category = excluded.category,
          test_quantity = excluded.test_quantity,
          test_min_quantity = excluded.test_min_quantity,
          test_unit_cost = excluded.test_unit_cost,
          test_monthly_base_stock = excluded.test_monthly_base_stock,
          test_entry_date = excluded.test_entry_date,
          test_expires_at = excluded.test_expires_at,
          active = true,
          updated_at = now()
        returning id, name, unit, category, test_quantity as quantity, test_min_quantity as min_quantity,
          test_unit_cost as unit_cost, test_monthly_base_stock as monthly_base_stock, test_entry_date as entry_date, test_expires_at as expires_at, active, updated_at
        """,
        request.id(),
        request.name(),
        request.unit(),
        blankToDefault(request.category(), "Geral"),
        request.quantity(),
        request.minQuantity(),
        request.unitCost() == null ? BigDecimal.ZERO : request.unitCost(),
        nz(request.monthlyBaseStock(), request.quantity()),
        request.entryDate(),
        request.expiryDate()
      );
    }
    return jdbc.queryForMap(
      """
      insert into inventory_items(id, name, unit, category, quantity, min_quantity, unit_cost, monthly_base_stock, entry_date, expires_at, active, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, now())
      on conflict (id) do update set
        name = excluded.name,
        unit = excluded.unit,
        category = excluded.category,
        quantity = excluded.quantity,
        min_quantity = excluded.min_quantity,
        unit_cost = excluded.unit_cost,
        monthly_base_stock = excluded.monthly_base_stock,
        entry_date = excluded.entry_date,
        expires_at = excluded.expires_at,
        active = true,
        updated_at = now()
      returning *
      """,
      request.id(),
      request.name(),
      request.unit(),
      blankToDefault(request.category(), "Geral"),
      request.quantity(),
      request.minQuantity(),
      request.unitCost() == null ? BigDecimal.ZERO : request.unitCost(),
      nz(request.monthlyBaseStock(), request.quantity()),
      request.entryDate(),
      request.expiryDate()
    );
  }

  public List<Map<String, Object>> productiveCapacity() {
    boolean testMode = settings.testModeEnabled();
    return jdbc.queryForList(
      """
      with recipe as (
        select p.id as product_id, p.name as product_name, pi.inventory_item_id, ii.name as ingredient_name, pi.quantity,
          case when ? then ii.test_quantity else ii.quantity end as stock_quantity
        from products p
        join product_ingredients pi on pi.product_id = p.id
        join inventory_items ii on ii.id = pi.inventory_item_id
        where p.active = true and ii.active = true and pi.quantity > 0
      ), capacity as (
        select product_id, product_name, ingredient_name,
          floor(stock_quantity / quantity) as possible_units,
          row_number() over (partition by product_id order by floor(stock_quantity / quantity) asc, ingredient_name asc) as rn
        from recipe
      )
      select product_id, product_name, possible_units, ingredient_name as limiting_ingredient,
        case when possible_units <= 0 then 'ALERTA_MAXIMO'
             when possible_units <= 5 then 'CRITICO'
             when possible_units <= 15 then 'ATENCAO'
             else 'NORMAL'
        end as status
      from capacity
      where rn = 1
      order by possible_units asc, product_name asc
      limit 80
      """,
      testMode
    );
  }

  public Map<String, Object> intelligence() {
    List<Map<String, Object>> items = list();
    List<Map<String, Object>> capacity = productiveCapacity();
    long critical = items.stream()
      .filter(item -> {
        String status = String.valueOf(item.get("smart_status"));
        return "ALERTA_MAXIMO".equals(status) || "CRITICO".equals(status);
      })
      .count();
    BigDecimal stockValue = items.stream()
      .map(item -> ((BigDecimal) item.get("quantity")).multiply((BigDecimal) item.get("unit_cost")))
      .reduce(BigDecimal.ZERO, BigDecimal::add);
    return Map.of(
      "criticalItems", critical,
      "stockValue", stockValue,
      "items", items,
      "capacity", capacity
    );
  }

  @Transactional
  public Map<String, Object> closeCurrentMonth(String name, LocalDate startDate, LocalDate endDate) {
    boolean testMode = settings.testModeEnabled();
    String quantityColumn = testMode ? "test_quantity" : "quantity";
    String baseColumn = testMode ? "test_monthly_base_stock" : "monthly_base_stock";
    Map<String, Object> month = jdbc.queryForMap(
      """
      insert into stock_months(name, start_date, end_date, status, test_mode, closed_at)
      values (?, ?, ?, 'CLOSED', ?, now())
      returning *
      """,
      blankToDefault(name, "Mês " + startDate + " a " + endDate),
      startDate,
      endDate,
      testMode
    );
    jdbc.update(
      """
      insert into stock_month_snapshots(
        month_id,
        inventory_item_id,
        initial_stock,
        total_entries,
        total_sales_output,
        total_manual_output,
        final_stock,
        final_cost
      )
      select
        ?::uuid,
        ii.id,
        ii.%s,
        coalesce(sum(case when sm.quantity > 0 then sm.quantity else 0 end), 0),
        abs(coalesce(sum(case when sm.order_id is not null and sm.quantity < 0 then sm.quantity else 0 end), 0)),
        abs(coalesce(sum(case when sm.order_id is null and sm.quantity < 0 then sm.quantity else 0 end), 0)),
        ii.%s,
        round(ii.%s * (case when ? then ii.test_unit_cost else ii.unit_cost end), 2)
      from inventory_items ii
      left join stock_movements sm on sm.inventory_item_id = ii.id
        and sm.test_mode = ?
        and sm.created_at::date between ? and ?
      where ii.active = true
      group by ii.id
      """.formatted(baseColumn, quantityColumn, quantityColumn),
      month.get("id"),
      testMode,
      testMode,
      startDate,
      endDate
    );
    jdbc.update("update inventory_items set " + quantityColumn + " = 0, " + baseColumn + " = 0, updated_at = now() where active = true");
    audit.log("admin", "STOCK_MONTH_CLOSED", "STOCK_MONTH", String.valueOf(month.get("id")), Map.of("start", startDate, "end", endDate));
    return month;
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

  public List<Map<String, Object>> months() {
    return jdbc.queryForList("select * from stock_months where test_mode = ? order by start_date desc limit 24", settings.testModeEnabled());
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

  private BigDecimal nz(BigDecimal value, BigDecimal fallback) {
    return value == null ? fallback : value;
  }

  private String blankToDefault(String value, String fallback) {
    return value == null || value.isBlank() ? fallback : value.trim();
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
