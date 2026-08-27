package com.menfis.delivery.web;

import com.menfis.delivery.dto.DiningDtos.DiningTableRequest;
import com.menfis.delivery.dto.DiningDtos.DiningTableResponse;
import com.menfis.delivery.dto.DiningDtos.LightRequest;
import com.menfis.delivery.dto.DiningDtos.DiningStationRequest;
import com.menfis.delivery.dto.DiningDtos.DiningStationResponse;
import com.menfis.delivery.dto.DiningDtos.TableKitRequest;
import com.menfis.delivery.dto.DiningDtos.TableKitResponse;
import com.menfis.delivery.service.AuthService;
import com.menfis.delivery.service.DiningService;
import jakarta.validation.Valid;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import java.util.List;
import java.util.UUID;
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
@ConditionalOnProperty(name = "menfis.features.dining-enabled", havingValue = "true")
@RequestMapping("/api/admin/dining")
public class AdminDiningController {
  private final DiningService dining;
  private final AuthService auth;

  public AdminDiningController(DiningService dining, AuthService auth) {
    this.dining = dining;
    this.auth = auth;
  }

  @GetMapping("/tables")
  public List<DiningTableResponse> tables(
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireDiningManager(authorization);
    return dining.listTables();
  }

  @PostMapping("/stations")
  public DiningStationResponse createStation(
      @Valid @RequestBody DiningStationRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    var claims = auth.requireDiningManager(authorization);
    return dining.createStation(request, claims.getSubject());
  }

  @PatchMapping("/stations/{tableId}")
  public DiningStationResponse updateStation(
      @PathVariable UUID tableId,
      @Valid @RequestBody DiningStationRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    var claims = auth.requireDiningManager(authorization);
    return dining.updateStation(tableId, request, claims.getSubject());
  }

  @DeleteMapping("/stations/{tableId}")
  public void deleteStation(
      @PathVariable UUID tableId,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    var claims = auth.requireDiningManager(authorization);
    dining.deleteStation(tableId, claims.getSubject());
  }

  @PostMapping("/tables")
  public DiningTableResponse createTable(
      @Valid @RequestBody DiningTableRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    var claims = auth.requireDiningManager(authorization);
    return dining.createTable(request, claims.getSubject());
  }

  @PatchMapping("/tables/{id}")
  public DiningTableResponse updateTable(
      @PathVariable UUID id,
      @Valid @RequestBody DiningTableRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    var claims = auth.requireDiningManager(authorization);
    return dining.updateTable(id, request, claims.getSubject());
  }

  @GetMapping("/kits")
  public List<TableKitResponse> kits(
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    auth.requireDiningManager(authorization);
    return dining.listKits();
  }

  @PostMapping("/kits")
  public TableKitResponse createKit(
      @Valid @RequestBody TableKitRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    var claims = auth.requireDiningManager(authorization);
    return dining.createKit(request, claims.getSubject());
  }

  @PatchMapping("/kits/{id}")
  public TableKitResponse updateKit(
      @PathVariable UUID id,
      @Valid @RequestBody TableKitRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    var claims = auth.requireDiningManager(authorization);
    return dining.updateKit(id, request, claims.getSubject());
  }

  @PostMapping("/kits/{id}/regenerate-token")
  public TableKitResponse regenerateToken(
      @PathVariable UUID id,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    var claims = auth.requireDiningManager(authorization);
    return dining.regenerateToken(id, claims.getSubject());
  }

  @PostMapping("/kits/{id}/light")
  public TableKitResponse changeLight(
      @PathVariable UUID id,
      @Valid @RequestBody LightRequest request,
      @RequestHeader(name = "Authorization", required = false) String authorization) {
    var claims = auth.requireDiningManager(authorization);
    return dining.changeLight(id, request.state(), request.reason(), claims.getSubject());
  }
}
