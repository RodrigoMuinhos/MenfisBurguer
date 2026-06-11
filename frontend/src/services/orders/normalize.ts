import { Order, OrderStatus, PaymentMethod } from "@/types/order";

export function normalizeOrderStatus(status: string): OrderStatus {
  const value = status.toUpperCase();
  if (value === "DRAFT" || value === "CREATED") return "CREATED";
  if (value === "PENDING_PAYMENT" || value === "AGUARDANDO_PAGAMENTO")
    return "PAYMENT_PENDING";
  if (value === "RECEIVED" || value === "RECEBIDO" || value === "PAID")
    return "PAID";
  if (value === "PREPARING" || value === "PREPARO")
    return "IN_PREPARATION";
  if (value === "PRONTO") return "READY";
  if (value === "SAIU_ENTREGA") return "OUT_FOR_DELIVERY";
  if (value === "ENTREGUE") return "DELIVERED";
  if (
    value === "CANCELED" ||
    value === "CANCELADO" ||
    value === "PAYMENT_FAILED" ||
    value === "PAGAMENTO_RECUSADO"
  )
    return "CANCELLED";
  if (
    value === "READY" ||
    value === "OUT_FOR_DELIVERY" ||
    value === "DELIVERED" ||
    value === "CANCELLED"
  )
    return value;
  return "PAYMENT_PENDING";
}

function normalizePaymentMethod(value?: string | null): PaymentMethod | undefined {
  if (!value) return undefined;
  const normalized = value.toUpperCase();
  if (normalized === "PRESENCIAL") return "presencial";
  if (normalized === "PAGAR_NA_ENTREGA") return "pagar_na_entrega";
  if (normalized === "WHATSAPP") return "whatsapp";
  if (normalized === "DINHEIRO") return "dinheiro";
  if (normalized === "CREDITO" || normalized === "CREDIT_CARD")
    return "credit_card";
  if (normalized === "DEBITO" || normalized === "DEBIT_CARD")
    return "debit_card";
  return normalized === "CARTAO" ? "cartao" : "pix";
}

export function normalizeBackendOrder(raw: any): Order {
  const items = Array.isArray(raw.items)
    ? raw.items.map((item: any) => ({
        id: String(item.productId ?? item.id ?? item.name ?? "item"),
        productId: item.productId ? String(item.productId) : undefined,
        name: String(item.name ?? item.productId ?? "Item"),
        qty: Number(item.quantity ?? item.qty ?? 1),
        price: Number(item.unitPrice ?? item.price ?? 0),
        components: Array.isArray(item.components)
          ? item.components.map((component: unknown) => String(component))
          : undefined,
        note: item.note ? String(item.note) : undefined,
      }))
    : [];
  const deliveryType =
    String(raw.deliveryType ?? raw.delivery_type).toUpperCase() === "RETIRADA"
      ? "retirada"
      : "delivery";

  const paymentStatus = raw.paymentStatus ?? raw.payment_status ?? undefined;
  const customerName = raw.customerName ?? raw.customer_name ?? undefined;
  const kioskMobCustomer =
    String(customerName ?? "").trim().toUpperCase().replace(/_/g, "-") === "KIOSK-MOB";
  const normalizedStatus = normalizeOrderStatus(String(raw.status ?? ""));
  const status =
    normalizedStatus === "PAYMENT_PENDING" &&
    String(paymentStatus ?? "").toLowerCase() === "approved"
      ? "PAID"
      : normalizedStatus;

  return {
    id: String(raw.id),
    number: Number(
      (raw.number ?? String(raw.id).replace(/\D/g, "")) || Date.now(),
    ),
    deliveryCode:
      raw.deliveryCode ?? raw.delivery_code ?? deliveryConfirmationCode(raw),
    channel:
      kioskMobCustomer ||
      String(raw.channel ?? "").toUpperCase() === "KIOSK" ||
      (deliveryType === "retirada" &&
        String(raw.paymentMethod ?? raw.payment_method).toUpperCase() ===
          "PRESENCIAL")
        ? "KIOSK"
        : "DELIVERY",
    items,
    deliveryType: kioskMobCustomer ? "retirada" : deliveryType,
    customerName: kioskMobCustomer ? "KIOSK-MOB" : customerName,
    customerPhone: raw.customerPhone ?? raw.customer_phone ?? undefined,
    customerAddress: raw.customerAddress ?? raw.customer_address ?? undefined,
    total: Number(raw.total ?? 0),
    paymentProvider: raw.paymentProvider ?? raw.payment_provider ?? undefined,
    paymentMethod: normalizePaymentMethod(
      raw.paymentMethod ?? raw.payment_method,
    ),
    paymentStatus,
    paymentId: raw.paymentId ?? raw.payment_id ?? undefined,
    pixQrCode: raw.pixQrCode ?? raw.pix_qr_code ?? undefined,
    pixQrCodeBase64: raw.pixQrCodeBase64 ?? raw.pix_qr_code_base64 ?? undefined,
    pixTicketUrl: raw.pixTicketUrl ?? raw.pix_ticket_url ?? undefined,
    timestamp: raw.timestamp
      ? Number(raw.timestamp)
      : raw.createdAt
        ? new Date(raw.createdAt).getTime()
        : raw.created_at
          ? new Date(raw.created_at).getTime()
          : Date.now(),
    status,
  };
}

export function deliveryConfirmationCode(raw: { number?: unknown; id?: unknown }) {
  const number = Number(raw.number ?? String(raw.id ?? "").replace(/\D/g, ""));
  const seed = Number.isFinite(number) && number > 0 ? number : Date.now();
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const a = letters[seed % letters.length];
  const b = letters[Math.floor(seed / letters.length) % letters.length];
  const digits = String((seed * 73 + 19) % 100).padStart(2, "0");
  return `${a}${b}${digits}`;
}
