package com.menfis.delivery.config;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.menfis.delivery.dto.DiningDtos.PublicDiningSessionResponse;
import com.menfis.delivery.service.DiningService;
import com.menfis.delivery.web.PublicDiningController;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
  controllers = PublicDiningController.class,
  properties = "menfis.jwt-secret=test-secret-with-at-least-thirty-two-bytes"
)
@Import(SecurityConfig.class)
class PublicDiningSecurityTest {
  @Autowired private MockMvc mvc;
  @MockBean private DiningService dining;

  @Test
  void resolvesQrSessionWithoutAuthenticationAndDoesNotExposeInternalIds() throws Exception {
    String token = "abcdefghijklmnopqrstuvwxyzABCDEFG_123456789";
    when(dining.resolvePublicSession(token)).thenReturn(new PublicDiningSessionResponse(
      UUID.randomUUID(), "SALÃO 03", "SALÃO", null, OffsetDateTime.now()
    ));

    mvc.perform(get("/api/public/dining/kits/{token}/session", token))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.sessionPublicId").isNotEmpty())
      .andExpect(jsonPath("$.tableName").value("SALÃO 03"))
      .andExpect(jsonPath("$.tableId").doesNotExist())
      .andExpect(jsonPath("$.kitId").doesNotExist())
      .andExpect(jsonPath("$.qrToken").doesNotExist());
  }
}
