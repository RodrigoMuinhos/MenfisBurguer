package com.menfis.delivery.service;

import com.menfis.delivery.domain.DeliveryType;
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

  public KdsService(JdbcTemplate jdbc, OrderService orders, InventoryService inventory) {
    this.jdbc = jdbc;
    this.orders = orders;
    this.inventory = inventory;
  }

  public Map<String, List<OrderResponse>> board() {
    List<OrderResponse> rows = jdbc.queryForList(
      """
      select id from orders
      where status in ('RECEIVED', 'PREPARING', 'READY')
      order by confirmed_at asc nulls last, number asc
      """
    ).stream().map(row -> orders.get((String) row.get("id"))).toList();

    return Map.of(
      "received", rows.stream().filter(o -> o.status().equals("RECEIVED")).toList(),
      "preparing", rows.stream().filter(o -> o.status().equals("PREPARING")).toList(),
      "ready", rows.stream().filter(o -> o.status().equals("READY")).toList()
    );
  }

  @Transactional
  public OrderResponse advance(String id, String actor) {
    OrderResponse order = orders.get(id);
    OrderStatus next = switch (OrderStatus.valueOf(order.status())) {
      case RECEIVED -> OrderStatus.PREPARING;
      case PREPARING -> OrderStatus.READY;
      case READY -> order.deliveryType() == DeliveryType.DELIVERY ? OrderStatus.OUT_FOR_DELIVERY : OrderStatus.DELIVERED;
      case OUT_FOR_DELIVERY -> OrderStatus.DELIVERED;
      default -> throw new IllegalArgumentException("order_not_advanceable");
    };
    if (OrderStatus.valueOf(order.status()) == OrderStatus.RECEIVED) {
      inventory.deductForOrder(order.id());
    }
    return orders.changeStatus(id, next, actor == null ? "kds" : actor, "kds_advance");
  }
}
