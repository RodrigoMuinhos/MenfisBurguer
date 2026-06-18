import { CartItem, Order } from "@/types/order";
import { MEMBER_TOKEN_KEY } from "@/components/product/shared";
import { printOrderReceipts } from "@/components/admin/shared";
import { normalizeBackendOrder } from "@/services/orders/normalize";
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

const CART_STORAGE_KEY = "menfis_cart";

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
  return buildLocalCreatedOrder({
    createdOrder,
    cart,
    removedByItemId,
    effectiveDelivery,
    customerName,
    phone,
    address,
    total,
    overrides: {
      paymentProvider,
      paymentMethod: payment,
      paymentStatus: String(paymentStatus ?? createdOrder.paymentStatus ?? "pending"),
      paymentId:
        typeof createdOrder.paymentId === "string" ? createdOrder.paymentId : undefined,
      status: "PAYMENT_PENDING",
    },
  });
}

function buildLocalCreatedOrder({
  createdOrder,
  cart,
  removedByItemId,
  effectiveDelivery,
  customerName,
  phone,
  address,
  total,
  overrides,
}: {
  createdOrder: Record<string, unknown>;
  cart: CartItem[];
  removedByItemId: Record<string, string[]>;
  effectiveDelivery: "retirada" | "delivery";
  customerName: string;
  phone: string;
  address: string;
  total: number;
  overrides: Partial<Order>;
}): Order {
  const backendOrder = normalizeBackendOrder(createdOrder);
  return {
    ...backendOrder,
    items: backendOrder.items.length ? backendOrder.items : cart.map((item) => ({ ...item })),
    removedByItemId: backendOrder.removedByItemId ?? removedByItemId,
    deliveryType: backendOrder.deliveryType ?? effectiveDelivery,
    customerName: (backendOrder.customerName ?? customerName.trim()) || undefined,
    customerPhone: (backendOrder.customerPhone ?? phone) || undefined,
    customerAddress: backendOrder.customerAddress ?? address,
    total: Number(backendOrder.total || createdOrder.total || total),
    ...overrides,
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
  setKioskSuccessOrder,
  setPaymentError,
  confirmCounterPrint,
  clearCartItems,
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
  setKioskSuccessOrder?: (order: Order | null) => void;
  setPaymentError: (value: string) => void;
  confirmCounterPrint?: (order: Order) => Promise<boolean>;
  clearCartItems?: () => void;
}) {
  let slowTimer: number | null = null;
  const effectiveDelivery = resolveRuntimeDeliveryType(
    kioskMode || counterServiceMode ? "retirada" : delivery,
  );
  const effectiveChannel = kioskMode || counterServiceMode ? "KIOSK" : "DELIVERY";
  const backendPaymentMethod =
    payment === "mercadopago"
      ? "MERCADO_PAGO"
      : payment === "pix_qrcode"
        ? "PIX"
        : payment.toUpperCase();
  const orderFingerprint = [
    phone.replace(/\D/g, ""),
    address.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim(),
    Date.now(),
    Math.random().toString(36).slice(2, 8),
  ].join("-");
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
        paymentMethod: backendPaymentMethod,
        customerName: customerName.trim() || undefined,
        customerPhone: phone || undefined,
        customerAddress: address,
        idempotencyKey: orderFingerprint,
        couponCode: appliedCoupon?.code,
        couponDiscount: appliedCoupon ? discount : 0,
      }),
    });

    const createdOrder = await orderRes.json().catch(() => ({}));
    if (!orderRes.ok || !createdOrder?.id) {
      throw new Error(createdOrder?.error || "order_creation_failed");
    }

    if (kioskMode || counterServiceMode) {
      const kioskOrder = buildLocalCreatedOrder({
        createdOrder,
        cart,
        removedByItemId,
        effectiveDelivery: "retirada",
        customerName,
        phone,
        address,
        total,
        overrides: {
          channel: "KIOSK",
          deliveryType: "retirada",
          paymentMethod: counterServiceMode
            ? "presencial"
            : payment === "cartao"
              ? "cartao"
              : "pix",
          paymentStatus: String(
            createdOrder.paymentStatus ?? (counterServiceMode ? "awaiting_counter" : "approved"),
          ),
          status: counterServiceMode
            ? "PAYMENT_PENDING"
            : String(createdOrder.status ?? "PAID") === "PAYMENT_PENDING"
              ? "PAYMENT_PENDING"
              : "PAID",
        },
      });

      if (slowTimer) window.clearTimeout(slowTimer);
      setPaymentSlow(false);
      setPaying(false);
      if (counterServiceMode) {
        const shouldPrint = await confirmCounterPrint?.(kioskOrder);
        if (shouldPrint) {
          printOrderReceipts(kioskOrder);
        }
        setKioskSuccessOrder?.(kioskOrder);
        setKioskSuccessOpen(true);
        await wait(6200);
        setKioskSuccessOpen(false);
        setKioskSuccessOrder?.(null);
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

    if (payment === "presencial") {
      await onPlaceOrder(effectiveDelivery, phone || undefined, address, removedByItemId, buildLocalCreatedOrder({
        createdOrder,
        cart,
        removedByItemId,
        effectiveDelivery,
        customerName,
        phone,
        address,
        total,
        overrides: {
          channel: effectiveDelivery === "retirada" ? "KIOSK" : "DELIVERY",
          paymentMethod: "presencial",
          paymentStatus: "awaiting_counter",
          status: "PAID",
        },
      }));
      return;
    }

    if (payment === "pagar_na_entrega") {
      await onPlaceOrder(effectiveDelivery, phone || undefined, address, removedByItemId, buildLocalCreatedOrder({
        createdOrder,
        cart,
        removedByItemId,
        effectiveDelivery,
        customerName,
        phone,
        address,
        total,
        overrides: {
          channel: "DELIVERY",
          paymentMethod: "pagar_na_entrega",
          paymentStatus: "awaiting_delivery",
          status: "PAID",
        },
      }));
      return;
    }

    if (payment === "whatsapp") {
      const whatsappOrder = buildLocalCreatedOrder({
        createdOrder,
        cart,
        removedByItemId,
        effectiveDelivery,
        customerName,
        phone,
        address,
        total,
        overrides: {
          channel: "DELIVERY",
          paymentMethod: "whatsapp",
          paymentStatus: "awaiting_whatsapp",
          status: "PAYMENT_PENDING",
        },
      });
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
      (payment === "pix" || payment === "pix_qrcode") &&
      (data?.qrCode || data?.qrCodeBase64 || data?.ticketUrl)
    ) {
      await onPlaceOrder(
        effectiveDelivery,
        phone || undefined,
        address,
        removedByItemId,
        buildLocalCreatedOrder({
          createdOrder,
          cart,
          removedByItemId,
          effectiveDelivery,
          customerName,
          phone,
          address,
          total,
          overrides: {
            channel: "DELIVERY",
            paymentProvider: "mercado_pago",
            paymentMethod: payment === "pix_qrcode" ? "pix_qrcode" : "pix",
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
            status: "PAYMENT_PENDING",
          },
        }),
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
    localStorage.removeItem(CART_STORAGE_KEY);
    clearCartItems?.();
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
