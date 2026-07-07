package com.menfis.delivery.web;

import com.menfis.delivery.dto.ApiDtos.InventoryItemRequest;
import com.menfis.delivery.dto.ApiDtos.StockMovementRequest;
import com.menfis.delivery.service.AuthService;
import com.menfis.delivery.service.InventoryService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/inventory")
public class InventoryController {
  private final InventoryService inventory;
  private final AuthService auth;

  public InventoryController(InventoryService inventory, AuthService auth) {
    this.inventory = inventory;
    this.auth = auth;
  }

  @GetMapping
  public List<Map<String, Object>> list(@RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return inventory.list();
  }

  @GetMapping("/movements")
  public List<Map<String, Object>> movements(@RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return inventory.movements();
  }

  @GetMapping("/intelligence")
  public Map<String, Object> intelligence(@RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return inventory.intelligence();
  }

  @GetMapping("/capacity")
  public List<Map<String, Object>> capacity(@RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return inventory.productiveCapacity();
  }

  @GetMapping("/months")
  public List<Map<String, Object>> months(@RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return inventory.months();
  }

  @PostMapping("/months/close")
  public Map<String, Object> closeMonth(
      @RequestBody Map<String, String> request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    LocalDate start = LocalDate.parse(request.getOrDefault("startDate", "2026-05-05"));
    LocalDate end = LocalDate.parse(request.getOrDefault("endDate", "2026-06-05"));
    return inventory.closeCurrentMonth(request.getOrDefault("name", ""), start, end);
  }

  @PostMapping("/items")
  public Map<String, Object> create(
      @Valid @RequestBody InventoryItemRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return inventory.upsert(request);
  }

  @PatchMapping("/items/{id}")
  public Map<String, Object> update(
      @PathVariable String id,
      @Valid @RequestBody InventoryItemRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return inventory.upsert(new InventoryItemRequest(
      id,
      request.name(),
      request.unit(),
      request.quantity(),
      request.minQuantity(),
      request.unitCost(),
      request.category(),
      request.monthlyBaseStock(),
      request.entryDate(),
      request.expiryDate()
    ));
  }

  @PostMapping("/items/{id}/movement")
  public Map<String, Object> movement(
      @PathVariable String id,
      @Valid @RequestBody StockMovementRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    return inventory.movement(id, request);
  }

  @DeleteMapping("/items/{id}")
  public void delete(
      @PathVariable String id,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireAdmin(authorization);
    inventory.delete(id);
  }
}
