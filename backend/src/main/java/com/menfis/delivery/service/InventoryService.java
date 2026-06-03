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

  public InventoryService(JdbcTemplate jdbc, AuditService audit) {
    this.jdbc = jdbc;
    this.audit = audit;
  }

  public List<Map<String, Object>> list() {
    return jdbc.queryForList(
      """
      select *,
        quantity <= min_quantity as critical,
        expires_at is not null and expires_at <= current_date + interval '7 days' as expiring_soon
      from inventory_items
      where active = true
      order by critical desc, expiring_soon desc, name asc
      """
    );
  }

  public Map<String, Object> upsert(InventoryItemRequest request) {
    return jdbc.queryForMap(
      """
      insert into inventory_items(id, name, unit, quantity, min_quantity, updated_at)
      values (?, ?, ?, ?, ?, now())
      on conflict (id) do update set
        name = excluded.name,
        unit = excluded.unit,
        quantity = excluded.quantity,
        min_quantity = excluded.min_quantity,
        updated_at = now()
      returning *
      """,
      request.id(),
      request.name(),
      request.unit(),
      request.quantity(),
      request.minQuantity()
    );
  }

  @Transactional
  public Map<String, Object> movement(String itemId, StockMovementRequest request) {
    BigDecimal before = jdbc.queryForObject("select quantity from inventory_items where id = ? for update", BigDecimal.class, itemId);
    BigDecimal delta = "entrada".equalsIgnoreCase(request.type()) ? request.quantity() : request.quantity().negate();
    BigDecimal after = before.add(delta);
    jdbc.update("update inventory_items set quantity = ?, updated_at = now() where id = ?", after, itemId);
    jdbc.update(
      """
      insert into stock_movements(inventory_item_id, type, quantity, quantity_before, quantity_after, note)
      values (?, ?, ?, ?, ?, ?)
      """,
      itemId,
      request.type().toUpperCase(),
      delta,
      before,
      after,
      request.note()
    );
    audit.log("admin", "STOCK_MOVEMENT_CREATED", "INVENTORY_ITEM", itemId, Map.of("delta", delta, "after", after));
    return jdbc.queryForMap("select * from inventory_items where id = ?", itemId);
  }

  @Transactional
  public void deductForOrder(String orderId) {
    List<Map<String, Object>> deductions = jdbc.queryForList(
      """
      select pi.inventory_item_id, sum(pi.quantity * oi.quantity) as quantity
      from order_items oi
      join product_ingredients pi on pi.product_id = oi.product_id
      where oi.order_id = ?
      group by pi.inventory_item_id
      """,
      orderId
    );

    for (Map<String, Object> row : deductions) {
      String itemId = (String) row.get("inventory_item_id");
      BigDecimal qty = (BigDecimal) row.get("quantity");
      BigDecimal before = jdbc.queryForObject("select quantity from inventory_items where id = ? for update", BigDecimal.class, itemId);
      BigDecimal after = before.subtract(qty).max(BigDecimal.ZERO);
      jdbc.update("update inventory_items set quantity = ?, updated_at = now() where id = ?", after, itemId);
      jdbc.update(
        """
        insert into stock_movements(inventory_item_id, order_id, type, quantity, quantity_before, quantity_after, note)
        values (?, ?, 'SAIDA', ?, ?, ?, ?)
        """,
        itemId,
        orderId,
        qty.negate(),
        before,
        after,
        "Baixa automática por pedido em produção"
      );
    }
    audit.log("system", "ORDER_STOCK_DEDUCTED", "ORDER", orderId, Map.of("items", deductions.size()));
  }
}
