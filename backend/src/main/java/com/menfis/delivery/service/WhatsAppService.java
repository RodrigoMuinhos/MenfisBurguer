package com.menfis.delivery.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.menfis.delivery.dto.WhatsAppDtos.Change;
import com.menfis.delivery.dto.WhatsAppDtos.Message;
import com.menfis.delivery.dto.WhatsAppDtos.WhatsAppWebhookPayload;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class WhatsAppService {
  private static final Logger log = LoggerFactory.getLogger(WhatsAppService.class);
  private static final String AUTO_REPLY = "Olá, recebemos sua mensagem. Em breve retornaremos.";

  private final JdbcTemplate jdbc;
  private final ObjectMapper mapper;
  private final RestClient restClient;

  @Value("${menfis.whatsapp-access-token:}")
  private String accessToken;

  @Value("${menfis.whatsapp-phone-number-id:}")
  private String phoneNumberId;

  @Value("${menfis.whatsapp-graph-api-version:v20.0}")
  private String graphApiVersion;

  public WhatsAppService(JdbcTemplate jdbc, ObjectMapper mapper, RestClient.Builder builder) {
    this.jdbc = jdbc;
    this.mapper = mapper;
    this.restClient = builder.baseUrl("https://graph.facebook.com").build();
  }

  public void processWebhook(WhatsAppWebhookPayload payload) {
    if (payload == null || payload.entry() == null) {
      log.info("WhatsApp webhook ignored empty payload");
      return;
    }

    for (var entry : payload.entry()) {
      if (entry == null || entry.changes() == null) continue;
      for (Change change : entry.changes()) {
        if (change == null || !"messages".equals(change.field()) || change.value() == null) continue;
        List<Message> messages = change.value().messages();
        if (messages == null || messages.isEmpty()) continue;
        for (Message message : messages) {
          processMessage(message);
        }
      }
    }
  }

  private void processMessage(Message message) {
    if (message == null || message.from() == null || message.from().isBlank()) return;

    String text = message.text() == null ? "" : safe(message.text().body());
    String type = safe(message.type());
    String providerMessageId = safe(message.id());
    String phone = safe(message.from());

    log.info(
        "WhatsApp inbound message received from={} type={} providerMessageId={} text={}",
        phone,
        type,
        providerMessageId,
        text);

    boolean inserted = saveInboundMessage(phone, providerMessageId, type, text, message);
    if (!inserted) {
      log.info("WhatsApp inbound duplicate ignored providerMessageId={}", providerMessageId);
      return;
    }

    sendAutoReply(phone);
  }

  private boolean saveInboundMessage(String phone, String providerMessageId, String type, String text, Message message) {
    upsertConversation(phone, text);
    String payload = toJson(message);
    int inserted = jdbc.update(
      """
      insert into whatsapp_messages(provider_message_id, phone, direction, message, message_type, status, raw_payload)
      values (?, ?, 'INBOUND', ?, ?, 'received', ?::jsonb)
      on conflict (provider_message_id) where provider_message_id is not null do nothing
      """,
      blankToNull(providerMessageId),
      phone,
      text,
      type,
      payload
    );
    return inserted > 0;
  }

  private void upsertConversation(String phone, String text) {
    jdbc.update(
      """
      insert into whatsapp_conversations(phone, current_step, last_message)
      values (?, 'INBOUND', ?)
      on conflict (phone) do update set
        current_step = excluded.current_step,
        last_message = excluded.last_message,
        updated_at = now()
      """,
      phone,
      text
    );
  }

  private void sendAutoReply(String phone) {
    if (accessToken == null || accessToken.isBlank() || phoneNumberId == null || phoneNumberId.isBlank()) {
      log.warn("WhatsApp auto reply skipped because WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing");
      saveOutboundMessage(phone, AUTO_REPLY, "skipped_config", "{}");
      return;
    }

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("messaging_product", "whatsapp");
    payload.put("to", phone);
    payload.put("type", "text");
    payload.put("text", Map.of("body", AUTO_REPLY));

    try {
      Object response = restClient.post()
        .uri("/{version}/{phoneNumberId}/messages", graphApiVersion, phoneNumberId)
        .header("Authorization", "Bearer " + accessToken)
        .contentType(MediaType.APPLICATION_JSON)
        .body(payload)
        .retrieve()
        .body(Object.class);

      saveOutboundMessage(phone, AUTO_REPLY, "sent", toJson(response));
      log.info("WhatsApp auto reply sent to={}", phone);
    } catch (RestClientException ex) {
      saveOutboundMessage(phone, AUTO_REPLY, "failed", "{\"error\":\"" + jsonEscape(ex.getMessage()) + "\"}");
      log.error("WhatsApp auto reply failed to={}: {}", phone, ex.getMessage());
    }
  }

  private void saveOutboundMessage(String phone, String text, String status, String rawPayload) {
    jdbc.update(
      """
      insert into whatsapp_messages(phone, direction, message, message_type, status, raw_payload)
      values (?, 'OUTBOUND', ?, 'text', ?, ?::jsonb)
      """,
      phone,
      text,
      status,
      rawPayload == null || rawPayload.isBlank() ? "{}" : rawPayload
    );
  }

  private String toJson(Object value) {
    try {
      return mapper.writeValueAsString(value);
    } catch (Exception ex) {
      return "{}";
    }
  }

  private String safe(String value) {
    return value == null ? "" : value.trim();
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value;
  }

  private String jsonEscape(String value) {
    return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
  }
}
