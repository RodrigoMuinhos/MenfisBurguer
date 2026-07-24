package com.menfis.delivery.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.menfis.delivery.dto.ApiDtos.LoginRequest;
import com.menfis.delivery.dto.ApiDtos.LoginResponse;
import com.menfis.delivery.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletResponse;

class AuthControllerTest {
  private final AuthService auth = mock(AuthService.class);
  private final AuthController controller = new AuthController(auth);

  @Test
  void adminLoginSetsProtectedCookieAndDoesNotExposeTokenInBody() {
    when(auth.login("admin@example.com", "password"))
      .thenReturn(new LoginResponse("signed.jwt.value", "ADMIN"));
    MockHttpServletResponse response = new MockHttpServletResponse();

    var result = controller.login(
      new LoginRequest("admin@example.com", "password"),
      response
    );

    assertThat(result.getBody().toString()).doesNotContain("signed.jwt.value", "token");
    assertThat(response.getHeader(HttpHeaders.SET_COOKIE))
      .contains("menfis_admin_session=signed.jwt.value")
      .contains("Path=/")
      .contains("Max-Age=43200")
      .contains("Secure")
      .contains("HttpOnly")
      .contains("SameSite=Strict");
  }

  @Test
  void nonAdminLoginKeepsExistingBearerResponse() {
    LoginResponse delivery = new LoginResponse("delivery.jwt.value", "DELIVERY");
    when(auth.login("delivery@example.com", "password")).thenReturn(delivery);
    MockHttpServletResponse response = new MockHttpServletResponse();

    var result = controller.login(
      new LoginRequest("delivery@example.com", "password"),
      response
    );

    assertThat(result.getBody()).isEqualTo(delivery);
    assertThat(response.getHeader(HttpHeaders.SET_COOKIE)).isNull();
  }
}
