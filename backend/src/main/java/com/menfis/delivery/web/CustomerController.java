package com.menfis.delivery.web;

import com.menfis.delivery.dto.ApiDtos.CustomerProfileRequest;
import com.menfis.delivery.dto.ApiDtos.CustomerProfileResponse;
import com.menfis.delivery.dto.ApiDtos.CustomerLoginRequest;
import com.menfis.delivery.dto.ApiDtos.CustomerSessionResponse;
import com.menfis.delivery.dto.ApiDtos.OrderResponse;
import com.menfis.delivery.service.AuthService;
import com.menfis.delivery.service.CustomerService;
import com.menfis.delivery.service.OrderService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
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
  private final OrderService orders;

  public CustomerController(CustomerService customers, AuthService auth, OrderService orders) {
    this.customers = customers;
    this.auth = auth;
    this.orders = orders;
  }

  @PostMapping("/session")
  public CustomerSessionResponse session(@Valid @RequestBody CustomerProfileRequest request) {
    return customers.upsertSession(request);
  }

  @PostMapping("/login")
  public CustomerSessionResponse login(@Valid @RequestBody CustomerLoginRequest request) {
    return customers.login(request);
  }

  @GetMapping("/me")
  public CustomerProfileResponse me(@RequestHeader(name = "Authorization", required = false) String authorization) {
    return customers.profile(auth.requireCustomer(authorization));
  }

  @PatchMapping("/me")
  public CustomerProfileResponse updateMe(
      @RequestHeader(name = "Authorization", required = false) String authorization,
      @RequestBody Map<String, Object> request) {
    return customers.updateOwnProfile(auth.requireCustomer(authorization), request);
  }

  @GetMapping("/orders")
  public List<OrderResponse> orders(@RequestHeader(name = "Authorization", required = false) String authorization) {
    return orders.listForCustomer(auth.requireCustomer(authorization));
  }

  @GetMapping("/crm")
  public List<Map<String, Object>> crm(@RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return customers.crm();
  }

  @PostMapping("/admin")
  public Map<String, Object> createAdmin(
    @RequestHeader(name = "Authorization", required = false) String authorization,
    @RequestBody Map<String, Object> request
  ) {
    auth.requireAdmin(authorization);
    return customers.createAdminCustomer(request);
  }

  @PatchMapping("/admin/{id}")
  public Map<String, Object> updateAdmin(
    @RequestHeader(name = "Authorization", required = false) String authorization,
    @PathVariable long id,
    @RequestBody Map<String, Object> request
  ) {
    auth.requireAdmin(authorization);
    return customers.updateAdminCustomer(id, request);
  }

  @DeleteMapping("/admin/{id}")
  public void deleteAdmin(
    @RequestHeader(name = "Authorization", required = false) String authorization,
    @PathVariable long id
  ) {
    auth.requireAdmin(authorization);
    customers.deleteAdminCustomer(id);
  }

  @PostMapping("/admin/{id}/temporary-password")
  public Map<String, Object> temporaryPassword(
    @RequestHeader(name = "Authorization", required = false) String authorization,
    @PathVariable long id
  ) {
    auth.requireAdmin(authorization);
    return customers.generateTemporaryPassword(id);
  }

  @PostMapping("/password/recovery")
  public Map<String, Object> requestRecovery(@RequestBody Map<String, Object> request) {
    return customers.requestPasswordRecovery(request);
  }

  @PostMapping("/password/reset")
  public CustomerSessionResponse resetPassword(@RequestBody Map<String, Object> request) {
    return customers.resetPassword(request);
  }
}
