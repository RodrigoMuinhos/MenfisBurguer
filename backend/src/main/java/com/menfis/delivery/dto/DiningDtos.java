package com.menfis.delivery.dto;

import com.menfis.delivery.domain.DiningSessionStatus;
import com.menfis.delivery.domain.TableKitStatus;
import com.menfis.delivery.domain.TableLightState;
import com.menfis.delivery.dto.ApiDtos.OrderItemRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
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

  public record PublicDiningSessionResponse(
    UUID sessionPublicId,
    String tableName,
    String tableArea,
    String customerName,
    OffsetDateTime openedAt
  ) {}

  public record DiningCustomerNameRequest(
    @NotBlank @Size(min = 2, max = 80) String name
  ) {}

  public record CreateDiningOrderRequest(
    @NotNull @Size(min = 1) List<@Valid OrderItemRequest> items,
    @NotBlank @Size(max = 120) String idempotencyKey
  ) {}

  public record DiningOrderResponse(
    UUID publicOrderId,
    long number,
    String status,
    String tableName,
    String customerName,
    List<Map<String, Object>> items,
    BigDecimal total,
    OffsetDateTime paymentRequestedAt,
    String paymentMethod,
    String lightState
  ) {}

  public record ConfirmDiningPaymentRequest(
    @NotBlank String paymentMethod
  ) {}
}
