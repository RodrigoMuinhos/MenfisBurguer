package com.menfis.delivery.dto;

import com.menfis.delivery.domain.DeliveryType;
import com.menfis.delivery.domain.OrderChannel;
import com.menfis.delivery.domain.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
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
    OrderChannel channel,
    @NotNull DeliveryType deliveryType,
    @NotNull PaymentMethod paymentMethod,
    String customerName,
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
    String deliveryCode,
    List<Map<String, Object>> items,
    OrderChannel channel,
    DeliveryType deliveryType,
    String customerName,
    String customerPhone,
    String customerAddress,
    BigDecimal subtotal,
    BigDecimal deliveryFee,
    String couponCode,
    BigDecimal discountTotal,
    BigDecimal total,
    String paymentProvider,
    String paymentMethod,
    String paymentStatus,
    String paymentId,
    long timestamp,
    OffsetDateTime createdAt,
    String status,
    OffsetDateTime paidAt,
    OffsetDateTime confirmedAt
  ) {}

  public record StatusResponse(String id, String status, OffsetDateTime paidAt, OffsetDateTime confirmedAt) {}

  public record PatchStatusRequest(@NotNull String status, String actor, String reason) {}

  public record UpdateOrderItemsRequest(
    @NotEmpty List<Map<String, Object>> items,
    BigDecimal deliveryFee,
    String customerName,
    String customerPhone,
    String customerAddress,
    DeliveryType deliveryType,
    String paymentMethod,
    String paymentStatus,
    String couponCode,
    BigDecimal discountTotal
  ) {}

  public record ConfirmDeliveryRequest(@NotBlank String code, String actor) {}

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

  public record ClubPreferenceRequest(@NotBlank String plan) {}

  public record ClubPreferenceResponse(
    String subscriptionId,
    String checkoutUrl,
    String sandboxCheckoutUrl,
    String preferenceId,
    String status
  ) {}

  public record PixResponse(
    String orderId,
    String checkoutUrl,
    String sandboxCheckoutUrl,
    String preferenceId,
    String mercadoPagoOrderId,
    String paymentId,
    String status,
    String statusDetail,
    String ticketUrl,
    String qrCode,
    String qrCodeBase64
  ) {}

  public record InventoryItemRequest(
    @NotBlank String id,
    @NotBlank String name,
    @NotBlank String unit,
    @NotNull BigDecimal quantity,
    @NotNull BigDecimal minQuantity,
    BigDecimal unitCost,
    LocalDate entryDate,
    LocalDate expiryDate
  ) {}

  public record StockMovementRequest(@NotBlank String type, @NotNull BigDecimal quantity, String note) {}

  public record CouponRequest(
    @NotBlank String code,
    @NotBlank String label,
    @NotBlank String type,
    @NotNull BigDecimal value,
    Boolean active
  ) {}

  public record LoginRequest(@NotBlank String login, String password) {}

  public record LoginResponse(String token, String role) {}

  public record CustomerProfileRequest(
    @NotBlank String name,
    @NotBlank String phone,
    @Email String email,
    String cpf,
    String password,
    String confirmPassword,
    LocalDate birthday,
    String cep,
    String street,
    String number,
    String complement,
    String neighborhood,
    String city,
    String reference
  ) {}

  public record CustomerProfileResponse(
    long id,
    String name,
    String phone,
    String email,
    LocalDate birthday,
    String avatarUrl,
    Map<String, Object> defaultAddress,
    long orderCount,
    BigDecimal totalSpent,
    OffsetDateTime lastOrderAt,
    boolean hasPassword,
    String clubLevel,
    OffsetDateTime clubExpiresAt
  ) {}

  public record CustomerSessionResponse(String token, String role, CustomerProfileResponse customer) {}

  public record CustomerLoginRequest(@NotBlank String login, @NotBlank String password) {}

  public record SoldOutAlertRequest(@NotBlank String name, @NotBlank String phone, @Email String email) {}
}
