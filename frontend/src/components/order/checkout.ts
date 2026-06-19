import { CartItem } from "@/types/order";

export type DeliveryType = "retirada" | "delivery";
export type PaymentMethod =
  | "pix"
  | "pix_qrcode"
  | "mercadopago"
  | "cartao"
  | "presencial"
  | "pagar_na_entrega"
  | "whatsapp";
export type CheckoutStep = "bag" | "delivery" | "customer" | "payment" | "review";
export type KioskKeyboardTarget = "name" | "phone" | "coupon" | null;
export type OrderRuntimeMode = "counter" | "delivery";

export type OperatingDay = {
  day: number;
  label: string;
  open: boolean;
  start: string;
  end: string;
};

export type OperatingHoursConfig = {
  days: OperatingDay[];
};

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

export const REMOVE_OPTIONS = [
  "Alface Crocante",
  "Queijo",
  "Carne",
  "Cebola Caramelizada",
  "Molho",
];

export const ITEM_DESC: Record<string, string> = {
  burger:
    "Pão brioche · Burger 100g · Queijo · Alface Crocante · Cebola Caramelizada · Molho Menfi's",
  "double-burger":
    "Pão brioche · 2 carnes Menfi's de 100g · Queijo · Alface Crocante · Cebola Caramelizada · Molho Menfi's",
  "menfis-bacon":
    "Pão brioche · Burger 100g · Queijo · Bacon · Alface Crocante · Cebola Caramelizada · Molho Menfi's",
  "double-menfis-bacon":
    "Pão brioche · 2 carnes Menfi's de 100g · Queijo · Bacon · Alface Crocante · Cebola Caramelizada · Molho Menfi's",
  "double-menfis-chicken":
    "Pão brioche · 2 carnes de chicken de 120g · Queijo · Alface Crocante · Molho Menfi's",
  combo: "Menfi's Burger · Coca-Cola 350ml · Batata Frita 100g",
  "double-combo": "Double Menfi's com 2 burgers de 100g · Coca-Cola 350ml · Batata Frita 100g",
  "combo-upgrade": "Batata frita 100g · Coca-Cola 350ml",
  "bacon-combo": "Menfi's Bacon · Coca-Cola 350ml · Batata Frita 100g",
  "double-bacon-combo": "Double Menfi's Bacon com 2 burgers de 100g · Coca-Cola 350ml · Batata Frita 100g",
  "chicken-combo": "Menfi's Chicken · Coca-Cola 350ml · Batata Frita 100g",
  "double-chicken-combo": "Double Menfi's Chicken com 2 filés de 120g · Coca-Cola 350ml · Batata Frita 100g",
  combo2: "2 Menfi's Burger · 2 bebidas · Batata Frita 200g",
  "bacon-super-combo": "2 Menfi's Bacon · 2 bebidas · Batata Frita 200g",
  "chicken-super-combo": "2 Menfi's Chicken · 2 bebidas · Batata Frita 200g",
  "extra-carne": "Burger 100g adicional",
  "extra-frango": "Filé de frango adicional",
  "extra-bacon": "Bacon adicional 40g",
  "extra-cheddar": "Cheddar adicional 30g",
  "extra-queijo": "Queijo extra derretido",
  "extra-ovo": "Ovo adicional no burger",
  "extra-molho": "Porção extra do molho Menfi's",
  "extra-maionese-barbecue": "Porção extra de maionese barbecue",
  "extra-maionese-alho-frito": "Porção extra de maionese alho frito",
  batata: "Batata frita 250g",
  cola: "Coca-Cola 350ml gelada",
  "coca-zero": "Coca-Cola Zero gelada",
  "guarana-zero": "Guaraná Zero gelado",
  "agua-com-gas": "Água com gás gelada",
};

export const deliveryEta = "25-45 min";
export const PICKUP_ADDRESS = "Rua Doutor Gilberto Studart, 728";
export const DELIVERY_FEE = 7.1;
export const SERVICE_FEE = 0.99;
export const KIOSK_PIX_CODE =
  "00020126330014br.gov.bcb.pix0111044117503175204000053039865802BR5922RODRIGO ARAUJO MUINHOS6009FORTALEZA62070503***63044AEB";
export const SUPPORT_WHATSAPP_URL = "https://wa.me/5585997883764";
export const STORAGE_KEY = "menfis_cliente";
export const MEMBER_KEY = "menfis_member";
export const COUPON_STORAGE_KEY = "menfis_coupons";
export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
export const ORDER_RUNTIME_MODE: OrderRuntimeMode =
  process.env.NEXT_PUBLIC_ORDER_RUNTIME_MODE === "delivery"
    ? "delivery"
    : "delivery";
export const DEFAULT_DELIVERY_TYPE: DeliveryType = "delivery";
export const ALLOWED_DELIVERY_TYPES: DeliveryType[] = ["delivery", "retirada"];

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
export const BUSINESS_HOURS_LABEL = "Funcionamento: terça a domingo, das 18:00 às 22:00.";
export const BEFORE_OPEN_MESSAGE =
  "Oi! Já recebemos sua mensagem.\nNosso atendimento começa às 18:00.\nAssim que abrirmos, vamos te atender com todo carinho. 🍔";
export const AFTER_CLOSE_MESSAGE =
  "Oi! Hoje já encerramos nosso atendimento.\nFuncionamos de terça a domingo, das 18:00 às 22:00.\nAmanhã vai ser um prazer te atender. 🍔";

export const DEFAULT_OPERATING_HOURS: OperatingHoursConfig = {
  days: [
    { day: 0, label: "Domingo", open: true, start: "18:00", end: "22:00" },
    { day: 1, label: "Segunda", open: false, start: "18:00", end: "22:00" },
    { day: 2, label: "Terça", open: true, start: "18:00", end: "22:00" },
    { day: 3, label: "Quarta", open: true, start: "18:00", end: "22:00" },
    { day: 4, label: "Quinta", open: true, start: "18:00", end: "22:00" },
    { day: 5, label: "Sexta", open: true, start: "18:00", end: "22:00" },
    { day: 6, label: "Sábado", open: true, start: "18:00", end: "22:00" },
  ],
};

export const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

export type CheckoutPricing = {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  grossTotal: number;
  discount: number;
  total: number;
};

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildCheckoutPricing({
  items,
  delivery,
  coupon,
}: {
  items: CartItem[];
  delivery: DeliveryType;
  coupon: Coupon | null;
}): CheckoutPricing {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.price * item.qty, 0),
  );
  const deliveryFee =
    delivery === "delivery" && subtotal > 0
      ? DELIVERY_FEE
      : 0;
  const serviceFee = delivery === "delivery" && subtotal > 0 ? SERVICE_FEE : 0;
  const grossTotal = roundMoney(subtotal + deliveryFee + serviceFee);
  const discount = roundMoney(couponDiscount(coupon, grossTotal, items));
  const total = Math.max(1, roundMoney(grossTotal - discount));
  return { subtotal, deliveryFee, serviceFee, grossTotal, discount, total };
}

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

export function normalizeOperatingHours(value: unknown): OperatingHoursConfig {
  const raw =
    value && typeof value === "object" && Array.isArray((value as OperatingHoursConfig).days)
      ? (value as OperatingHoursConfig).days
      : DEFAULT_OPERATING_HOURS.days;
  const byDay = new Map(raw.map((day) => [Number(day.day), day]));
  return {
    days: DEFAULT_OPERATING_HOURS.days.map((fallback) => {
      const day = byDay.get(fallback.day);
      return {
        day: fallback.day,
        label: fallback.label,
        open: typeof day?.open === "boolean" ? day.open : fallback.open,
        start: typeof day?.start === "string" && day.start ? day.start : fallback.start,
        end: typeof day?.end === "string" && day.end ? day.end : fallback.end,
      };
    }),
  };
}

export function getOperatingHoursBlockMessage(
  date = new Date(),
  config: OperatingHoursConfig = DEFAULT_OPERATING_HOURS,
) {
  const normalized = normalizeOperatingHours(config);
  const today = normalized.days.find((day) => day.day === date.getDay());
  if (!today?.open) return AFTER_CLOSE_MESSAGE;
  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  const start = minutesFromTime(today.start);
  const end = minutesFromTime(today.end);
  if (nowMinutes < start) {
    return `Oi! Já recebemos sua mensagem.\nNosso atendimento começa às ${today.start}.\nAssim que abrirmos, vamos te atender pelo WhatsApp. 🍔`;
  }
  if (nowMinutes >= end) {
    return `Oi! Hoje já encerramos nosso atendimento.\nFuncionamos hoje até ${today.end}.\nVamos continuar pelo WhatsApp. 🍔`;
  }
  return "";
}
export const wait = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

export function resolveRuntimeDeliveryType(delivery: DeliveryType) {
  return ALLOWED_DELIVERY_TYPES.includes(delivery)
    ? delivery
    : DEFAULT_DELIVERY_TYPE;
}

export function playAttendantBeep() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.32);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.34);
    oscillator.addEventListener("ended", () => context.close());
  } catch {
    // O som e auxiliar; o fluxo do pedido continua se o dispositivo bloquear audio.
  }
}

export function maskPhone(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function maskCEP(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

export async function lookupCEP(cep: string): Promise<{
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
} | null> {
  try {
    const res = await fetch(
      `https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`,
    );
    const data = await res.json();
    return data.erro ? null : data;
  } catch {
    return null;
  }
}

export function registerMemberOrder() {
  try {
    const raw = localStorage.getItem(MEMBER_KEY);
    if (!raw) return;
    const member = JSON.parse(raw);
    const counted = Number(member.orders ?? 0) + 1;
    localStorage.setItem(
      MEMBER_KEY,
      JSON.stringify({
        ...member,
        orders: counted,
        rewards: Math.floor(counted / 10),
      }),
    );
  } catch {
    // Perfil local opcional.
  }
}

export function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function loadCoupons(): Coupon[] {
  try {
    const stored = JSON.parse(localStorage.getItem(COUPON_STORAGE_KEY) ?? "[]");
    const custom = Array.isArray(stored) ? stored : [];
    const byCode = new Map<string, Coupon>();
    [...DEFAULT_COUPONS, ...custom].forEach((coupon) => {
      byCode.set(coupon.code.toLowerCase(), coupon);
    });
    return [...byCode.values()].filter((coupon) => coupon.active);
  } catch {
    return DEFAULT_COUPONS;
  }
}

export function findCoupon(code: string) {
  const normalized = code.trim().toLowerCase();
  if (!normalized) return null;
  return (
    loadCoupons().find((coupon) => coupon.code.toLowerCase() === normalized) ??
    null
  );
}

function normalizeCoupon(row: unknown): Coupon | null {
  if (!row || typeof row !== "object") return null;
  const data = row as Record<string, unknown>;
  const code = String(data.code ?? "").trim();
  const type = String(data.type ?? "");
  const value = Number(data.value ?? 0);
  if (!code || !Number.isFinite(value)) return null;
  if (type !== "percent" && type !== "fixed_total") return null;
  return {
    code,
    label: String(
      data.label ??
        (type === "percent"
          ? `${value}% de desconto`
          : `Pedido por ${fmt(value)}`),
    ),
    type,
    value,
    active: data.active !== false,
    maxUsesPerDay: Number(data.maxUsesPerDay ?? data.max_uses_per_day ?? 0) || undefined,
    maxUsesTotal: Number(data.maxUsesTotal ?? data.max_uses_total ?? 0) || undefined,
    startsAt: typeof data.startsAt === "string" ? data.startsAt : typeof data.starts_at === "string" ? data.starts_at : undefined,
    endsAt: typeof data.endsAt === "string" ? data.endsAt : typeof data.ends_at === "string" ? data.ends_at : undefined,
    productIds: Array.isArray(data.productIds)
      ? data.productIds.map(String)
      : Array.isArray(data.product_ids)
        ? data.product_ids.map(String)
        : undefined,
    oncePerCustomer: data.oncePerCustomer === true || data.once_per_customer === true,
    blockSamePhone: data.blockSamePhone === true || data.block_same_phone === true,
  };
}

export async function findCouponFromBackend(code: string) {
  const normalized = code.trim().toLowerCase();
  if (!normalized || !API_URL) return null;
  try {
    const response = await fetch(`${API_URL}/coupons/public`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const rows = await response.json();
    if (!Array.isArray(rows)) return null;
    const coupons = rows
      .map(normalizeCoupon)
      .filter((coupon): coupon is Coupon => Boolean(coupon?.active));
    localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupons));
    return (
      coupons.find((coupon) => coupon.code.toLowerCase() === normalized) ?? null
    );
  } catch {
    return null;
  }
}

export function couponDiscount(
  coupon: Coupon | null,
  grossTotal: number,
  items: CartItem[],
) {
  if (!coupon) return 0;
  if (coupon.code.toLowerCase() === "chicken1790") {
    return items.reduce((sum, item) => {
      if (item.id !== "menfis-chicken") return sum;
      return sum + Math.max(0, item.price - 17.9) * item.qty;
    }, 0);
  }
  if (coupon.type === "percent")
    return Math.round(grossTotal * (coupon.value / 100) * 100) / 100;
  if (coupon.type === "fixed_total")
    return Math.max(0, Math.round((grossTotal - coupon.value) * 100) / 100);
  return 0;
}
