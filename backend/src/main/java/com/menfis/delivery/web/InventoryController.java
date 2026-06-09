package com.menfis.delivery.web;

import com.menfis.delivery.dto.ApiDtos.InventoryItemRequest;
import com.menfis.delivery.dto.ApiDtos.StockMovementRequest;
import com.menfis.delivery.service.InventoryService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/inventory")
public class InventoryController {
  private final InventoryService inventory;

  public InventoryController(InventoryService inventory) {
    this.inventory = inventory;
  }

  @GetMapping
  public List<Map<String, Object>> list() {
    return inventory.list();
  }

  @GetMapping("/movements")
  public List<Map<String, Object>> movements() {
    return inventory.movements();
  }

  @PostMapping("/items")
  public Map<String, Object> create(@Valid @RequestBody InventoryItemRequest request) {
    return inventory.upsert(request);
  }

  @PatchMapping("/items/{id}")
  public Map<String, Object> update(@PathVariable String id, @Valid @RequestBody InventoryItemRequest request) {
    return inventory.upsert(new InventoryItemRequest(
      id,
      request.name(),
      request.unit(),
      request.quantity(),
      request.minQuantity(),
      request.unitCost(),
      request.entryDate(),
      request.expiryDate()
    ));
  }

  @PostMapping("/items/{id}/movement")
  public Map<String, Object> movement(@PathVariable String id, @Valid @RequestBody StockMovementRequest request) {
    return inventory.movement(id, request);
  }

  @DeleteMapping("/items/{id}")
  public void delete(@PathVariable String id) {
    inventory.delete(id);
  }
}
