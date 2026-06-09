package com.menfis.delivery.web;

import com.menfis.delivery.dto.ApiDtos.LoginRequest;
import com.menfis.delivery.dto.ApiDtos.LoginResponse;
import com.menfis.delivery.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
  private final AuthService auth;

  public AuthController(AuthService auth) {
    this.auth = auth;
  }

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest request) {
    return auth.login(request.login(), request.password());
  }

  @PostMapping("/kds")
  public LoginResponse kds() {
    return auth.kdsSession();
  }

  @PostMapping("/delivery")
  public LoginResponse delivery() {
    return auth.deliverySession();
  }
}
