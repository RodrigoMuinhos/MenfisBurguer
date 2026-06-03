package com.menfis.delivery.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;

  public AuditService(JdbcTemplate jdbc, ObjectMapper mapper) {
    this.jdbc = jdbc;
    this.mapper = mapper;
  }

  public void log(String actor, String action, String entityType, String entityId, Object metadata) {
    try {
      jdbc.update(
        "insert into audit_logs(actor, action, entity_type, entity_id, metadata) values (?, ?, ?, ?, ?::jsonb)",
        actor,
        action,
        entityType,
        entityId,
        mapper.writeValueAsString(metadata == null ? "{}" : metadata)
      );
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("invalid audit metadata", e);
    }
  }
}
