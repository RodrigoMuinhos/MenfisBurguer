import { CartItem, Order } from "@/types/order";
import {
  API_URL,
  Coupon,
  DeliveryType,
  PaymentMethod,
  registerMemberOrder,
  resolveRuntimeDeliveryType,
  wait,
} from "./checkout";

export async function submitCheckoutOrder({
  cart,
  kioskMode,
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
    kioskMode ? "retirada" : delivery,
  );
  const effectiveChannel = kioskMode ? "KIOSK" : "DELIVERY";
  try {
    if (!API_URL) {
      throw new Error("api_url_missing");
    }
    setPaying(true);
    setPaymentSlow(false);
    slowTimer = window.setTimeout(() => setPaymentSlow(true), 3500);
    const orderRes = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.qty,
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

    if (kioskMode) {
      const kioskOrder: Order = {
        id: String(createdOrder.id),
        number: Number(
          createdOrder.number ?? String(createdOrder.id).replace(/\D/g, ""),
        ),
        channel: "KIOSK",
        items: cart.map((item) => ({ ...item })),
        removedByItemId,
        deliveryType: "retirada",
        customerName: customerName.trim(),
        customerPhone: phone,
        customerAddress: address,
        total: Number(createdOrder.total ?? total),
        paymentMethod: payment === "cartao" ? "cartao" : "pix",
        paymentStatus: String(createdOrder.paymentStatus ?? "approved"),
        timestamp: Date.now(),
        status: "PAID",
      };

      if (slowTimer) window.clearTimeout(slowTimer);
      setPaymentSlow(false);
      setPaying(false);
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
      throw new Error(data?.error || "checkout_creation_failed");
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
            : kioskMode
              ? "Não foi possível enviar o pedido. Tente novamente."
              : "Não foi possível iniciar o pagamento. Tente novamente em alguns segundos.",
    );
  } finally {
    if (slowTimer) window.clearTimeout(slowTimer);
    setPaymentSlow(false);
    setPaying(false);
  }
}
