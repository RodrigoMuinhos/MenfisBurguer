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
import { formatAddressForReceipt } from "@/utils/address";
export const API_URL = "/backend";
export const COUPON_STORAGE_KEY = "menfis_coupons";
const PRINT_BRIDGE_URL_KEY = "menfis_print_bridge_url";
const PRINT_BRIDGE_LAUNCH_URL_KEY = "menfis_print_bridge_launch_url";
const PRINT_BROWSER_FALLBACK_KEY = "menfis_print_browser_fallback";
const DEFAULT_PRINT_BRIDGE_URL = "http://127.0.0.1:17777/print";
const DEFAULT_PRINT_BRIDGE_LAUNCH_URL = "";

export type Coupon = {
  code: string;
  label: string;
  type: "percent" | "fixed_total" | "free_shipping";
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
  return (
    order?.channel === "KIOSK" ||
    String(order?.customerName ?? "").trim().toUpperCase().replace(/_/g, "-") === "KIOSK-MOB"
  );
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
  const mercadoPago = provider === "mercado_pago" || provider === "mercado pago";
  const sitef = provider.includes("sitef") || provider.includes("ppc930");

  if (isKioskMobOrder(order) && method === "presencial") return "Pagamento no Balcão";
  if (method === "pix") {
    if (sitef) return "PIX - Maquineta SiTef";
    return mercadoPago ? "PIX Mercado Pago" : "PIX";
  }
  if (method === "credit_card" || method === "credito")
    return sitef
      ? "Cartão de Crédito - Maquineta SiTef"
      : mercadoPago
        ? "Cartão de Crédito Mercado Pago"
        : "Cartão de Crédito";
  if (method === "debit_card" || method === "debito")
    return sitef
      ? "Cartão de Débito - Maquineta SiTef"
      : mercadoPago
        ? "Cartão de Débito Mercado Pago"
        : "Cartão de Débito";
  if (method === "cartao") return mercadoPago ? "Cartão Mercado Pago" : "Cartão";
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
  "double-combo": ["BIG Menfi's", "Coca-Cola 350ml", "Batata Frita 100g"],
  combo2: ["2x Menfi's Burger", "2 bebidas", "Batata Frita 200g"],
  "triple-combo": ["Combo Triple Menfi's", "3 carnes 100g", "Bebida", "Batata Frita"],
  "bacon-combo": ["Menfi's Bacon 130g", "Coca-Cola 350ml", "Batata Frita 100g"],
  "double-bacon-combo": ["BIG Menfi's Bacon", "Coca-Cola 350ml", "Batata Frita 100g"],
  "bacon-super-combo": ["2x Menfi's Bacon 130g", "2 bebidas", "Batata Frita 200g"],
  "chicken-combo": ["Menfi's Chicken", "Coca-Cola 350ml", "Batata Frita 100g"],
  "double-chicken-combo": ["BIG Menfi's Chicken", "Coca-Cola 350ml", "Batata Frita 100g"],
  "chicken-super-combo": ["2x Menfi's Chicken", "2 bebidas", "Batata Frita 200g"],
};

const SUPER_COMBO_SANDWICH: Record<string, string> = {
  combo2: "Menfi's Burger",
  "triple-combo": "Combo Triple Menfi's",
  "bacon-super-combo": "Menfi's Bacon",
  "chicken-super-combo": "Menfi's Chicken",
};

function isSuperComboItem(item: Order["items"][number]) {
  const id = item.productId ?? item.id;
  return Boolean(SUPER_COMBO_SANDWICH[id]) || item.name.toLowerCase().includes("super combo");
}

function superComboSandwich(item: Order["items"][number]) {
  const id = item.productId ?? item.id;
  if (SUPER_COMBO_SANDWICH[id]) return SUPER_COMBO_SANDWICH[id];
  const normalized = item.name.toLowerCase();
  if (normalized.includes("bacon")) return "Menfi's Bacon";
  if (normalized.includes("chicken")) return "Menfi's Chicken";
  return "Menfi's Burger";
}

function isDrinkComponent(component: string) {
  const normalized = component.toLowerCase();
  return (
    normalized.includes("coca") ||
    normalized.includes("guarana") ||
    normalized.includes("guaraná") ||
    normalized.includes("refrigerante") ||
    normalized.includes("bebida")
  );
}

function isSauceComponent(component: string) {
  return component.toLowerCase().includes("maionese");
}

function isPotatoComponent(component: string) {
  const normalized = component.toLowerCase();
  return normalized.includes("batata") || normalized.includes("frita");
}

function quantityComponent(label: string, quantity: number) {
  const clean = label.replace(/^\d+x\s+/i, "").trim();
  return `${quantity}x ${clean}`;
}

function expandSuperComboComponents(item: Order["items"][number]) {
  const source = item.components?.length ? item.components : DEFAULT_COMPOSITION[item.productId ?? item.id] ?? [];
  const drinks = source.filter(isDrinkComponent);
  const sauces = source.filter(isSauceComponent);
  const potato = source.find(isPotatoComponent) ?? "Batata Frita 200g";
  const primaryDrink = drinks[0] ?? "refrigerante";
  const primarySauce = sauces[0] ?? "maionese";

  return [
    `${quantityComponent(superComboSandwich(item), 2)} (sanduiches)`,
    quantityComponent(primaryDrink, 2),
    potato,
    quantityComponent(primarySauce, 2),
  ];
}

export function orderStageLabel(order: Order) {
  if (scheduledOrderInfo(order) && ["PAYMENT_PENDING", "PAID"].includes(order.status)) {
    return "Pedido Agendado";
  }
  return STAGE_LABEL[order.status] ?? order.status;
}

export function orderItemComponents(item: Order["items"][number]) {
  if (isSuperComboItem(item)) return expandSuperComboComponents(item);
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

// POS-58 em fonte normal comporta 32 colunas. O valor anterior (23) cortava
// nomes, preços, códigos e observações antes de enviar o texto à impressora.
const LINE_WIDTH = 32;

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

function boxedLine(text: string) {
  const innerWidth = LINE_WIDTH - 2;
  const clean = receiptText(text).slice(0, innerWidth);
  const left = Math.floor((innerWidth - clean.length) / 2);
  return `|${" ".repeat(left)}${clean}${" ".repeat(innerWidth - clean.length - left)}|`;
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

function receiptOrderNumber(order: Order) {
  return receiptText(String(order.number || order.id || "").replace(/^#/, ""));
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
  const rawCustomerName = receiptText(order.customerName || "");
  const customerName =
    rawCustomerName.toUpperCase().replace(/_/g, "-") === "KIOSK-MOB"
      ? "CLIENTE"
      : (rawCustomerName || "Cliente").toUpperCase();
  const isDelivery = receiptType(order) === "ENTREGA";
  const customerAddress = order.customerAddress
    ? formatAddressForReceipt(order.customerAddress).toUpperCase()
    : "";
  const orderNumber = receiptOrderNumber(order);
  const confirmationCode = receiptText(deliveryConfirmationCode(order));
  const orderDate = new Date(order.timestamp);
  const dateLabel = orderDate.toLocaleDateString("pt-BR");
  const timeLabel = orderDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const pushSection = (title: string) => {
    const label = `[ ${receiptText(title).toUpperCase()} ]`;
    const remaining = Math.max(2, LINE_WIDTH - label.length);
    const left = Math.floor(remaining / 2);
    lines.push("-".repeat(left) + label + "-".repeat(remaining - left));
  };

  lines.push(center("MENFI'S BURGER"));
  lines.push(`+${"-".repeat(LINE_WIDTH - 2)}+`);
  lines.push(boxedLine("PEDIDO"));
  lines.push(boxedLine(`#${orderNumber}`));
  lines.push(`+${"-".repeat(LINE_WIDTH - 2)}+`);
  if (confirmationCode && confirmationCode !== orderNumber) {
    lines.push(center(`CODIGO DE RETIRADA: ${confirmationCode}`));
  }
  lines.push(center("OBRIGADO POR ESCOLHER A MENFI'S!"));
  lines.push(center("FEITO COM CARINHO PELA MENFI'S"));
  lines.push(center("<3"));
  lines.push(line());
  lines.push(center("CLIENTE"));
  lines.push(center(customerName));
  if (order.customerPhone) lines.push(center(`TEL ${order.customerPhone}`));
  lines.push(line());
  lines.push(leftRight(dateLabel, `${timeLabel}  ${receiptType(order)}`));
  if (isDelivery && customerAddress) {
    pushSection("ENDERECO");
    customerAddress.split("\n").forEach((addressLine) => pushWrapped(addressLine));
  }
  pushSection("ITENS DO PEDIDO");

  order.items.forEach((item) => {
    lines.push(...itemLine(item.qty, item.name, item.price * item.qty));
    orderItemComponents(item).forEach((component) => pushWrapped(`- ${component}`, 2));
    const removedForItem = order.removedByItemId?.[item.id] ?? [];
    removedForItem.forEach((removed) => pushWrapped(`SEM: ${removed}`, 2));
    const note = orderItemNote(item);
    if (note) pushWrapped(`OBS: ${note}`, 2);
    lines.push(line("."));
  });

  pushSection("RESUMO");
  lines.push(leftRight("Subtotal:", money(financials.itemsSubtotal)));
  if (financials.deliveryFee > 0) {
    lines.push(leftRight("Taxa de entrega:", money(financials.deliveryFee)));
  }
  if (financials.serviceFee > 0) lines.push(leftRight("Taxa servico:", money(financials.serviceFee)));
  if (order.couponCode && financials.discount > 0) {
    pushWrapped(`Cupom: ${order.couponCode}`);
  }
  if (financials.discount > 0) lines.push(leftRight("Desconto:", `-${money(financials.discount)}`));
  lines.push(line());
  lines.push(leftRight("TOTAL:", money(financials.total)));
  lines.push(line("="));
  pushSection("PAGAMENTO");
  pushWrapped(`FORMA: ${paymentMethodLabel(order)}`);
  pushWrapped(`STATUS: ${paymentStatusLabel(order)}`);
  if (order.paymentId) pushWrapped(`ID PAGAMENTO: ${order.paymentId}`);
  if (paymentStatusLabel(order) === "Pago") lines.push(center("[ APROVADO ]"));
  lines.push(line());
  lines.push(center("VOCE APOIA, NOS CRIAMOS."));
  lines.push(center("SEU PEDIDO MOVE A MENFI'S!"));
  lines.push(center("ATE A PROXIMA!"));
  lines.push(line("="));
  lines.push(center("@MENFISBURGUER"));
  lines.push(center("MENFISBURGUER.COM.BR"));

  const receipt = lines.join("\n").replace(/\n{3,}/g, "\n\n");
  for (const receiptLine of receipt.split("\n")) {
    if (receiptLine.length > LINE_WIDTH) {
      console.warn(`Linha excedeu ${LINE_WIDTH} caracteres:`, receiptLine);
    }
  }
  return receipt;
}

function logReceiptTextWidth(receipt: string) {
  const lines = receipt.replace(/\r/g, "").split("\n");
  const lengths = lines.map((value) => value.length);
  console.info("[receipt-width:text]", {
    configuredColumns: LINE_WIDTH,
    longestLine: Math.max(0, ...lengths),
    shortestNonEmptyLine: Math.min(...lengths.filter(Boolean), 0),
    lineCount: lines.length,
    overflowingLines: lengths.filter((length) => length > LINE_WIDTH).length,
  });
}

function logReceiptDomWidth(frame: HTMLIFrameElement) {
  const doc = frame.contentDocument;
  if (!doc) return;
  const selectors = ["html", "body", ".paper", ".receipt"];
  console.info(
    "[receipt-width:dom]",
    selectors.map((selector) => {
      const element = doc.querySelector(selector);
      if (!element) return { selector, missing: true };
      const style = frame.contentWindow!.getComputedStyle(element);
      return {
        selector,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        width: style.width,
        minWidth: style.minWidth,
        maxWidth: style.maxWidth,
        display: style.display,
        flexShrink: style.flexShrink,
        wordBreak: style.wordBreak,
        overflowWrap: style.overflowWrap,
        whiteSpace: style.whiteSpace,
        zoom: style.zoom,
        transform: style.transform,
      };
    }),
  );
}

function printBridgeUrls() {
  const urls = [
    process.env.NEXT_PUBLIC_PRINT_BRIDGE_URL,
    typeof window !== "undefined" ? localStorage.getItem(PRINT_BRIDGE_URL_KEY) : "",
    DEFAULT_PRINT_BRIDGE_URL,
  ]
    .map((url) => String(url ?? "").trim().replace(/\/$/, ""))
    .filter(Boolean);
  return [...new Set(urls)];
}

async function trySilentReceiptPrint(order: Order, receipt: string) {
  const orderId = String(order.id || order.number || "");
  for (const url of printBridgeUrls()) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "customer_receipt",
          printer: "POS-58",
          orderId,
          content: receipt,
        }),
      });
      if (response.ok) return true;
    } catch {
      // Local print bridge is optional; try the next configured URL.
    }
  }
  return false;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function launchPrintBridge() {
  if (typeof window === "undefined") return false;
  const launchUrl = String(
    process.env.NEXT_PUBLIC_PRINT_BRIDGE_LAUNCH_URL ||
      localStorage.getItem(PRINT_BRIDGE_LAUNCH_URL_KEY) ||
      DEFAULT_PRINT_BRIDGE_LAUNCH_URL,
  ).trim();
  if (!launchUrl) return false;

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.setAttribute("aria-hidden", "true");
  iframe.src = launchUrl;
  document.body.appendChild(iframe);
  window.setTimeout(() => iframe.remove(), 3000);
  return true;
}

function browserPrintFallbackEnabled(options?: { browserFallback?: boolean }) {
  if (options?.browserFallback === false) return false;
  if (options?.browserFallback === true) return true;
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PRINT_BROWSER_FALLBACK_KEY) !== "0";
}

export async function printOrderReceipts(
  order: Order,
  options?: { confirm?: boolean; browserFallback?: boolean },
) {
  if (options?.confirm !== false && !window.confirm("Imprimir via do cliente agora?")) return;

  const rawReceipt = generateCustomerReceipt(order);
  logReceiptTextWidth(rawReceipt);
  const desktopPrinter = (window as Window & {
    kioskMenfis?: {
      printOrder?: (content: string) => Promise<{ ok: boolean; error?: string }>;
    };
  }).kioskMenfis;
  if (desktopPrinter?.printOrder) {
    const result = await desktopPrinter.printOrder(rawReceipt);
    if (result.ok) return;
    console.error("Impressão direta POS-58 falhou:", result.error);
  }

  const silentPrinted = await trySilentReceiptPrint(order, rawReceipt);
  if (silentPrinted) return;

  if (launchPrintBridge()) {
    await sleep(1800);
    const retriedSilentPrint = await trySilentReceiptPrint(order, rawReceipt);
    if (retriedSilentPrint) return;
  }

  const receipt = escapeReceipt(rawReceipt);
  const orderId = escapeReceipt(String(order.id || order.number || ""));
  const html = `
    <!doctype html><html><head><title>${escapeReceipt(order.id)} - via</title>
    <style>
      @page { size: 58mm auto; margin: 0; }
      * { box-sizing: border-box; }
      html, body {
        width: 58mm;
        min-width: 58mm;
        max-width: 58mm;
        margin: 0;
        padding: 0;
        background: #fff;
        zoom: 1;
        transform: none;
      }
      body {
        display: flex;
        width: 58mm;
        min-width: 58mm;
        max-width: 58mm;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
      }
      .paper {
        box-sizing: border-box;
        width: 48mm;
        min-width: 48mm;
        max-width: 48mm;
        flex: 0 0 48mm;
        margin: 0 auto;
        padding: 1mm 0 4mm;
      }
      .order-box {
        box-sizing: border-box;
        width: 100%;
        min-width: 100%;
        max-width: 100%;
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
        display: block;
        box-sizing: border-box;
        width: 100%;
        min-width: 100%;
        max-width: 100%;
        flex: none;
        margin: 0 auto;
        padding: 0;
        font-family: "Courier New", monospace;
        font-size: 8.8px;
        line-height: 1.14;
        color: #000;
        font-weight: 800;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        word-break: normal;
        zoom: 1;
        transform: none;
      }
      @media print {
        @page { size: 58mm auto; margin: 0; }
        html, body {
          width: 58mm;
          min-width: 58mm;
          max-width: 58mm;
          margin: 0;
          padding: 0;
          zoom: 1;
          transform: none;
        }
        .paper {
          width: 48mm;
          min-width: 48mm;
          max-width: 48mm;
          margin-left: auto;
          margin-right: auto;
          padding-left: 0;
          padding-right: 0;
        }
      }
    </style></head><body><main class="paper">
      <div class="order-box"><span>PEDIDO</span><strong>${orderId}</strong></div>
      <pre class="receipt">${receipt}</pre>
    </main></body></html>
  `;

  if (!browserPrintFallbackEnabled(options)) return;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "0";
  iframe.style.top = "0";
  iframe.style.width = "58mm";
  iframe.style.minWidth = "58mm";
  iframe.style.maxWidth = "58mm";
  iframe.style.height = "1px";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
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
  logReceiptDomWidth(iframe);

  let printed = false;
  const printFrame = () => {
    if (printed) return;
    printed = true;
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      iframe.remove();
      return;
    }
    frameWindow.focus();
    logReceiptDomWidth(iframe);
    frameWindow.print();
    window.setTimeout(() => iframe.remove(), 5000);
  };

  window.setTimeout(printFrame, 250);
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
  return type === "free_shipping"
    ? "Frete grátis"
    : type === "percent"
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
    { stockId: "2", qty: 0.13 },
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
    { stockId: "2", qty: 0.13 },
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
  "triple-combo": [
    { stockId: "1", qty: 1 },
    { stockId: "2", qty: 0.3 },
    { stockId: "3", qty: 0.5 },
    { stockId: "4", qty: 3 },
    { stockId: "7", qty: 30 },
    { stockId: "5", qty: 1 },
    { stockId: "6", qty: 0.25 },
  ],
  "bacon-super-combo": [
    { stockId: "1", qty: 2 },
    { stockId: "2", qty: 0.26 },
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
  "batata-pequena": [{ stockId: "6", qty: 0.09 }],
  "batata-media": [{ stockId: "6", qty: 0.18 }],
  batata: [{ stockId: "6", qty: 0.27 }],
  "nuggets-90g": [{ stockId: "nuggets", qty: 0.09 }],
  "nuggets-180g": [{ stockId: "nuggets", qty: 0.18 }],
  "nuggets-grande": [{ stockId: "nuggets", qty: 0.27 }],
  cola: [{ stockId: "5", qty: 1 }],
  "extra-carne": [{ stockId: "2", qty: 0.1 }],
  "extra-frango": [{ stockId: "8", qty: 1 }],
  "extra-bacon": [{ stockId: "9", qty: 20 }],
  "extra-cheddar": [{ stockId: "10", qty: 30 }],
  "extra-queijo": [{ stockId: "4", qty: 1 }],
  "extra-bebida": [{ stockId: "5", qty: 1 }],
  "extra-molho": [{ stockId: "7", qty: 20 }],
};

