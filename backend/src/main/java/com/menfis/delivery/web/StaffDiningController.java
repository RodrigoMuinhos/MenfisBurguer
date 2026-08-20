package com.menfis.delivery.web;

import com.menfis.delivery.dto.DiningDtos.DiningDashboardResponse;
import com.menfis.delivery.dto.DiningDtos.DiningSessionResponse;
import com.menfis.delivery.dto.DiningDtos.LightRequest;
import com.menfis.delivery.dto.DiningDtos.OpenDiningSessionRequest;
import com.menfis.delivery.dto.DiningDtos.TableKitResponse;
import com.menfis.delivery.dto.DiningDtos.ConfirmDiningPaymentRequest;
import com.menfis.delivery.dto.DiningDtos.DiningOrderResponse;
import com.menfis.delivery.service.AuthService;
import com.menfis.delivery.service.DiningOrderService;
import com.menfis.delivery.service.DiningService;
import jakarta.validation.Valid;
import java.util.UUID;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff/dining")
public class StaffDiningController {
  private final DiningService dining;
  private final AuthService auth;
  private final DiningOrderService diningOrders;

  public StaffDiningController(DiningService dining, AuthService auth, DiningOrderService diningOrders) {
    this.dining = dining;
    this.auth = auth;
    this.diningOrders = diningOrders;
  }

  @GetMapping("/dashboard")
  public DiningDashboardResponse dashboard(
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireDiningStaff(authorization);
    return dining.dashboard();
  }

  @GetMapping("/orders")
  public List<DiningOrderResponse> orders(
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireDiningStaff(authorization);
    return diningOrders.listActiveForStaff();
  }

  @DeleteMapping("/stations/{tableId}")
  public void deleteStation(
      @PathVariable UUID tableId,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    var claims = auth.requireDiningStaff(authorization);
    dining.deleteStation(tableId, claims.getSubject());
  }

  @PostMapping("/sessions")
  public DiningSessionResponse openSession(
      @Valid @RequestBody OpenDiningSessionRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    var claims = auth.requireDiningStaff(authorization);
    return dining.openSession(request, claims.getSubject());
  }

  @GetMapping("/sessions/{id}")
  public DiningSessionResponse session(
      @PathVariable UUID id,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireDiningStaff(authorization);
    return dining.getSession(id);
  }

  @PostMapping("/sessions/{id}/close")
  public DiningSessionResponse closeSession(
      @PathVariable UUID id,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    var claims = auth.requireDiningStaff(authorization);
    return dining.closeSession(id, claims.getSubject());
  }

  @PostMapping("/kits/{id}/light")
  public TableKitResponse changeLight(
      @PathVariable UUID id,
      @Valid @RequestBody LightRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    var claims = auth.requireDiningStaff(authorization);
    return dining.changeLight(id, request.state(), request.reason(), claims.getSubject());
  }

  @PostMapping("/orders/{publicOrderId}/confirm-payment")
  public DiningOrderResponse confirmPayment(
      @PathVariable UUID publicOrderId,
      @Valid @RequestBody ConfirmDiningPaymentRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    var claims = auth.requireDiningStaff(authorization);
    return diningOrders.confirmPayment(publicOrderId, request.paymentMethod(), claims.getSubject());
  }

  @PostMapping("/orders/{publicOrderId}/picked-up")
  public DiningOrderResponse markPickedUp(
      @PathVariable UUID publicOrderId,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    var claims = auth.requireDiningStaff(authorization);
    return diningOrders.markPickedUp(publicOrderId, claims.getSubject());
  }
}
