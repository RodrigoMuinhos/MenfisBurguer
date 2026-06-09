package com.menfis.delivery.web;

import com.menfis.delivery.dto.ApiDtos.CustomerProfileRequest;
import com.menfis.delivery.dto.ApiDtos.CustomerProfileResponse;
import com.menfis.delivery.dto.ApiDtos.CustomerSessionResponse;
import com.menfis.delivery.service.AuthService;
import com.menfis.delivery.service.CustomerService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/customers")
public class CustomerController {
  private final CustomerService customers;
  private final AuthService auth;

  public CustomerController(CustomerService customers, AuthService auth) {
    this.customers = customers;
    this.auth = auth;
  }

  @PostMapping("/session")
  public CustomerSessionResponse session(@Valid @RequestBody CustomerProfileRequest request) {
    return customers.upsertSession(request);
  }

  @GetMapping("/me")
  public CustomerProfileResponse me(@RequestHeader(name = "Authorization", required = false) String authorization) {
    return customers.profile(auth.requireCustomer(authorization));
  }

  @GetMapping("/crm")
  public List<Map<String, Object>> crm(@RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return customers.crm();
  }
}
