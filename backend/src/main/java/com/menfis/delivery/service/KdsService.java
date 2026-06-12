package com.menfis.delivery.service;

import com.menfis.delivery.domain.OrderStatus;
import com.menfis.delivery.dto.ApiDtos.OrderResponse;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KdsService {
  private final JdbcTemplate jdbc;
  private final OrderService orders;
  private final InventoryService inventory;
  private final SettingsService settings;

  public KdsService(JdbcTemplate jdbc, OrderService orders, InventoryService inventory, SettingsService settings) {
    this.jdbc = jdbc;
    this.orders = orders;
    this.inventory = inventory;
    this.settings = settings;
  }

  public Map<String, List<OrderResponse>> board() {
    List<OrderResponse> rows = jdbc.queryForList(
      """
      select id from orders
      where status in ('PAID', 'ACCEPTED', 'IN_PREPARATION', 'READY')
        and test_mode = ?
      order by confirmed_at asc nulls last, number asc
      """,
      settings.testModeEnabled()
    ).stream().map(row -> orders.get((String) row.get("id"))).toList();

    return Map.of(
      "paid", rows.stream().filter(o -> o.status().equals("PAID")).toList(),
      "accepted", rows.stream().filter(o -> o.status().equals("ACCEPTED")).toList(),
      "inPreparation", rows.stream().filter(o -> o.status().equals("IN_PREPARATION")).toList(),
      "ready", rows.stream().filter(o -> o.status().equals("READY")).toList()
    );
  }

  @Transactional
  public OrderResponse advance(String id, String actor) {
    OrderResponse order = orders.get(id);
    OrderStatus current = OrderStatus.valueOf(order.status());
    OrderStatus next = switch (current) {
      case PAID -> OrderStatus.ACCEPTED;
      case ACCEPTED -> OrderStatus.IN_PREPARATION;
      case IN_PREPARATION -> OrderStatus.READY;
      case OUT_FOR_DELIVERY -> OrderStatus.DELIVERED;
      default -> throw new IllegalArgumentException("order_not_advanceable");
    };
    if (current == OrderStatus.ACCEPTED) {
      inventory.deductForOrder(order.id());
    }
    String event = switch (next) {
      case ACCEPTED -> "ORDER_ACCEPTED";
      case IN_PREPARATION -> "ORDER_PREPARING";
      case READY -> "ORDER_READY";
      case OUT_FOR_DELIVERY -> "OUT_FOR_DELIVERY";
      case DELIVERED -> "ORDER_DELIVERED";
      default -> "ORDER_STATUS_CHANGED";
    };
    return orders.changeStatus(id, next, actor == null ? "kds" : actor, event);
  }
}
