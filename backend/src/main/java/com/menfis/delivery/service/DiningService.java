package com.menfis.delivery.service;

import com.menfis.delivery.domain.DiningSessionStatus;
import com.menfis.delivery.domain.TableKitStatus;
import com.menfis.delivery.domain.TableLightState;
import com.menfis.delivery.dto.DiningDtos.DiningDashboardResponse;
import com.menfis.delivery.dto.DiningDtos.DiningSessionResponse;
import com.menfis.delivery.dto.DiningDtos.DiningTableRequest;
import com.menfis.delivery.dto.DiningDtos.DiningTableResponse;
import com.menfis.delivery.dto.DiningDtos.OpenDiningSessionRequest;
import com.menfis.delivery.dto.DiningDtos.PublicDiningSessionResponse;
import com.menfis.delivery.dto.DiningDtos.TableKitRequest;
import com.menfis.delivery.dto.DiningDtos.TableKitResponse;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DiningService {
  private final JdbcTemplate jdbc;
  private final DiningTokenService tokens;
  private final TableLightGateway lights;
  private final AuditService audit;

  public DiningService(
      JdbcTemplate jdbc,
      DiningTokenService tokens,
      TableLightGateway lights,
      AuditService audit) {
    this.jdbc = jdbc;
    this.tokens = tokens;
    this.lights = lights;
    this.audit = audit;
  }

  public List<DiningTableResponse> listTables() {
    return jdbc.query("select * from dining_tables order by area, name", this::mapTable);
  }

  @Transactional
  public DiningTableResponse createTable(DiningTableRequest request, String actor) {
    UUID id = UUID.randomUUID();
    jdbc.update(
      """
      insert into dining_tables(id, name, code, area, active, position_x, position_y)
      values (?, ?, ?, ?, ?, ?, ?)
      """,
      id, clean(request.name()), code(request.code()), clean(request.area()),
      request.active() == null || request.active(), request.positionX(), request.positionY()
    );
    audit.log(actor, "DINING_TABLE_CREATED", "DINING_TABLE", id.toString(), request);
    return getTable(id);
  }

  @Transactional
  public DiningTableResponse updateTable(UUID id, DiningTableRequest request, String actor) {
    int updated = jdbc.update(
      """
      update dining_tables set name = ?, code = ?, area = ?, active = ?,
        position_x = ?, position_y = ?, updated_at = now()
      where id = ?
      """,
      clean(request.name()), code(request.code()), clean(request.area()),
      request.active() == null || request.active(), request.positionX(), request.positionY(), id
    );
    if (updated != 1) throw new EmptyResultDataAccessException(1);
    audit.log(actor, "DINING_TABLE_UPDATED", "DINING_TABLE", id.toString(), request);
    return getTable(id);
  }

  public List<TableKitResponse> listKits() {
    return jdbc.query("select * from table_kits order by name", this::mapKit);
  }

  @Transactional
  public TableKitResponse createKit(TableKitRequest request, String actor) {
    UUID id = UUID.randomUUID();
    boolean active = request.active() == null || request.active();
    jdbc.update(
      """
      insert into table_kits(id, name, code, qr_token, status, light_state, active, device_id)
      values (?, ?, ?, ?, ?, 'OFF', ?, ?)
      """,
      id, clean(request.name()), code(request.code()), tokens.generate(),
      active ? TableKitStatus.AVAILABLE.name() : TableKitStatus.DISABLED.name(),
      active, blankToNull(request.deviceId())
    );
    audit.log(actor, "TABLE_KIT_CREATED", "TABLE_KIT", id.toString(), Map.of("code", code(request.code())));
    return getKit(id);
  }

  @Transactional
  public TableKitResponse updateKit(UUID id, TableKitRequest request, String actor) {
    TableKitResponse current = getKitForUpdate(id);
    boolean active = request.active() == null ? current.active() : request.active();
    if (!active && current.status() == TableKitStatus.IN_USE) {
      throw new IllegalStateException("table_kit_in_use");
    }
    TableKitStatus nextStatus = active
      ? (current.status() == TableKitStatus.DISABLED ? TableKitStatus.AVAILABLE : current.status())
      : TableKitStatus.DISABLED;
    jdbc.update(
      """
      update table_kits set name = ?, code = ?, active = ?, status = ?, device_id = ?, updated_at = now()
      where id = ?
      """,
      clean(request.name()), code(request.code()), active, nextStatus.name(), blankToNull(request.deviceId()), id
    );
    audit.log(actor, "TABLE_KIT_UPDATED", "TABLE_KIT", id.toString(), request);
    return getKit(id);
  }

  @Transactional
  public TableKitResponse regenerateToken(UUID id, String actor) {
    TableKitResponse current = getKitForUpdate(id);
    if (current.status() == TableKitStatus.IN_USE) {
      throw new IllegalStateException("cannot_regenerate_token_while_kit_in_use");
    }
    jdbc.update("update table_kits set qr_token = ?, updated_at = now() where id = ?", tokens.generate(), id);
    audit.log(actor, "TABLE_KIT_TOKEN_REGENERATED", "TABLE_KIT", id.toString(), Map.of());
    return getKit(id);
  }

  @Transactional
  public TableKitResponse changeLight(UUID kitId, TableLightState state, String reason, String actor) {
    TableKitResponse kit = getKitForUpdate(kitId);
    if (!kit.active() || kit.status() == TableKitStatus.DISABLED) {
      throw new IllegalStateException("table_kit_disabled");
    }
    UUID sessionId = openSessionIdForKit(kitId);
    lights.setState(kitId, state);
    jdbc.update(
      """
      insert into table_light_events(table_kit_id, dining_session_id, previous_state, new_state, actor_user_id, actor, reason)
      values (?, ?, ?, ?, ?, ?, ?)
      """,
      kitId, sessionId, kit.lightState().name(), state.name(), actorId(actor), actor, blankToNull(reason)
    );
    audit.log(actor, "TABLE_LIGHT_CHANGED", "TABLE_KIT", kitId.toString(), Map.of(
      "before", kit.lightState().name(), "after", state.name()
    ));
    return getKit(kitId);
  }

  public DiningDashboardResponse dashboard() {
    List<TableKitResponse> available = listKits().stream()
      .filter(kit -> kit.active() && kit.status() == TableKitStatus.AVAILABLE)
      .toList();
    return new DiningDashboardResponse(listTables(), available, listOpenSessions());
  }

  public List<DiningSessionResponse> listOpenSessions() {
    return jdbc.query(
      sessionSelect() + " where s.status = 'OPEN' order by s.opened_at",
      this::mapSession
    );
  }

  public PublicDiningSessionResponse resolvePublicSession(String qrToken) {
    String token = normalizedToken(qrToken);
    return jdbc.queryForObject(
      """
      select s.public_id, s.customer_name, s.opened_at, t.name table_name, t.area table_area
      from table_kits k
      join dining_sessions s on s.table_kit_id = k.id and s.status = 'OPEN'
      join dining_tables t on t.id = s.table_id
      where k.qr_token = ? and k.active = true and k.status = 'IN_USE' and t.active = true
      """,
      (rs, row) -> new PublicDiningSessionResponse(
        rs.getObject("public_id", UUID.class),
        rs.getString("table_name"),
        rs.getString("table_area"),
        rs.getString("customer_name"),
        rs.getObject("opened_at", OffsetDateTime.class)
      ),
      token
    );
  }

  public DiningOrderContext resolveOrderContext(String qrToken) {
    String token = normalizedToken(qrToken);
    return jdbc.queryForObject(
      """
      select s.id session_id, s.public_id session_public_id, s.customer_name,
        t.id table_id, t.name table_name, k.id kit_id
      from table_kits k
      join dining_sessions s on s.table_kit_id = k.id and s.status = 'OPEN'
      join dining_tables t on t.id = s.table_id
      where k.qr_token = ? and k.active = true and k.status = 'IN_USE' and t.active = true
      """,
      (rs, row) -> new DiningOrderContext(
        rs.getObject("session_id", UUID.class),
        rs.getObject("session_public_id", UUID.class),
        rs.getObject("table_id", UUID.class),
        rs.getString("table_name"),
        rs.getObject("kit_id", UUID.class),
        rs.getString("customer_name")
      ),
      token
    );
  }

  @Transactional
  public PublicDiningSessionResponse identifyCustomer(String qrToken, String customerName) {
    String token = normalizedToken(qrToken);
    String name = customerName == null ? "" : customerName.trim();
    if (name.length() < 2 || name.length() > 80) {
      throw new IllegalArgumentException("invalid_customer_name");
    }
    int updated = jdbc.update(
      """
      update dining_sessions s
      set customer_name = ?, updated_at = now()
      from table_kits k
      where s.table_kit_id = k.id
        and s.status = 'OPEN'
        and k.qr_token = ?
        and k.active = true
        and k.status = 'IN_USE'
        and (s.customer_name is null or btrim(s.customer_name) = '')
      """,
      name,
      token
    );
    if (updated == 0) {
      PublicDiningSessionResponse existing = resolvePublicSession(token);
      if (existing.customerName() != null && existing.customerName().equalsIgnoreCase(name)) return existing;
      throw new IllegalStateException("dining_session_already_identified");
    }
    return resolvePublicSession(token);
  }

  public DiningSessionResponse getSession(UUID id) {
    return jdbc.queryForObject(sessionSelect() + " where s.id = ?", this::mapSession, id);
  }

  @Transactional
  public DiningSessionResponse openSession(OpenDiningSessionRequest request, String actor) {
    DiningTableResponse table = getTableForUpdate(request.tableId());
    TableKitResponse kit = getKitForUpdate(request.tableKitId());
    if (!table.active()) throw new IllegalStateException("dining_table_disabled");
    if (!kit.active() || kit.status() != TableKitStatus.AVAILABLE) {
      throw new IllegalStateException("table_kit_not_available");
    }
    UUID id = UUID.randomUUID();
    UUID publicId = UUID.randomUUID();
    try {
      jdbc.update(
        """
        insert into dining_sessions(
          id, public_id, table_id, table_kit_id, customer_name, status, opened_by_staff_id
        ) values (?, ?, ?, ?, ?, 'OPEN', ?)
        """,
        id, publicId, table.id(), kit.id(), blankToNull(request.customerName()), actorId(actor)
      );
    } catch (DuplicateKeyException ex) {
      throw new IllegalStateException("table_or_kit_already_in_use", ex);
    }
    jdbc.update(
      "update table_kits set status = 'IN_USE', light_state = 'NORMAL', updated_at = now() where id = ?",
      kit.id()
    );
    jdbc.update(
      """
      insert into table_light_events(table_kit_id, dining_session_id, previous_state, new_state, actor_user_id, actor, reason)
      values (?, ?, ?, 'NORMAL', ?, ?, 'session_opened')
      """,
      kit.id(), id, kit.lightState().name(), actorId(actor), actor
    );
    audit.log(actor, "DINING_SESSION_OPENED", "DINING_SESSION", id.toString(), Map.of(
      "tableId", table.id(), "kitId", kit.id()
    ));
    return getSession(id);
  }

  @Transactional
  public DiningSessionResponse closeSession(UUID id, String actor) {
    DiningSessionResponse session = getSessionForUpdate(id);
    if (session.status() != DiningSessionStatus.OPEN) return session;
    Integer blockingOrders = jdbc.queryForObject(
      """
      select count(*) from orders where dining_session_id = ?
        and status not in ('PICKED_UP', 'DELIVERED', 'CANCELLED')
      """,
      Integer.class,
      id
    );
    if (blockingOrders != null && blockingOrders > 0) {
      throw new IllegalStateException("dining_session_has_active_orders");
    }
    jdbc.update(
      """
      update dining_sessions set status = 'CLOSED', closed_at = now(), closed_by_staff_id = ?, updated_at = now()
      where id = ? and status = 'OPEN'
      """,
      actorId(actor), id
    );
    jdbc.update(
      "update table_kits set status = 'AVAILABLE', light_state = 'OFF', updated_at = now() where id = ?",
      session.kit().id()
    );
    jdbc.update(
      """
      insert into table_light_events(table_kit_id, dining_session_id, previous_state, new_state, actor_user_id, actor, reason)
      values (?, ?, ?, 'OFF', ?, ?, 'session_closed')
      """,
      session.kit().id(), id, session.kit().lightState().name(), actorId(actor), actor
    );
    audit.log(actor, "DINING_SESSION_CLOSED", "DINING_SESSION", id.toString(), Map.of());
    return getSession(id);
  }

  private DiningTableResponse getTable(UUID id) {
    return jdbc.queryForObject("select * from dining_tables where id = ?", this::mapTable, id);
  }

  private DiningTableResponse getTableForUpdate(UUID id) {
    return jdbc.queryForObject("select * from dining_tables where id = ? for update", this::mapTable, id);
  }

  private TableKitResponse getKit(UUID id) {
    return jdbc.queryForObject("select * from table_kits where id = ?", this::mapKit, id);
  }

  private TableKitResponse getKitForUpdate(UUID id) {
    return jdbc.queryForObject("select * from table_kits where id = ? for update", this::mapKit, id);
  }

  private DiningSessionResponse getSessionForUpdate(UUID id) {
    return jdbc.queryForObject(sessionSelect() + " where s.id = ? for update of s", this::mapSession, id);
  }

  private UUID openSessionIdForKit(UUID kitId) {
    try {
      return jdbc.queryForObject(
        "select id from dining_sessions where table_kit_id = ? and status = 'OPEN'",
        UUID.class,
        kitId
      );
    } catch (EmptyResultDataAccessException ex) {
      return null;
    }
  }

  private UUID actorId(String actor) {
    try {
      return jdbc.queryForObject("select id from admins where lower(login) = lower(?) and active", UUID.class, actor);
    } catch (EmptyResultDataAccessException ex) {
      return null;
    }
  }

  private String sessionSelect() {
    return """
      select s.id session_id, s.public_id, s.status session_status, s.opened_at, s.closed_at, s.customer_name,
        t.id table_id, t.name table_name, t.code table_code, t.area table_area, t.active table_active,
        t.position_x, t.position_y,
        k.id kit_id, k.name kit_name, k.code kit_code, k.qr_token, k.status kit_status,
        k.light_state, k.active kit_active, k.device_id
      from dining_sessions s
      join dining_tables t on t.id = s.table_id
      join table_kits k on k.id = s.table_kit_id
      """;
  }

  private DiningTableResponse mapTable(ResultSet rs, int row) throws SQLException {
    return new DiningTableResponse(
      rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("code"), rs.getString("area"),
      rs.getBoolean("active"), (Integer) rs.getObject("position_x"), (Integer) rs.getObject("position_y")
    );
  }

  private TableKitResponse mapKit(ResultSet rs, int row) throws SQLException {
    return new TableKitResponse(
      rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("code"), rs.getString("qr_token"),
      TableKitStatus.valueOf(rs.getString("status")), TableLightState.valueOf(rs.getString("light_state")),
      rs.getBoolean("active"), rs.getString("device_id")
    );
  }

  private DiningSessionResponse mapSession(ResultSet rs, int row) throws SQLException {
    DiningTableResponse table = new DiningTableResponse(
      rs.getObject("table_id", UUID.class), rs.getString("table_name"), rs.getString("table_code"),
      rs.getString("table_area"), rs.getBoolean("table_active"),
      (Integer) rs.getObject("position_x"), (Integer) rs.getObject("position_y")
    );
    TableKitResponse kit = new TableKitResponse(
      rs.getObject("kit_id", UUID.class), rs.getString("kit_name"), rs.getString("kit_code"),
      rs.getString("qr_token"), TableKitStatus.valueOf(rs.getString("kit_status")),
      TableLightState.valueOf(rs.getString("light_state")), rs.getBoolean("kit_active"), rs.getString("device_id")
    );
    return new DiningSessionResponse(
      rs.getObject("session_id", UUID.class), rs.getObject("public_id", UUID.class),
      DiningSessionStatus.valueOf(rs.getString("session_status")),
      rs.getObject("opened_at", OffsetDateTime.class), rs.getObject("closed_at", OffsetDateTime.class),
      rs.getString("customer_name"), table, kit
    );
  }

  private String clean(String value) {
    return value.trim();
  }

  private String code(String value) {
    return clean(value).toUpperCase(Locale.ROOT).replaceAll("\\s+", "_");
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private String normalizedToken(String value) {
    String token = value == null ? "" : value.trim();
    if (token.length() < 32 || token.length() > 128 || !token.matches("[A-Za-z0-9_-]+")) {
      throw new IllegalArgumentException("invalid_qr_token");
    }
    return token;
  }

  public record DiningOrderContext(
    UUID sessionId,
    UUID sessionPublicId,
    UUID tableId,
    String tableName,
    UUID kitId,
    String customerName
  ) {}
}
