package com.menfis.delivery.dto;

import com.menfis.delivery.domain.DeliveryType;
import com.menfis.delivery.domain.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public class ApiDtos {
  public record OrderItemRequest(
    @NotBlank String productId,
    String name,
    @Positive int quantity,
    List<String> addonIds,
    Map<String, Object> metadata
  ) {}

  public record CreateOrderRequest(
    @NotEmpty List<@Valid OrderItemRequest> items,
    @NotNull DeliveryType deliveryType,
    @NotNull PaymentMethod paymentMethod,
    String customerPhone,
    String customerAddress,
    String cpf,
    String idempotencyKey,
    String couponCode,
    BigDecimal couponDiscount
  ) {}

  public record OrderResponse(
    String id,
    long number,
    List<Map<String, Object>> items,
    DeliveryType deliveryType,
    String customerPhone,
    String customerAddress,
    BigDecimal subtotal,
    BigDecimal deliveryFee,
    BigDecimal total,
    String paymentProvider,
    String paymentMethod,
    String paymentStatus,
    String paymentId,
    String status,
    OffsetDateTime paidAt,
    OffsetDateTime confirmedAt
  ) {}

  public record StatusResponse(String id, String status, OffsetDateTime paidAt, OffsetDateTime confirmedAt) {}

  public record PatchStatusRequest(@NotNull String status, String actor, String reason) {}

  public record SupportTicketRequest(
    @NotBlank String orderId,
    @NotBlank String type,
    @NotBlank String reason,
    String message,
    String customerPhone
  ) {}

  public record SupportTicketResponse(
    String id,
    String orderId,
    String orderStatus,
    String type,
    String reason,
    String message,
    String customerPhone,
    String status,
    OffsetDateTime createdAt,
    OffsetDateTime resolvedAt
  ) {}

  public record PixRequest(@NotBlank String orderId) {}

  public record PixResponse(String orderId, String checkoutUrl, String sandboxCheckoutUrl, String preferenceId) {}

  public record InventoryItemRequest(
    @NotBlank String id,
    @NotBlank String name,
    @NotBlank String unit,
    @NotNull BigDecimal quantity,
    @NotNull BigDecimal minQuantity
  ) {}

  public record StockMovementRequest(@NotBlank String type, @NotNull BigDecimal quantity, String note) {}

  public record LoginRequest(@NotBlank String login, @NotBlank String password) {}

  public record LoginResponse(String token, String role) {}
}
