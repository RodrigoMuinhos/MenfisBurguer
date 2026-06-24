import type { ElementType } from "react";
import { deliveryConfirmationCode, scheduledOrderInfo } from "@/components/order/tracking";
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
import { formatAddressForReceipt, googleMapsDirectionsUrl } from "@/utils/address";
export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
export const COUPON_STORAGE_KEY = "menfis_coupons";

export type Coupon = {
  code: string;
  label: string;
  type: "percent" | "fixed_total";
  value: number;
  active: boolean;
  maxUsesPerDay?: number;
  maxUsesTotal?: number;
  startsAt?: string;
  endsAt?: string;
  productIds?: string[];
  oncePerCustomer?: boolean;
  blockSamePhone?: boolean;
};

export const DEFAULT_COUPONS: Coupon[] = [
  {
    code: "MFB10",
    label: "10% de desconto na primeira compra",
    type: "percent",
    value: 10,
    active: true,
    maxUsesPerDay: 0,
    maxUsesTotal: 0,
    productIds: [],
    oncePerCustomer: true,
    blockSamePhone: true,
  },
];

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
  "PAYMENT_PROOF_PENDING",
  "PAID",
  "ACCEPTED",
  "IN_PREPARATION",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const STAGE_LABEL: Record<OrderStatus, string> = {
  CREATED: "Criado",
  PAYMENT_PENDING: "Aguardando Pagamento",
  PAYMENT_PROOF_PENDING: "Aguardando aprovação do comprovante",
  PAID: "Pedido Recebido",
  ACCEPTED: "Pedido Aceito",
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
  PAYMENT_PROOF_PENDING: {
    bg: "#FFF1F2",
    text: "#9F1239",
    border: "#FDA4AF",
    accent: "#E11D48",
  },
  ACCEPTED: {
    bg: "#FFF1F2",
    text: "#9F1239",
    border: "#FDA4AF",
    accent: "#E11D48",
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
  PAYMENT_PROOF_PENDING: Clock,
  PAID: Clock,
  ACCEPTED: CheckCircle2,
  IN_PREPARATION: ChefHat,
  READY: CheckCircle2,
  OUT_FOR_DELIVERY: Bike,
  DELIVERED: Package,
  CANCELLED: X,
};

export const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

export function isKioskMobOrder(order?: Order | null) {
  return String(order?.customerName ?? "").trim().toUpperCase().replace(/_/g, "-") === "KIOSK-MOB";
}

export function isBillableOrder(order: Order) {
  return order.status !== "CANCELLED";
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function localDateKey(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function paymentMethodLabel(order: Order) {
  const method = String(order.paymentMethod ?? "").toLowerCase();
  const provider = String(order.paymentProvider ?? "").toLowerCase();
  const mercadoPago =
    provider === "mercado_pago" ||
    provider === "mercado pago" ||
    ["pix", "cartao", "credito", "debito", "credit_card", "debit_card"].includes(method);

  if (isKioskMobOrder(order) && method === "presencial") return "Pagamento no Balcão";
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
      `Endereço: ${formatAddressForReceipt(order.customerAddress || "Não informado")}\n\n` +
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

const DEFAULT_COMPOSITION: Record<string, string[]> = {
  combo: ["Menfi's Burger", "Coca-Cola 350ml", "Batata Frita 100g"],
  "double-combo": ["Double Menfi's", "Coca-Cola 350ml", "Batata Frita 100g"],
  combo2: ["2x Menfi's Burger", "2 bebidas", "Batata Frita 200g"],
  "bacon-combo": ["Menfi's Bacon", "Coca-Cola 350ml", "Batata Frita 100g"],
  "double-bacon-combo": ["Double Menfi's Bacon", "Coca-Cola 350ml", "Batata Frita 100g"],
  "bacon-super-combo": ["2x Menfi's Bacon", "2 bebidas", "Batata Frita 200g"],
  "chicken-combo": ["Menfi's Chicken", "Coca-Cola 350ml", "Batata Frita 100g"],
  "double-chicken-combo": ["Double Menfi's Chicken", "Coca-Cola 350ml", "Batata Frita 100g"],
  "chicken-super-combo": ["2x Menfi's Chicken", "2 bebidas", "Batata Frita 200g"],
};

export function orderStageLabel(order: Order) {
  if (scheduledOrderInfo(order) && ["PAYMENT_PENDING", "PAID"].includes(order.status)) {
    return "Pedido Agendado";
  }
  return STAGE_LABEL[order.status] ?? order.status;
}

export function orderItemComponents(item: Order["items"][number]) {
  if (item.components?.length) return item.components;
  return DEFAULT_COMPOSITION[item.productId ?? item.id] ?? [];
}

export function orderItemNote(item: Order["items"][number]) {
  return item.note?.trim() || "";
}

function receiptItemHtml(item: Order["items"][number]) {
  const components = orderItemComponents(item);
  const note = orderItemNote(item);
  return `
    <div class="item">
      <div class="row"><b>${item.qty}x ${escapeReceipt(item.name)}</b><span>${fmt(item.price * item.qty)}</span></div>
      ${components.length ? `<div class="components">${components.map((component) => `<div>* ${escapeReceipt(component)}</div>`).join("")}</div>` : ""}
      ${note ? `<div class="note"><b>Obs:</b> ${escapeReceipt(note)}</div>` : ""}
    </div>`;
}

export function buildOrderTxt(order: Order) {
  const financials = receiptFinancials(order);
  const createdAt = new Date(order.timestamp);
  const removed = Object.entries(order.removedByItemId ?? {})
    .flatMap(([, values]) => values)
    .filter((value, index, values) => values.indexOf(value) === index);
  const lines = [
    "MENFI'S BURGER",
    "NOTA DO PEDIDO",
    "========================================",
    "",
    `Pedido: ${order.id}`,
    `Numero: ${order.number}`,
    `Codigo: ${deliveryConfirmationCode(order)}`,
    `Tipo: ${receiptType(order)}`,
    `Data: ${createdAt.toLocaleDateString("pt-BR")}`,
    `Hora: ${createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    "",
    `Cliente: ${order.customerName || "Não informado"}`,
    `Telefone: ${order.customerPhone || "Não informado"}`,
    `Endereco: ${formatAddressForReceipt(order.customerAddress || "Não informado")}`,
    "",
    `Forma de pagamento: ${paymentMethodLabel(order)}`,
    `Status do pagamento: ${paymentStatusLabel(order)}`,
    order.couponCode && financials.discount > 0
      ? `Cupom: ${order.couponCode} usado (-${fmt(financials.discount)})`
      : "Cupom: não usado",
    `Status do pedido: ${STAGE_LABEL[order.status] ?? order.status}`,
    "",
    "ITENS DO PEDIDO",
    "----------------------------------------",
    "",
  ];
  order.items.forEach((item) => {
    lines.push(`${item.qty}x ${item.name}`);
    lines.push(`Unitario: ${fmt(item.price)}`);
    lines.push(`Total do item: ${fmt(item.price * item.qty)}`);
    orderItemComponents(item).forEach((component) => lines.push(`* ${component}`));
    if (orderItemNote(item)) {
      lines.push("Observacao:", orderItemNote(item));
    }
    lines.push("----------------------------------------");
  });
  if (removed.length) {
    lines.push("", `Retirar: ${removed.join(", ")}`, "");
  }
  lines.push(
    "",
    "RESUMO FINANCEIRO",
    "----------------------------------------",
    `Subtotal dos itens: ${fmt(financials.itemsSubtotal)}`,
    `Taxa de entrega: ${fmt(financials.deliveryFee)}`,
    `Taxa de servico: ${fmt(financials.serviceFee)}`,
    `Desconto: -${fmt(financials.discount)}`,
    "----------------------------------------",
    `TOTAL FINAL: ${fmt(financials.total)}`,
    "",
    "CONFERENCIA",
    `Itens + entrega + servico - desconto = ${fmt(financials.total)}`,
    "",
    "MENFI'S BURGER",
  );
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

function txtFilename(order: Order) {
  const id = String(order.id || order.number || "pedido")
    .replace(/^#/, "")
    .replace(/[^A-Za-z0-9_-]/g, "");
  return `pedido-${id || "menfis"}.txt`;
}

export async function copyOrderTxt(order: Order) {
  const text = buildOrderTxt(order);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = txtFilename(order);
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
    return false;
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
}

const LINE_WIDTH = 23;

function receiptText(value: string) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[^\S\r\n]+/g, " ")
    .trim();
}

function line(char = "-") {
  return char.repeat(LINE_WIDTH);
}

function center(text: string) {
  const clean = receiptText(text);
  if (clean.length >= LINE_WIDTH) return clean.slice(0, LINE_WIDTH);
  const left = Math.floor((LINE_WIDTH - clean.length) / 2);
  return " ".repeat(left) + clean;
}

function money(value: number) {
  return Number(value || 0)
    .toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
    .replace(/\u00a0/g, " ");
}

function leftRight(left: string, right: string) {
  const cleanLeft = receiptText(left);
  const cleanRight = receiptText(right);
  const space = LINE_WIDTH - cleanLeft.length - cleanRight.length;
  if (space >= 1) {
    return cleanLeft + " ".repeat(space) + cleanRight;
  }
  const maxLeft = Math.max(0, LINE_WIDTH - cleanRight.length - 1);
  return (cleanLeft.slice(0, maxLeft) + " " + cleanRight).slice(0, LINE_WIDTH);
}

function wrap(text: string, max = LINE_WIDTH) {
  const words = receiptText(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > max) {
      if (current) {
        lines.push(current.slice(0, max));
        current = "";
      }
      for (let index = 0; index < word.length; index += max) {
        lines.push(word.slice(index, index + max));
      }
      continue;
    }
    if ((current + " " + word).trim().length <= max) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current.slice(0, max));
      current = word;
    }
  }

  if (current) lines.push(current.slice(0, max));
  return lines;
}

function wrapIndented(text: string, indent = 0) {
  const prefix = " ".repeat(indent);
  return wrap(text, LINE_WIDTH - indent).map((value) => (prefix + value).slice(0, LINE_WIDTH));
}

function itemLine(quantity: number, name: string, price: number) {
  const left = `${quantity}x ${receiptText(name)}`;
  const right = money(price);
  if (left.length + 1 + right.length <= LINE_WIDTH) {
    return [leftRight(left, right)];
  }
  return [...wrap(left, LINE_WIDTH), right.padStart(LINE_WIDTH).slice(0, LINE_WIDTH)];
}

function receiptFinancials(order: Order) {
  const itemsSubtotal = Number(
    order.subtotal ?? order.items.reduce((sum, item) => sum + item.price * item.qty, 0),
  );
  const deliveryFee = Number(order.deliveryFee ?? 0);
  const discount = Number(order.discountTotal ?? 0);
  const serviceFee = Math.max(
    0,
    Math.round((Number(order.total ?? 0) + discount - itemsSubtotal - deliveryFee) * 100) / 100,
  );
  return { itemsSubtotal, deliveryFee, serviceFee, discount, total: Number(order.total ?? 0) };
}

function receiptType(order: Order) {
  if (isKioskMobOrder(order)) return "BALCAO";
  return order.deliveryType === "delivery" ? "ENTREGA" : "RETIRADA";
}

export function generateCustomerReceipt(order: Order) {
  const lines: string[] = [];
  const financials = receiptFinancials(order);
  const pushWrapped = (value: string, indent = 0) => lines.push(...wrapIndented(value, indent));
  const customerName = receiptText(order.customerName || "Nao informado").toUpperCase();
  const customerAddress = formatAddressForReceipt(order.customerAddress || "Nao informado").toUpperCase();

  lines.push(center("MENFI'S BURGER"));
  lines.push(center("NOTA DO PEDIDO"));
  lines.push(line());
  lines.push(leftRight(receiptType(order), deliveryConfirmationCode(order)));
  lines.push(new Date(order.timestamp).toLocaleString("pt-BR"));
  lines.push(line("="));
  lines.push("CLIENTE");
  pushWrapped(customerName);
  if (order.customerPhone) pushWrapped(`TEL ${order.customerPhone}`);
  lines.push(line("="));
  lines.push("ENDERECO");
  customerAddress.split("\n").forEach((addressLine) => pushWrapped(addressLine));
  lines.push(line());
  lines.push("ITENS");

  order.items.forEach((item) => {
    lines.push(...itemLine(item.qty, item.name, item.price * item.qty));
    orderItemComponents(item).forEach((component) => pushWrapped(`- ${component}`, 2));
    const note = orderItemNote(item);
    if (note) pushWrapped(`Obs: ${note}`, 2);
    lines.push("");
  });

  const removed = Object.entries(order.removedByItemId ?? {})
    .flatMap(([, values]) => values)
    .filter((value, index, values) => values.indexOf(value) === index);
  if (removed.length) {
    pushWrapped(`RETIRAR: ${removed.join(", ")}`);
    lines.push("");
  }

  lines.push(line());
  lines.push("RESUMO");
  lines.push(leftRight("Subtotal itens:", money(financials.itemsSubtotal)));
  lines.push(leftRight("Taxa entrega:", money(financials.deliveryFee)));
  if (financials.serviceFee > 0) lines.push(leftRight("Taxa servico:", money(financials.serviceFee)));
  if (order.couponCode && financials.discount > 0) {
    pushWrapped(`Cupom usado: ${order.couponCode}`);
  } else {
    pushWrapped("Cupom: nao usado");
  }
  if (financials.discount > 0) lines.push(leftRight("Desconto:", `-${money(financials.discount)}`));
  lines.push(line());
  lines.push(leftRight("TOTAL:", money(financials.total)));
  lines.push(line());
  pushWrapped(`Pagto: ${paymentMethodLabel(order)}`);
  pushWrapped(`Status: ${paymentStatusLabel(order)}`);
  lines.push(line());
  lines.push(center("Menfi's Burger"));

  const receipt = lines.map((value) => value.slice(0, LINE_WIDTH)).join("\n").replace(/\n{3,}/g, "\n\n");
  for (const receiptLine of receipt.split("\n")) {
    if (receiptLine.length > LINE_WIDTH) {
      console.warn(`Linha excedeu ${LINE_WIDTH} caracteres:`, receiptLine);
    }
  }
  return receipt;
}

export function printOrderReceipts(order: Order, options?: { confirm?: boolean }) {
  if (options?.confirm !== false && !window.confirm("Imprimir via do cliente agora?")) return;

  const receipt = escapeReceipt(generateCustomerReceipt(order));
  const orderId = escapeReceipt(String(order.id || order.number || ""));
  const routeUrl = googleMapsDirectionsUrl(order.customerAddress || "");
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(routeUrl)}`;
  const html = `
    <!doctype html><html><head><title>${escapeReceipt(order.id)} - via</title>
    <style>
      @page { size: 48mm auto; margin: 0; }
      * { box-sizing: border-box; }
      html, body { width: 48mm; margin: 0; padding: 0; background: #fff; }
      body {
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
      }
      .paper {
        width: 39.5mm;
        margin: 0 auto;
        padding: 0 0 4mm;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .order-box {
        width: 37.5mm;
        margin: 1mm auto 1.5mm;
        padding: 1mm 0.75mm;
        border: 1px solid #000;
        text-align: center;
        font-family: "Arial Black", Arial, sans-serif;
        color: #000;
      }
      .order-box span {
        display: block;
        font-size: 9.5px;
        line-height: 1;
        letter-spacing: 0.08em;
      }
      .order-box strong {
        display: block;
        margin-top: 0.4mm;
        font-size: 22px;
        line-height: 0.95;
        letter-spacing: 0.02em;
      }
      .receipt {
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
        padding: 0;
        font-family: "Courier New", monospace;
        font-size: 8.8px;
        line-height: 1.14;
        color: #000;
        font-weight: 800;
        white-space: pre-wrap;
        overflow-wrap: normal;
        word-break: normal;
      }
      .route {
        width: 100%;
        max-width: 100%;
        margin: 2mm auto 0;
        text-align: center;
        font-family: Arial, sans-serif;
        color: #000;
      }
      .route img {
        width: 24mm;
        height: 24mm;
        display: block;
        margin: 0 auto 1mm;
        object-fit: contain;
        image-rendering: pixelated;
      }
      .route b {
        display: block;
        font-size: 8.5px;
        line-height: 1.1;
        white-space: normal;
        font-family: "Arial Black", Arial, sans-serif;
      }
      @media print {
        @page { size: 48mm auto; margin: 0; }
        html, body { width: 48mm; margin: 0; padding: 0; }
        .paper {
          width: 39.5mm;
          margin-left: auto;
          margin-right: auto;
          padding-left: 0;
          padding-right: 0;
        }
      }
    </style></head><body><main class="paper">
      <div class="order-box"><span>PEDIDO</span><strong>${orderId}</strong></div>
      <pre class="receipt">${receipt}</pre>
      <div class="route">
        <img src="${escapeReceipt(qrUrl)}" alt="QR Code da rota" />
        <b>ABRIR ROTA</b>
      </div>
    </main>
    <script>window.onload=()=>{setTimeout(()=>window.print(),900);}<\/script></body></html>
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

