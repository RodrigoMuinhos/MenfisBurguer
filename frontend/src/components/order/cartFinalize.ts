import { CartItem, Order } from "@/types/order";
import { MEMBER_TOKEN_KEY } from "@/components/product/shared";
import { printOrderReceipts } from "@/components/admin/shared";
import { deliveryConfirmationCode } from "@/services/orders/normalize";
import {
  API_URL,
  Coupon,
  DeliveryType,
  PaymentMethod,
  SUPPORT_WHATSAPP_URL,
  fmt,
  registerMemberOrder,
  resolveRuntimeDeliveryType,
  wait,
} from "./checkout";
import { buildOrderWhatsappReceipt } from "./whatsappReceipt";

function buildPendingCreatedOrder({
  createdOrder,
  cart,
  removedByItemId,
  effectiveDelivery,
  customerName,
  phone,
  address,
  total,
  payment,
  paymentProvider,
  paymentStatus,
}: {
  createdOrder: Record<string, unknown>;
  cart: CartItem[];
  removedByItemId: Record<string, string[]>;
  effectiveDelivery: "retirada" | "delivery";
  customerName: string;
  phone: string;
  address: string;
  total: number;
  payment: PaymentMethod;
  paymentProvider?: string;
  paymentStatus?: string;
}): Order {
  return {
    id: String(createdOrder.id),
    number: Number(
      createdOrder.number ?? String(createdOrder.id).replace(/\D/g, ""),
    ),
    deliveryCode: String(
      createdOrder.deliveryCode ?? deliveryConfirmationCode(createdOrder),
    ),
    channel: "DELIVERY",
    items: cart.map((item) => ({ ...item })),
    removedByItemId,
    deliveryType: effectiveDelivery,
    customerName: customerName.trim() || undefined,
    customerPhone: phone || undefined,
    customerAddress: address,
    total: Number(createdOrder.total ?? total),
    paymentProvider,
    paymentMethod: payment,
    paymentStatus: String(paymentStatus ?? createdOrder.paymentStatus ?? "pending"),
    paymentId:
      typeof createdOrder.paymentId === "string" ? createdOrder.paymentId : undefined,
    timestamp: Date.now(),
    status: "PAYMENT_PENDING",
  };
}

export async function submitCheckoutOrder({
  cart,
  kioskMode,
  counterServiceMode,
  delivery,
  payment,
  customerName,
  phone,
  address,
  appliedCoupon,
  discount,
  total,
  removedByItemId,
  onPlaceOrder,
  setPaying,
  setPaymentSlow,
  setKioskSuccessOpen,
  setPaymentError,
}: {
  cart: CartItem[];
  kioskMode: boolean;
  counterServiceMode: boolean;
  delivery: DeliveryType;
  payment: PaymentMethod;
  customerName: string;
  phone: string;
  address: string;
  appliedCoupon: Coupon | null;
  discount: number;
  total: number;
  removedByItemId: Record<string, string[]>;
  onPlaceOrder: (
    deliveryType: "retirada" | "delivery",
    phone?: string,
    address?: string,
    removedByItemId?: Record<string, string[]>,
    createdOrder?: Order,
  ) => void | Promise<void>;
  setPaying: (value: boolean) => void;
  setPaymentSlow: (value: boolean) => void;
  setKioskSuccessOpen: (value: boolean) => void;
  setPaymentError: (value: string) => void;
}) {
  let slowTimer: number | null = null;
  const effectiveDelivery = resolveRuntimeDeliveryType(
    kioskMode || counterServiceMode ? "retirada" : delivery,
  );
  const effectiveChannel = kioskMode || counterServiceMode ? "KIOSK" : "DELIVERY";
  try {
    if (!API_URL) {
      throw new Error("api_url_missing");
    }
    setPaying(true);
    setPaymentSlow(false);
    slowTimer = window.setTimeout(() => setPaymentSlow(true), 3500);
    const customerToken =
      !kioskMode && typeof window !== "undefined"
        ? localStorage.getItem(MEMBER_TOKEN_KEY)
        : "";
    const orderRes = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
      },
      body: JSON.stringify({
        items: cart.map((item) => ({
          productId: item.productId ?? item.id,
          quantity: item.qty,
          metadata: {
            components: item.components ?? [],
            note: item.note ?? "",
          },
        })),
        channel: effectiveChannel,
        deliveryType: effectiveDelivery.toUpperCase(),
        paymentMethod: payment.toUpperCase(),
        customerName: customerName.trim() || undefined,
        customerPhone: phone || undefined,
        customerAddress: address,
        idempotencyKey: `${phone.replace(/\D/g, "")}-${Date.now()}`,
        couponCode: appliedCoupon?.code,
        couponDiscount: appliedCoupon ? discount : 0,
      }),
    });

    const createdOrder = await orderRes.json().catch(() => ({}));
    if (!orderRes.ok || !createdOrder?.id) {
      throw new Error(createdOrder?.error || "order_creation_failed");
    }

    if (kioskMode || counterServiceMode) {
      const kioskOrder: Order = {
        id: String(createdOrder.id),
        number: Number(
          createdOrder.number ?? String(createdOrder.id).replace(/\D/g, ""),
        ),
        deliveryCode: createdOrder.deliveryCode ?? deliveryConfirmationCode(createdOrder),
        channel: "KIOSK",
        items: cart.map((item) => ({ ...item })),
        removedByItemId,
        deliveryType: "retirada",
        customerName: customerName.trim(),
        customerPhone: phone,
        customerAddress: address,
        total: Number(createdOrder.total ?? total),
        paymentMethod: counterServiceMode
          ? "presencial"
          : payment === "cartao"
            ? "cartao"
            : "pix",
        paymentStatus: String(
          createdOrder.paymentStatus ?? (counterServiceMode ? "awaiting_counter" : "approved"),
        ),
        timestamp: Date.now(),
        status: counterServiceMode
          ? "PAYMENT_PENDING"
          : String(createdOrder.status ?? "PAID") === "PAYMENT_PENDING"
            ? "PAYMENT_PENDING"
            : "PAID",
      };

      if (slowTimer) window.clearTimeout(slowTimer);
      setPaymentSlow(false);
      setPaying(false);
      if (counterServiceMode) {
        printOrderReceipts(kioskOrder);
        await onPlaceOrder(
          "retirada",
          phone,
          address,
          removedByItemId,
          kioskOrder,
        );
        return;
      }
      setKioskSuccessOpen(true);
      await wait(6200);
      setKioskSuccessOpen(false);
      await onPlaceOrder(
        "retirada",
        phone,
        address,
        removedByItemId,
        kioskOrder,
      );
      return;
    }

    if (payment === "pagar_na_entrega") {
      await onPlaceOrder(effectiveDelivery, phone || undefined, address, removedByItemId, {
        id: String(createdOrder.id),
        number: Number(
          createdOrder.number ?? String(createdOrder.id).replace(/\D/g, ""),
        ),
        deliveryCode: createdOrder.deliveryCode ?? deliveryConfirmationCode(createdOrder),
        channel: "DELIVERY",
        items: cart.map((item) => ({ ...item })),
        removedByItemId,
        deliveryType: effectiveDelivery,
        customerName: customerName.trim() || undefined,
        customerPhone: phone || undefined,
        customerAddress: address,
        total: Number(createdOrder.total ?? total),
        paymentMethod: "pagar_na_entrega",
        paymentStatus: "awaiting_delivery",
        timestamp: Date.now(),
        status: "PAID",
      });
      return;
    }

    if (payment === "whatsapp") {
      const whatsappOrder: Order = {
        id: String(createdOrder.id),
        number: Number(
          createdOrder.number ?? String(createdOrder.id).replace(/\D/g, ""),
        ),
        deliveryCode: createdOrder.deliveryCode ?? deliveryConfirmationCode(createdOrder),
        channel: "DELIVERY",
        items: cart.map((item) => ({ ...item })),
        removedByItemId,
        deliveryType: effectiveDelivery,
        customerName: customerName.trim() || undefined,
        customerPhone: phone || undefined,
        customerAddress: address,
        total: Number(createdOrder.total ?? total),
        paymentMethod: "whatsapp",
        paymentStatus: "awaiting_whatsapp",
        timestamp: Date.now(),
        status: "PAYMENT_PENDING",
      };
      openWhatsappReceipt(whatsappOrder);
      await onPlaceOrder(effectiveDelivery, phone || undefined, address, removedByItemId, whatsappOrder);
      return;
    }

    const paymentRes = await fetch(`${API_URL}/payments/pix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: createdOrder.id }),
    });

    const data = await paymentRes.json().catch(() => ({}));
    if (
      payment === "pix" &&
      (data?.qrCode || data?.qrCodeBase64 || data?.ticketUrl)
    ) {
      await onPlaceOrder(
        effectiveDelivery,
        phone || undefined,
        address,
        removedByItemId,
        {
          id: String(createdOrder.id),
          number: Number(
            createdOrder.number ?? String(createdOrder.id).replace(/\D/g, ""),
          ),
          deliveryCode: createdOrder.deliveryCode ?? deliveryConfirmationCode(createdOrder),
          channel: "DELIVERY",
          items: cart.map((item) => ({ ...item })),
          removedByItemId,
          deliveryType: effectiveDelivery,
          customerName: customerName.trim() || undefined,
          customerPhone: phone || undefined,
          customerAddress: address,
          total: Number(createdOrder.total ?? total),
          paymentProvider: "mercado_pago",
          paymentMethod: "pix",
          paymentStatus: String(
            data.status ?? createdOrder.paymentStatus ?? "action_required",
          ),
          paymentId: String(
            data.paymentId ??
              data.mercadoPagoOrderId ??
              createdOrder.paymentId ??
              "",
          ),
          pixQrCode: typeof data.qrCode === "string" ? data.qrCode : undefined,
          pixQrCodeBase64:
            typeof data.qrCodeBase64 === "string"
              ? data.qrCodeBase64
              : undefined,
          pixTicketUrl:
            typeof data.ticketUrl === "string" ? data.ticketUrl : undefined,
          timestamp: Date.now(),
          status: "PAYMENT_PENDING",
        },
      );
      return;
    }

    const checkoutUrl =
      typeof data.checkoutUrl === "string" && data.checkoutUrl
        ? data.checkoutUrl
        : typeof data.sandboxCheckoutUrl === "string" && data.sandboxCheckoutUrl
          ? data.sandboxCheckoutUrl
          : "";

    if (!paymentRes.ok || !checkoutUrl) {
      await onPlaceOrder(
        effectiveDelivery,
        phone || undefined,
        address,
        removedByItemId,
        buildPendingCreatedOrder({
          createdOrder,
          cart,
          removedByItemId,
          effectiveDelivery,
          customerName,
          phone,
          address,
          total,
          payment,
          paymentProvider: "mercado_pago",
          paymentStatus: String(data?.status ?? createdOrder.paymentStatus ?? "pending"),
        }),
      );
      return;
    }

    registerMemberOrder();
    localStorage.setItem("menfis_pending_order_id", String(createdOrder.id));
    window.location.assign(checkoutUrl);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    setPaymentError(
      reason.includes("api_url_missing")
        ? "Backend não configurado no kiosk. Defina NEXT_PUBLIC_API_URL apontando para o backend conectado ao Neon."
        : reason.includes("MERCADO_PAGO_ACCESS_TOKEN")
          ? "Pagamento indisponível: falta configurar a credencial do Mercado Pago."
          : reason.includes("order_creation_failed")
            ? "Não foi possível registrar o pedido. Confira os dados de entrega e tente novamente."
            : counterServiceMode
              ? "Não foi possível registrar o pedido no balcão. Tente novamente."
            : kioskMode
              ? "Não foi possível enviar o pedido. Tente novamente."
              : payment === "whatsapp" || payment === "pagar_na_entrega"
                ? "Não foi possível registrar o pedido. Tente novamente."
                : "Não foi possível iniciar o pagamento. Tente novamente em alguns segundos.",
    );
  } finally {
    if (slowTimer) window.clearTimeout(slowTimer);
    setPaymentSlow(false);
    setPaying(false);
  }
}

function openWhatsappReceipt(order: Order) {
  const text = buildOrderWhatsappReceipt(order);
  window.open(
    `${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer",
  );
}
