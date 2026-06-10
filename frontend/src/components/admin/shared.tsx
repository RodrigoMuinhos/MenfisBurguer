import type { ElementType } from "react";
import { deliveryConfirmationCode } from "@/components/order/tracking";
import {
  Bike,
  CheckCircle2,
  ChefHat,
  Clock,
  Package,
  X,
} from "lucide-react";
import { Order, OrderStatus } from "@/types/order";
import { VERDE } from "@/utils/theme";
export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
export const COUPON_STORAGE_KEY = "menfis_coupons";

export type Coupon = {
  code: string;
  label: string;
  type: "percent" | "fixed_total";
  value: number;
  active: boolean;
};

export const DEFAULT_COUPONS: Coupon[] = [];

export type SupportTicket = {
  id: string;
  orderId: string;
  orderStatus: string;
  type: string;
  reason: string;
  message?: string;
  customerPhone?: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
};

export const STAGE_ORDER: OrderStatus[] = [
  "PAYMENT_PENDING",
  "PAID",
  "IN_PREPARATION",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const STAGE_LABEL: Record<OrderStatus, string> = {
  CREATED: "Criado",
  PAYMENT_PENDING: "Aguardando Pagamento",
  PAID: "Pedidos Aceitos",
  IN_PREPARATION: "Em Preparo",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu para Entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

export const STAGE_COLOR: Record<
  OrderStatus,
  { bg: string; text: string; border: string; accent: string }
> = {
  CREATED: {
    bg: "#F3F4F6",
    text: "#4B5563",
    border: "#E5E7EB",
    accent: "#6B7280",
  },
  PAYMENT_PENDING: {
    bg: "#FFFBEB",
    text: "#92400E",
    border: "#FDE68A",
    accent: "#F59E0B",
  },
  PAID: {
    bg: "#FFFBEB",
    text: "#92400E",
    border: "#FDE68A",
    accent: "#F59E0B",
  },
  IN_PREPARATION: {
    bg: "#EFF6FF",
    text: "#1D4ED8",
    border: "#BFDBFE",
    accent: "#3B82F6",
  },
  READY: {
    bg: "#ECFDF5",
    text: "#065F46",
    border: "#6EE7B7",
    accent: "#10B981",
  },
  OUT_FOR_DELIVERY: {
    bg: "#F5F3FF",
    text: "#5B21B6",
    border: "#DDD6FE",
    accent: "#7C3AED",
  },
  DELIVERED: {
    bg: `${VERDE}10`,
    text: VERDE,
    border: `${VERDE}30`,
    accent: VERDE,
  },
  CANCELLED: {
    bg: "#F3F4F6",
    text: "#4B5563",
    border: "#E5E7EB",
    accent: "#6B7280",
  },
};

export const STAGE_ICON: Record<OrderStatus, ElementType> = {
  CREATED: Clock,
  PAYMENT_PENDING: Clock,
  PAID: Clock,
  IN_PREPARATION: ChefHat,
  READY: CheckCircle2,
  OUT_FOR_DELIVERY: Bike,
  DELIVERED: Package,
  CANCELLED: X,
};

export const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function paymentMethodLabel(order: Order) {
  const method = String(order.paymentMethod ?? "").toLowerCase();
  const provider = String(order.paymentProvider ?? "").toLowerCase();
  const mercadoPago =
    provider === "mercado_pago" ||
    provider === "mercado pago" ||
    ["pix", "cartao", "credito", "debito", "credit_card", "debit_card"].includes(method);

  if (method === "pix") return mercadoPago ? "PIX Mercado Pago" : "PIX";
  if (method === "credit_card" || method === "credito")
    return "Cartão de Crédito Mercado Pago";
  if (method === "debit_card" || method === "debito")
    return "Cartão de Débito Mercado Pago";
  if (method === "cartao") return "Cartão Mercado Pago";
  if (method === "presencial") return "Pagamento Presencial com Atendente";
  if (method === "pagar_na_entrega") return "Pagamento Presencial com Atendente";
  if (method === "whatsapp") return "Pagamento Presencial com Atendente";
  if (method === "dinheiro") return "Pagamento Presencial com Atendente";
  return "Pagamento Presencial com Atendente";
}

export function paymentStatusLabel(order: Order) {
  const status = String(order.paymentStatus ?? "").toLowerCase();
  if (
    status === "approved" ||
    status === "paid" ||
    status === "accredited" ||
    (order.status !== "PAYMENT_PENDING" &&
      ["presencial", "pagar_na_entrega", "whatsapp", "dinheiro"].includes(
        String(order.paymentMethod ?? "").toLowerCase(),
      ))
  ) {
    return "Pago";
  }
  if (
    status === "cancelled" ||
    status === "canceled" ||
    status === "cancelado" ||
    order.status === "CANCELLED"
  ) {
    return "Cancelado";
  }
  if (
    status === "refunded" ||
    status === "charged_back" ||
    status === "estornado"
  ) {
    return "Estornado";
  }
  return "Aguardando Pagamento";
}

export function playAdminPaymentAlert() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 1040;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
    oscillator.addEventListener("ended", () => context.close());
  } catch {
    // O alerta visual continua disponível se o navegador bloquear áudio.
  }
}

export function paymentBadge(order: Order) {
  const label = paymentStatusLabel(order);
  if (label === "Pago") {
    return {
      label,
      bg: "#ECFDF5",
      text: "#065F46",
      border: "#6EE7B7",
    };
  }
  if (label === "Cancelado" || label === "Estornado") {
    return {
      label,
      bg: "#FEF2F2",
      text: "#991B1B",
      border: "#FECACA",
    };
  }
  return {
    label,
    bg: "#FFFBEB",
    text: "#92400E",
    border: "#FDE68A",
  };
}

export function canAdvanceOrder(order: Order) {
  if (
    order.status === "PAYMENT_PENDING" &&
    String(order.paymentStatus ?? "").toLowerCase() === "approved"
  ) {
    return true;
  }
  return (
    order.paymentProvider !== "mercado_pago" ||
    order.paymentStatus === "approved" ||
    order.status !== "PAID"
  );
}

export function elapsed(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}min`;
}

export function customerWhatsappUrl(order: Order) {
  const phone = order.customerPhone?.replace(/\D/g, "") ?? "";
  if (!phone) return "";
  const normalized = phone.startsWith("55") ? phone : `55${phone}`;
  const items = order.items
    .map((item) => `${item.qty}x ${item.name} - ${fmt(item.price * item.qty)}`)
    .join("\n");
  const message = encodeURIComponent(
    `MENFI'S BURGER\n` +
      `VIA DO PEDIDO\n\n` +
      `${order.id}\n` +
      `${order.deliveryType === "delivery" ? "ENTREGA" : "RETIRADA"}\n\n` +
      `Data: ${new Date(order.timestamp).toLocaleString("pt-BR")}\n` +
      `Cliente: ${order.customerName || "Não informado"}\n` +
      `Telefone: ${order.customerPhone || "Não informado"}\n` +
      `Endereço: ${order.customerAddress || "Não informado"}\n\n` +
      `ITENS DO PEDIDO\n${items}\n\n` +
      `Forma de pagamento: ${paymentMethodLabel(order)}\n` +
      `Status do pagamento: ${paymentStatusLabel(order)}\n` +
      `TOTAL: ${fmt(order.total)}\n\n` +
      `Pedido confirmado. Quando estiver pronto, avisaremos por aqui.`,
  );
  return `https://wa.me/${normalized}?text=${message}`;
}

export function orderReadyWhatsappUrl(order: Order) {
  const phone = order.customerPhone?.replace(/\D/g, "") ?? "";
  if (!phone) return "";
  const normalized = phone.startsWith("55") ? phone : `55${phone}`;
  const message = encodeURIComponent(
    `Olá, ${order.customerName || "cliente"}! ` +
      `Seu pedido ${order.id} da Menfi's Burger está pronto. ` +
      `Código de entrega/retirada: ${deliveryConfirmationCode(order)}. ` +
      `${order.deliveryType === "delivery" ? "Nossa equipe dará sequência à entrega." : "Pode retirar no balcão."} ` +
      `Obrigado pela preferência!`,
  );
  return `https://wa.me/${normalized}?text=${message}`;
}

export function escapeReceipt(value?: string) {
  return (value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function printOrderReceipts(order: Order) {
  const items = order.items
    .map(
      (item) =>
        `<div class="row"><b>${item.qty}x ${escapeReceipt(item.name)}</b><span>${fmt(item.price * item.qty)}</span></div>`,
    )
    .join("");
  const removed = Object.entries(order.removedByItemId ?? {})
    .flatMap(([, values]) => values)
    .filter((value, index, values) => values.indexOf(value) === index);
  const receipt = `
    <section class="receipt">
      <div class="center small">MENFI'S BURGER</div>
      <div class="center"><strong>VIA DO PEDIDO</strong></div>
      <div class="number">${escapeReceipt(order.id)}</div>
      <div class="center"><strong>CODIGO: ${escapeReceipt(deliveryConfirmationCode(order))}</strong></div>
      <div class="center">${order.deliveryType === "delivery" ? "ENTREGA" : "RETIRADA"}</div>
      <hr />
      <div>Data: ${new Date(order.timestamp).toLocaleString("pt-BR")}</div>
      <div>Cliente: ${escapeReceipt(order.customerName || "Não informado")}</div>
      <div>Telefone: ${escapeReceipt(order.customerPhone || "Não informado")}</div>
      <div>Endereço: ${escapeReceipt(order.customerAddress || "Não informado")}</div>
      <hr />
      <strong>ITENS DO PEDIDO</strong>
      ${items}
      ${removed.length ? `<div class="alert">RETIRAR: ${escapeReceipt(removed.join(", "))}</div>` : ""}
      <hr />
      <div>Forma de pagamento: ${escapeReceipt(paymentMethodLabel(order))}</div>
      <div>Status do pagamento: ${escapeReceipt(paymentStatusLabel(order))}</div>
      <div class="row total"><strong>TOTAL</strong><strong>${fmt(order.total)}</strong></div>
      <hr />
      <div class="center small">Obrigado pela preferência!</div>
    </section>`;
  const html = `
    <!doctype html><html><head><title>${escapeReceipt(order.id)} - via</title>
    <style>
      @page { size: 80mm auto; margin: 0; }
      * { box-sizing: border-box; }
      body { width: 76mm; margin: 0; padding: 2mm; font-family: "Courier New", ui-monospace, monospace; color: #000; font-weight: 700; }
      .receipt { width: 72mm; padding: 2mm; border: 0.7mm solid #000; font-size: 13px; line-height: 1.35; }
      .center { text-align: center; } .small { font-size: 13px; }
      .number { margin: 4mm 0 3mm; padding: 2mm 1mm; text-align: center; font-size: 34px; font-weight: 900; border: 0.9mm solid #000; letter-spacing: 0.08em; }
      .row { display: flex; justify-content: space-between; gap: 3mm; margin: 2mm 0; border-bottom: 0.3mm solid #000; padding-bottom: 1.5mm; }
      .row span:first-child { max-width: 48mm; overflow-wrap: anywhere; }
      .row span:last-child { white-space: nowrap; }
      .total { margin-top: 3mm; padding: 2mm 0; border-top: 0.9mm solid #000; border-bottom: 0.9mm solid #000; font-size: 18px; }
      .alert { margin: 2mm 0; padding: 1.5mm; border: 0.6mm solid #000; font-weight: 900; }
      hr { border: 0; border-top: 0.5mm dashed #000; margin: 2.5mm 0; }
      strong { font-weight: 900; }
    </style></head><body>${receipt}
    <script>window.onload=()=>{window.print();}<\/script></body></html>
  `;
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  window.setTimeout(() => iframe.remove(), 5000);
}

export function loadStoredCoupons(): Coupon[] {
  try {
    const stored = JSON.parse(localStorage.getItem(COUPON_STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function mergeCoupons(customCoupons: Coupon[]) {
  const byCode = new Map<string, Coupon>();
  DEFAULT_COUPONS.forEach((coupon) => {
    byCode.set(coupon.code.toLowerCase(), coupon);
  });
  customCoupons.forEach((coupon) => {
    byCode.set(coupon.code.toLowerCase(), coupon);
  });
  return [...byCode.values()];
}

export function couponLabel(type: Coupon["type"], value: number) {
  return type === "percent"
    ? `${value}% de desconto`
    : `Pedido por ${fmt(value)}`;
}

/* ─── Menu → Estoque recipe map ──────────────────────── */
// Each cart item ID maps to the stock ingredients it consumes (per unit sold)
export const MENU_STOCK_MAP: Record<
  string,
  Array<{ stockId: string; qty: number }>
> = {
  burger: [
    { stockId: "1", qty: 1 }, // Pão Brioche
    { stockId: "2", qty: 0.1 }, // Carne 70/30
    { stockId: "3", qty: 0.5 }, // Alface
    { stockId: "4", qty: 1 }, // Queijo Coelho
    { stockId: "7", qty: 30 }, // Molho Menfi's
  ],
  "menfis-bacon": [
    { stockId: "1", qty: 1 },
    { stockId: "2", qty: 0.1 },
    { stockId: "3", qty: 0.5 },
    { stockId: "4", qty: 1 },
    { stockId: "7", qty: 30 },
    { stockId: "9", qty: 40 },
  ],
  "menfis-chicken": [
    { stockId: "1", qty: 1 },
    { stockId: "8", qty: 1 },
    { stockId: "3", qty: 0.5 },
    { stockId: "4", qty: 1 },
    { stockId: "7", qty: 30 },
  ],
  "double-menfis-bacon": [
    { stockId: "1", qty: 1 },
    { stockId: "2", qty: 0.2 },
    { stockId: "3", qty: 0.5 },
    { stockId: "4", qty: 2 },
    { stockId: "7", qty: 30 },
    { stockId: "9", qty: 40 },
  ],
  "double-menfis-chicken": [
    { stockId: "1", qty: 1 },
    { stockId: "8", qty: 2 },
    { stockId: "3", qty: 0.5 },
    { stockId: "4", qty: 2 },
    { stockId: "7", qty: 30 },
  ],
  combo: [
    { stockId: "1", qty: 1 },
    { stockId: "2", qty: 0.1 },
    { stockId: "3", qty: 0.5 },
    { stockId: "4", qty: 1 },
    { stockId: "7", qty: 30 },
    { stockId: "5", qty: 1 }, // Coca-Cola
    { stockId: "6", qty: 0.25 }, // Batata Frita
  ],
  "bacon-combo": [
    { stockId: "1", qty: 1 },
    { stockId: "2", qty: 0.1 },
    { stockId: "3", qty: 0.5 },
    { stockId: "4", qty: 1 },
    { stockId: "7", qty: 30 },
    { stockId: "9", qty: 40 },
    { stockId: "5", qty: 1 },
    { stockId: "6", qty: 0.25 },
  ],
  "chicken-combo": [
    { stockId: "1", qty: 1 },
    { stockId: "8", qty: 1 },
    { stockId: "3", qty: 0.5 },
    { stockId: "4", qty: 1 },
    { stockId: "7", qty: 30 },
    { stockId: "5", qty: 1 },
    { stockId: "6", qty: 0.25 },
  ],
  "double-bacon-combo": [
    { stockId: "1", qty: 1 },
    { stockId: "2", qty: 0.2 },
    { stockId: "3", qty: 0.5 },
    { stockId: "4", qty: 2 },
    { stockId: "7", qty: 30 },
    { stockId: "9", qty: 40 },
    { stockId: "5", qty: 1 },
    { stockId: "6", qty: 0.25 },
  ],
  "double-chicken-combo": [
    { stockId: "1", qty: 1 },
    { stockId: "8", qty: 2 },
    { stockId: "3", qty: 0.5 },
    { stockId: "4", qty: 2 },
    { stockId: "7", qty: 30 },
    { stockId: "5", qty: 1 },
    { stockId: "6", qty: 0.25 },
  ],
  combo2: [
    { stockId: "1", qty: 2 },
    { stockId: "2", qty: 0.2 },
    { stockId: "3", qty: 1 },
    { stockId: "4", qty: 2 },
    { stockId: "7", qty: 60 },
    { stockId: "5", qty: 2 },
    { stockId: "6", qty: 0.25 },
  ],
  "bacon-super-combo": [
    { stockId: "1", qty: 2 },
    { stockId: "2", qty: 0.2 },
    { stockId: "3", qty: 1 },
    { stockId: "4", qty: 2 },
    { stockId: "7", qty: 60 },
    { stockId: "9", qty: 80 },
    { stockId: "5", qty: 2 },
    { stockId: "6", qty: 0.25 },
  ],
  "chicken-super-combo": [
    { stockId: "1", qty: 2 },
    { stockId: "8", qty: 2 },
    { stockId: "3", qty: 1 },
    { stockId: "4", qty: 2 },
    { stockId: "7", qty: 60 },
    { stockId: "5", qty: 2 },
    { stockId: "6", qty: 0.25 },
  ],
  batata: [{ stockId: "6", qty: 0.25 }],
  cola: [{ stockId: "5", qty: 1 }],
  "extra-carne": [{ stockId: "2", qty: 0.1 }],
  "extra-frango": [{ stockId: "8", qty: 1 }],
  "extra-bacon": [{ stockId: "9", qty: 40 }],
  "extra-cheddar": [{ stockId: "10", qty: 30 }],
  "extra-queijo": [{ stockId: "4", qty: 1 }],
  "extra-bebida": [{ stockId: "5", qty: 1 }],
  "extra-molho": [{ stockId: "7", qty: 20 }],
};

