package com.menfis.delivery.service;

import com.menfis.delivery.dto.ApiDtos.SupportTicketRequest;
import com.menfis.delivery.dto.ApiDtos.SupportTicketResponse;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportService {
  private final JdbcTemplate jdbc;
  private final AuditService audit;

  public SupportService(JdbcTemplate jdbc, AuditService audit) {
    this.jdbc = jdbc;
    this.audit = audit;
  }

  @Transactional
  public SupportTicketResponse create(SupportTicketRequest request) {
    String id = jdbc.queryForObject(
      """
      insert into support_tickets(order_id, type, reason, message, customer_phone)
      values (?, ?, ?, ?, ?)
      returning id
      """,
      String.class,
      request.orderId(),
      request.type(),
      request.reason(),
      request.message(),
      request.customerPhone()
    );
    audit.log(
      "customer",
      request.type(),
      "ORDER",
      request.orderId(),
      Map.of("ticketId", id, "reason", request.reason())
    );
    return get(id);
  }

  public List<SupportTicketResponse> list() {
    createDelayedTickets();
    return jdbc.query(
      """
      select st.*, o.status as order_status
      from support_tickets st
      join orders o on o.id = st.order_id
      order by case st.status when 'PENDING' then 0 when 'IN_PROGRESS' then 1 else 2 end,
        st.created_at desc
      limit 200
      """,
      this::mapTicket
    );
  }

  public List<SupportTicketResponse> listByOrder(String orderId) {
    createDelayedTickets();
    return jdbc.query(
      """
      select st.*, o.status as order_status
      from support_tickets st
      join orders o on o.id = st.order_id
      where st.order_id = ?
      order by st.created_at desc
      limit 50
      """,
      this::mapTicket,
      orderId
    );
  }

  @Transactional
  public SupportTicketResponse resolve(String id) {
    jdbc.update(
      "update support_tickets set status = 'RESOLVED', resolved_at = now() where id = ?",
      id
    );
    audit.log("admin", "SUPPORT_RESOLVED", "SUPPORT_TICKET", id, Map.of());
    return get(id);
  }

  private SupportTicketResponse get(String id) {
    return jdbc.queryForObject(
      """
      select st.*, o.status as order_status
      from support_tickets st
      join orders o on o.id = st.order_id
      where st.id = ?
      """,
      this::mapTicket,
      id
    );
  }

  private void createDelayedTickets() {
    jdbc.update(
      """
      insert into support_tickets(order_id, type, reason, message, customer_phone)
      select o.id, 'ORDER_DELAYED', 'Pedido passou do prazo estimado',
        'Ticket automático: pedido ainda não entregue após 50 minutos.', o.customer_phone
      from orders o
      where o.created_at < now() - interval '50 minutes'
        and o.status in ('PAID', 'ACCEPTED', 'IN_PREPARATION', 'READY', 'OUT_FOR_DELIVERY')
        and not exists (
          select 1 from support_tickets st
          where st.order_id = o.id and st.type = 'ORDER_DELAYED'
        )
      """
    );
  }

  private SupportTicketResponse mapTicket(ResultSet rs, int rowNum) throws SQLException {
    return new SupportTicketResponse(
      rs.getString("id"),
      rs.getString("order_id"),
      rs.getString("order_status"),
      rs.getString("type"),
      rs.getString("reason"),
      rs.getString("message"),
      rs.getString("customer_phone"),
      rs.getString("status"),
      rs.getObject("created_at", OffsetDateTime.class),
      rs.getObject("resolved_at", OffsetDateTime.class)
    );
  }
}
