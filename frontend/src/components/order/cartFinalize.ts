import { CartItem, Order } from "@/types/order";
import { MEMBER_TOKEN_KEY } from "@/components/product/shared";
import { normalizeBackendOrder } from "@/services/orders/normalize";
import {
  API_URL,
  Coupon,
  DeliveryType,
  KIOSK_PIX_CODE,
  PaymentMethod,
  SUPPORT_WHATSAPP_URL,
  fmt,
  resolveRuntimeDeliveryType,
} from "./checkout";
import { buildOrderWhatsappReceipt } from "./whatsappReceipt";

export type CounterTerminalMethod = "PIX" | "DEBIT" | "CREDIT";
export type TerminalPaymentProgress = {
  status: string;
  message: string;
  qrCode?: string;
  paymentId?: string;
  startedAt: number;
  stageStartedAt: number;
  cancel?: () => Promise<void>;
};

const TERMINAL_FINAL_STATUSES = new Set([
  "APPROVED",
  "DECLINED",
  "CANCELLED",
  "TIMEOUT",
  "TERMINAL_DISCONNECTED",
  "COMMUNICATION_ERROR",
]);

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

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
  couponOrderFields = {},
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
  couponOrderFields?: Partial<Order>;
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
      ...couponOrderFields,
      paymentProvider,
      paymentMethod: payment || undefined,
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
  const enteredCustomerName = customerName.trim();
  const backendCustomerName = String(backendOrder.customerName ?? "").trim();
  const printableCustomerName =
    enteredCustomerName && enteredCustomerName.toUpperCase().replace(/_/g, "-") !== "KIOSK-MOB"
      ? enteredCustomerName
      : backendCustomerName.toUpperCase().replace(/_/g, "-") !== "KIOSK-MOB"
        ? backendCustomerName
        : "Cliente";
  return {
    ...backendOrder,
    items: backendOrder.items.length ? backendOrder.items : cart.map((item) => ({ ...item })),
    removedByItemId: backendOrder.removedByItemId ?? removedByItemId,
    deliveryType: backendOrder.deliveryType ?? effectiveDelivery,
    // O backend pode responder com KIOSK-MOB, que identifica o terminal
    // compartilhado. Na via do cliente deve prevalecer o nome digitado após o pagamento.
    customerName: printableCustomerName,
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
  setTerminalPaymentProgress,
  onRestaurantClosed,
  confirmCounterPayment,
  confirmCounterCustomerName,
  waitForKioskSuccessConfirm,
  clearCartItems,
  onTerminalCancelled,
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
  setTerminalPaymentProgress?: (value: TerminalPaymentProgress | null) => void;
  onRestaurantClosed?: () => void;
  confirmCounterPayment?: (amount: number) => Promise<CounterTerminalMethod>;
  confirmCounterCustomerName?: () => Promise<string>;
  waitForKioskSuccessConfirm?: (order: Order) => Promise<void>;
  clearCartItems?: () => void;
  onTerminalCancelled?: () => void;
}) {
  let slowTimer: number | null = null;
  const effectiveDelivery = resolveRuntimeDeliveryType(
    kioskMode || counterServiceMode ? "retirada" : delivery,
  );
  const effectiveChannel = kioskMode || counterServiceMode ? "KIOSK" : "DELIVERY";
  const selectedCounterPayment =
    counterServiceMode ? await confirmCounterPayment?.(total) : undefined;
  let counterCustomerName: string | undefined;
  let orderCustomerName = customerName;
  const backendPaymentMethod =
    counterServiceMode
      ? selectedCounterPayment === "PIX"
        ? "PIX"
        : "CARTAO"
      : payment === "mercadopago"
        ? "MERCADO_PAGO"
        : payment === "pix_qrcode"
          ? "PIX"
          : payment.toUpperCase();
  const couponOrderFields: Partial<Order> =
    appliedCoupon && discount > 0
      ? { couponCode: appliedCoupon.code, discountTotal: discount }
      : discount > 0
        ? { discountTotal: discount }
        : {};
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
          addonIds: item.addonIds ?? [],
          metadata: {
            components: item.components ?? [],
            note: item.note ?? "",
          },
        })),
        channel: effectiveChannel,
        deliveryType: effectiveDelivery.toUpperCase(),
        paymentMethod: backendPaymentMethod,
        customerName: orderCustomerName.trim() || undefined,
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
    const createdOrderAccessHeaders = {
      ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
      ...(createdOrder.trackingToken
        ? { "X-Order-Token": String(createdOrder.trackingToken) }
        : {}),
    };

    if (kioskMode || counterServiceMode) {
      let terminalPayment:
        | { approved?: boolean; paymentId?: string; status?: string; message?: string; qrCode?: string }
        | undefined;
      if (counterServiceMode && selectedCounterPayment) {
        const terminalRes = await fetch(`${API_URL}/terminal-payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...createdOrderAccessHeaders },
          body: JSON.stringify({
            orderId: String(createdOrder.id),
            method: selectedCounterPayment,
          }),
        });
        terminalPayment = await terminalRes.json().catch(() => ({}));
        if (!terminalRes.ok || !terminalPayment?.paymentId) {
          throw new Error(
            `terminal_payment_${String(terminalPayment?.status ?? "failed").toLowerCase()}:${terminalPayment?.message ?? ""}`,
          );
        }
        const terminalPaymentId = terminalPayment.paymentId;
        let cancelRequested = false;
        let cancellationConfirmed = false;
        const terminalStartedAt = Date.now();
        const stageStartedAt = terminalStartedAt;
        const paymentDeadline = terminalStartedAt + 60_000;
        const cancelTerminalPayment = async () => {
          cancelRequested = true;
          setTerminalPaymentProgress?.({
            status: "CANCELLING",
            message: "Encerrando a operação na maquineta",
            paymentId: terminalPaymentId,
            startedAt: terminalStartedAt,
            stageStartedAt,
          });
          const response = await fetch(
            `${API_URL}/terminal-payments/${encodeURIComponent(terminalPaymentId)}/cancel`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", ...createdOrderAccessHeaders },
              body: JSON.stringify({ orderId: String(createdOrder.id) }),
              signal: AbortSignal.timeout(35_000),
            },
          );
          const result = await response.json().catch(() => ({}));
          if (!response.ok || result?.status !== "CANCELLED") {
            cancelRequested = false;
            throw new Error("terminal_payment_cancel_failed");
          }
          cancellationConfirmed = true;
          terminalPayment = {
            approved: false,
            paymentId: terminalPaymentId,
            status: "CANCELLED",
            message: result?.message || "Operação cancelada",
          };
          setTerminalPaymentProgress?.({
            status: "CANCELLED",
            message: "Operação cancelada",
            paymentId: terminalPaymentId,
            startedAt: terminalStartedAt,
            stageStartedAt,
          });
        };
        setTerminalPaymentProgress?.({
          status: String(terminalPayment.status ?? "WAITING_TERMINAL"),
          message: terminalPayment.message || "Aguarde o terminal iniciar",
          paymentId: terminalPayment.paymentId,
          startedAt: terminalStartedAt,
          stageStartedAt,
          cancel: cancelTerminalPayment,
        });
        while (
          !TERMINAL_FINAL_STATUSES.has(String(terminalPayment?.status ?? "").toUpperCase()) &&
          Date.now() < paymentDeadline
        ) {
          await wait(700);
          const statusRes = await fetch(
            `${API_URL}/terminal-payments/${encodeURIComponent(terminalPaymentId)}` +
              `?orderId=${encodeURIComponent(String(createdOrder.id))}` +
              `&method=${encodeURIComponent(selectedCounterPayment)}`,
            { cache: "no-store", signal: AbortSignal.timeout(5000), headers: createdOrderAccessHeaders },
          );
          terminalPayment = await statusRes.json().catch(() => ({}));
          if (!statusRes.ok) {
            if (cancelRequested) {
              const cancelDeadline = Date.now() + 35_000;
              while (!cancellationConfirmed && Date.now() < cancelDeadline) await wait(100);
              if (cancellationConfirmed) break;
            }
            throw new Error("terminal_payment_communication_error");
          }
          setTerminalPaymentProgress?.({
            status: String(terminalPayment?.status ?? "PROCESSING"),
            message: terminalPayment?.message || "Siga as instruções no terminal",
            qrCode: typeof terminalPayment?.qrCode === "string" ? terminalPayment.qrCode : undefined,
            paymentId: terminalPayment?.paymentId ?? terminalPaymentId,
            startedAt: terminalStartedAt,
            stageStartedAt,
            cancel: cancelTerminalPayment,
          });
        }
        if (!TERMINAL_FINAL_STATUSES.has(String(terminalPayment?.status ?? "").toUpperCase())) {
          await cancelTerminalPayment();
          throw new Error("terminal_payment_cancelled:Tempo esgotado. Operação cancelada");
        }
        if (!terminalPayment?.approved) {
          await wait(1600);
          throw new Error(
            `terminal_payment_${String(terminalPayment?.status ?? "failed").toLowerCase()}:${terminalPayment?.message ?? ""}`,
          );
        }
        await wait(1600);
        setTerminalPaymentProgress?.(null);
        counterCustomerName = await confirmCounterCustomerName?.();
        if (!counterCustomerName?.trim()) {
          throw new Error("terminal_customer_name_required");
        }
        const customerNameRes = await fetch(`${API_URL}/terminal-payments/customer-name`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...createdOrderAccessHeaders },
          body: JSON.stringify({
            orderId: String(createdOrder.id),
            customerName: counterCustomerName.trim(),
          }),
        });
        if (!customerNameRes.ok) {
          throw new Error("terminal_customer_name_update_failed");
        }
        orderCustomerName = counterCustomerName.trim();
      }
      const kioskOrder = buildLocalCreatedOrder({
        createdOrder,
        cart,
        removedByItemId,
        effectiveDelivery: "retirada",
        customerName: orderCustomerName,
        phone,
        address,
        total,
        overrides: {
          ...couponOrderFields,
          channel: "KIOSK",
          deliveryType: "retirada",
          paymentMethod: counterServiceMode
            ? selectedCounterPayment === "DEBIT"
              ? "debito"
              : selectedCounterPayment === "CREDIT"
                ? "credito"
                : "pix"
            : payment === "presencial"
              ? "presencial"
              : "pix",
          paymentStatus: counterServiceMode
            ? "approved"
            : String(createdOrder.paymentStatus ?? "approved"),
          paymentProvider:
            counterServiceMode
              ? "PPC930_SITEF"
              : undefined,
          paymentId: terminalPayment?.paymentId,
          status: counterServiceMode
            ? "PAID"
            : String(createdOrder.status ?? "PAID") === "PAYMENT_PENDING"
              ? "PAYMENT_PENDING"
              : "PAID",
        },
      });

      if (slowTimer) window.clearTimeout(slowTimer);
      setPaymentSlow(false);
      setPaying(false);
      if (waitForKioskSuccessConfirm) {
        await waitForKioskSuccessConfirm(kioskOrder);
      } else {
        setKioskSuccessOrder?.(kioskOrder);
        setKioskSuccessOpen(true);
      }
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
      const presencialOrder = buildLocalCreatedOrder({
        createdOrder,
        cart,
        removedByItemId,
        effectiveDelivery,
        customerName,
        phone,
        address,
        total,
        overrides: {
          ...couponOrderFields,
          channel: effectiveDelivery === "retirada" ? "KIOSK" : "DELIVERY",
          paymentMethod: "presencial",
          paymentStatus: "awaiting_counter",
          status: "PAID",
        },
      });
      sendWhatsappReceipt(presencialOrder);
      await onPlaceOrder(effectiveDelivery, phone || undefined, address, removedByItemId, presencialOrder);
      return;
    }
    if (payment === "pagar_na_entrega") {
      const payOnDeliveryOrder = buildLocalCreatedOrder({
        createdOrder,
        cart,
        removedByItemId,
        effectiveDelivery,
        customerName,
        phone,
        address,
        total,
        overrides: {
          ...couponOrderFields,
          channel: "DELIVERY",
          paymentMethod: "pagar_na_entrega",
          paymentStatus: "awaiting_delivery",
          status: "PAID",
        },
      });
      sendWhatsappReceipt(payOnDeliveryOrder);
      await onPlaceOrder(effectiveDelivery, phone || undefined, address, removedByItemId, payOnDeliveryOrder);
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
          ...couponOrderFields,
          channel: "DELIVERY",
          paymentMethod: "whatsapp",
          paymentStatus: "awaiting_whatsapp",
          status: "PAYMENT_PENDING",
        },
      });
      if (isMobileWhatsappTarget()) {
        await onPlaceOrder(effectiveDelivery, phone || undefined, address, removedByItemId, whatsappOrder);
        sendWhatsappReceipt(whatsappOrder, { sameTabOnMobile: true });
        return;
      }
      sendWhatsappReceipt(whatsappOrder);
      await onPlaceOrder(effectiveDelivery, phone || undefined, address, removedByItemId, whatsappOrder);
      return;
    }

    if (payment === "pix") {
      const pixOrder = buildLocalCreatedOrder({
        createdOrder,
        cart,
        removedByItemId,
        effectiveDelivery,
        customerName,
        phone,
        address,
        total,
        overrides: {
          ...couponOrderFields,
          channel: "DELIVERY",
          paymentProvider: "menfis_pix",
          paymentMethod: "pix",
          paymentStatus: "awaiting_direct_pix",
          pixQrCode: KIOSK_PIX_CODE,
          status: "PAYMENT_PENDING",
        },
      });
      sendWhatsappReceipt(pixOrder);
      await onPlaceOrder(
        effectiveDelivery,
        phone || undefined,
        address,
        removedByItemId,
        pixOrder,
      );
      return;
    }

    const paymentRes = await fetch(`${API_URL}/payments/pix`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...createdOrderAccessHeaders },
      body: JSON.stringify({ orderId: createdOrder.id }),
    });

    const data = await paymentRes.json().catch(() => ({}));
    if (
      payment === "pix_qrcode" &&
      (data?.qrCode || data?.qrCodeBase64 || data?.ticketUrl)
    ) {
      const pixQrCodeOrder = buildLocalCreatedOrder({
        createdOrder,
        cart,
        removedByItemId,
        effectiveDelivery,
        customerName,
        phone,
        address,
        total,
        overrides: {
          ...couponOrderFields,
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
      });
      sendWhatsappReceipt(pixQrCodeOrder);
      await onPlaceOrder(
        effectiveDelivery,
        phone || undefined,
        address,
        removedByItemId,
        pixQrCodeOrder,
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
      const pendingOrder = buildPendingCreatedOrder({
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
        couponOrderFields,
      });
      sendWhatsappReceipt(pendingOrder);
      await onPlaceOrder(
        effectiveDelivery,
        phone || undefined,
        address,
        removedByItemId,
        pendingOrder,
      );
      return;
    }

    sendWhatsappReceipt(
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
        couponOrderFields,
      }),
    );
    localStorage.setItem("menfis_pending_order_id", String(createdOrder.id));
    window.location.assign(checkoutUrl);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (reason.includes("restaurant_closed")) {
      onRestaurantClosed?.();
      return;
    }
    if (counterServiceMode && reason.includes("terminal_payment_cancelled")) {
      setPaymentError("");
      setTerminalPaymentProgress?.({
        status: "CANCELLED",
        message: "Operação cancelada",
        startedAt: Date.now() - 60_000,
        stageStartedAt: Date.now() - 60_000,
      });
      await wait(1800);
      onTerminalCancelled?.();
      return;
    }
    setPaymentError(
      reason.includes("api_url_missing")
        ? "Backend não configurado no kiosk. Defina NEXT_PUBLIC_API_URL apontando para o backend conectado ao Neon."
        : reason.includes("customer_session_required")
          ? "Entre ou crie seu perfil Menfi's para finalizar o pedido."
        : reason.includes("MERCADO_PAGO_ACCESS_TOKEN")
          ? "Pagamento indisponível: falta configurar a credencial do Mercado Pago."
          : reason.includes("order_creation_failed")
            ? "Não foi possível registrar o pedido. Confira os dados de entrega e tente novamente."
            : counterServiceMode
              ? reason.includes("terminal_payment_declined")
                ? "Pagamento recusado. Tente outro cartão ou forma de pagamento."
                : reason.includes("terminal_payment_cancelled")
                  ? "Pagamento cancelado na maquininha."
                  : reason.includes("terminal_payment_timeout")
                    ? "Tempo esgotado na maquininha. Nenhuma aprovação foi registrada."
                    : reason.includes("terminal_payment_terminal_disconnected")
                      ? "Maquininha desconectada. Verifique o PPC-930 e tente novamente."
                      : reason.includes("terminal_payment")
                        ? "Não foi possível concluir na maquininha. Verifique o terminal e tente novamente."
                        : "Não foi possível registrar o pedido no balcão. Tente novamente."
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
    setTerminalPaymentProgress?.(null);
  }
}

function sendWhatsappReceipt(
  order: Order,
  options?: { sameTabOnMobile?: boolean },
) {
  const text = buildOrderWhatsappReceipt(order);
  const url = buildWhatsappUrl(text);
  if (options?.sameTabOnMobile && isMobileWhatsappTarget()) {
    window.location.assign(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

function isMobileWhatsappTarget() {
  return (
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  );
}

function buildWhatsappUrl(text: string) {
  const encoded = encodeURIComponent(text);
  const phone = SUPPORT_WHATSAPP_URL.replace(/\D/g, "");

  if (isMobileWhatsappTarget()) {
    return `${SUPPORT_WHATSAPP_URL}?text=${encoded}`;
  }
  return `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`;
}
