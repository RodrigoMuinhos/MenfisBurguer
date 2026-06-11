package com.menfis.delivery.web;

import com.menfis.delivery.dto.WhatsAppDtos.WhatsAppWebhookPayload;
import com.menfis.delivery.service.WhatsAppService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/whatsapp", "/whatsapp", "/api/webhooks", "/webhooks"})
public class WhatsAppWebhookController {
  private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookController.class);
  private static final String LEGACY_VERIFY_TOKEN = "menfis-whatsapp-webhook";
  private static final String DEFAULT_VERIFY_TOKEN = "menfis-whatsapp-token";
  private final WhatsAppService whatsapp;

  public WhatsAppWebhookController(WhatsAppService whatsapp) {
    this.whatsapp = whatsapp;
  }

  @Value("${whatsapp.verify-token:${menfis.whatsapp-verify-token:menfis-whatsapp-token}}")
  private String verifyToken;

  @GetMapping(value = {"/webhook", "/whatsapp"}, produces = MediaType.TEXT_PLAIN_VALUE)
  public ResponseEntity<String> verifyWebhook(
      @RequestParam(name = "hub.mode", required = false) String mode,
      @RequestParam(name = "hub.verify_token", required = false) String token,
      @RequestParam(name = "hub.challenge", required = false) String challenge) {
    boolean tokenMatches = tokenMatches(token);
    boolean subscribed = "subscribe".equals(mode);

    log.info(
        "WhatsApp webhook validation received mode={} tokenPresent={} tokenMatches={} challengePresent={}",
        mode,
        token != null && !token.isBlank(),
        tokenMatches,
        challenge != null && !challenge.isBlank());

    if (subscribed && tokenMatches && challenge != null) {
      log.info("WhatsApp webhook validation accepted");
      return ResponseEntity.ok()
          .contentType(MediaType.TEXT_PLAIN)
          .body(challenge);
    }

    log.warn("WhatsApp webhook validation rejected mode={} tokenMatches={}", mode, tokenMatches);
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .contentType(MediaType.TEXT_PLAIN)
        .body("Forbidden");
  }

  @PostMapping(value = {"/webhook", "/whatsapp"}, produces = MediaType.TEXT_PLAIN_VALUE)
  public ResponseEntity<String> receiveWebhook(@RequestBody(required = false) WhatsAppWebhookPayload payload) {
    int entryCount = payload == null || payload.entry() == null ? 0 : payload.entry().size();
    log.info("WhatsApp webhook event received entries={}", entryCount);
    whatsapp.processWebhook(payload);

    return ResponseEntity.ok()
        .contentType(MediaType.TEXT_PLAIN)
        .body("EVENT_RECEIVED");
  }

  private boolean tokenMatches(String token) {
    return token != null
        && (token.equals(verifyToken)
            || token.equals(DEFAULT_VERIFY_TOKEN)
            || token.equals(LEGACY_VERIFY_TOKEN));
  }
}
