package com.menfis.delivery.dto;

import com.menfis.delivery.domain.DiningSessionStatus;
import com.menfis.delivery.domain.TableKitStatus;
import com.menfis.delivery.domain.TableLightState;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class DiningDtos {
  public record DiningTableRequest(
    @NotBlank String name,
    @NotBlank String code,
    @NotBlank String area,
    Boolean active,
    Integer positionX,
    Integer positionY
  ) {}

  public record DiningTableResponse(
    UUID id,
    String name,
    String code,
    String area,
    boolean active,
    Integer positionX,
    Integer positionY
  ) {}

  public record TableKitRequest(
    @NotBlank String name,
    @NotBlank String code,
    Boolean active,
    String deviceId
  ) {}

  public record TableKitResponse(
    UUID id,
    String name,
    String code,
    String qrToken,
    TableKitStatus status,
    TableLightState lightState,
    boolean active,
    String deviceId
  ) {}

  public record OpenDiningSessionRequest(
    @NotNull UUID tableId,
    @NotNull UUID tableKitId,
    String customerName
  ) {}

  public record DiningSessionResponse(
    UUID id,
    UUID publicId,
    DiningSessionStatus status,
    OffsetDateTime openedAt,
    OffsetDateTime closedAt,
    String customerName,
    DiningTableResponse table,
    TableKitResponse kit
  ) {}

  public record LightRequest(@NotNull TableLightState state, String reason) {}

  public record DiningDashboardResponse(
    List<DiningTableResponse> tables,
    List<TableKitResponse> availableKits,
    List<DiningSessionResponse> openSessions
  ) {}
}
