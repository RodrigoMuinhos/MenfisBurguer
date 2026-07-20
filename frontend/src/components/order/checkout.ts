import { CartItem } from "@/types/order";

export type DeliveryType = "retirada" | "delivery";
export type PaymentMethod =
  | ""
  | "pix"
  | "pix_qrcode"
  | "mercadopago"
  | "cartao"
  | "presencial"
  | "pagar_na_entrega"
  | "whatsapp";
export type CheckoutStep = "bag" | "delivery" | "customer" | "payment" | "review";
export type KioskKeyboardTarget = "name" | "phone" | "coupon" | "counterName" | "adminLogin" | "adminPassword" | null;
export type OrderRuntimeMode = "counter" | "delivery";

export type OperatingDay = {
  day: number;
  label: string;
  open: boolean;
  soldOut?: boolean;
  start: string;
  end: string;
};

export type OperatingHoursConfig = {
  days: OperatingDay[];
};

export type PresentationSettings = {
  enabled: boolean;
  intervalSeconds: number;
  imageCount: number;
  images: string[];
  featuredImage?: string;
  featuredTitle?: string;
  carouselIntervalSeconds: number;
  carouselCards: CarouselCardSettings[];
};

export type CarouselCardSettings = {
  id: string;
  enabled: boolean;
  productId: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  actionLabel: string;
};

export type SpecialOfferSettings = {
  enabled: boolean;
  oncePerSession: boolean;
  productId: string;
  title: string;
  description: string;
  image: string;
  price: number;
  primaryButton: string;
  secondaryButton: string;
};

export type PromoCardIcon =
  | "gift"
  | "flame"
  | "ticket"
  | "tag"
  | "percent"
  | "clock"
  | "star"
  | "heart"
  | "burger"
  | "fries";

export type PromoCard = {
  id: string;
  enabled: boolean;
  eyebrow: string;
  title: string;
  copy: string;
  value: string;
  suffix: string;
  icon: PromoCardIcon;
};

function normalizePromoCardEnabled(data: Record<string, unknown>) {
  const raw =
    data.enabled ??
    data.active ??
    data.visible ??
    data.isActive ??
    data.isEnabled;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw !== 0;
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    if (["false", "0", "no", "nao", "não", "off", "hidden", "oculto"].includes(normalized)) {
      return false;
    }
    if (["true", "1", "yes", "sim", "on", "visible", "ativo"].includes(normalized)) {
      return true;
    }
  }
  return true;
}

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
    "Pão brioche · 2 carnes bovinas de 100g (200g no total) · Queijo · Alface Crocante · Cebola Caramelizada · Molho Menfi's",
  "menfis-bacon":
    "Pão brioche · Burger 130g · Queijo · Bacon · Alface Crocante · Cebola Caramelizada · Molho Menfi's",
  "double-menfis-bacon":
    "Pão brioche · 2 carnes bovinas de 100g (200g no total) · Queijo · Bacon · Alface Crocante · Cebola Caramelizada · Molho Menfi's",
  "double-menfis-chicken":
    "Pão brioche · 2 filés de frango de 120g (240g no total) · Queijo · Alface Crocante · Molho Menfi's",
  combo: "Menfi's Burger · Coca-Cola 350ml · Batata Frita 100g",
  "double-combo": "BIG Menfi's com 2 carnes bovinas de 100g (200g no total) · Coca-Cola 350ml · Batata Frita 100g",
  "combo-upgrade": "Batata frita 100g · Coca-Cola 350ml",
  "triple-combo": "Combo Triple Menfi's com 3 carnes bovinas de 100g · Bebida · Batata Frita",
  "bacon-combo": "Menfi's Bacon 130g · Coca-Cola 350ml · Batata Frita 100g",
  "double-bacon-combo": "BIG Menfi's Bacon com 2 carnes bovinas de 100g (200g no total) · Coca-Cola 350ml · Batata Frita 100g",
  "chicken-combo": "Menfi's Chicken · Coca-Cola 350ml · Batata Frita 100g",
  "double-chicken-combo": "BIG Menfi's Chicken com 2 filés de frango de 120g (240g no total) · Coca-Cola 350ml · Batata Frita 100g",
  combo2: "2 Menfi's Burger · 2 bebidas · Batata Frita 200g",
  "bacon-super-combo": "2 Menfi's Bacon 130g · 2 bebidas · Batata Frita 200g",
  "chicken-super-combo": "2 Menfi's Chicken · 2 bebidas · Batata Frita 200g",
  "extra-carne": "Burger 100g adicional",
  "extra-frango": "Filé de frango adicional",
  "extra-bacon": "Bacon adicional 40g",
  "extra-cheddar": "Cheddar adicional 30g",
  "extra-queijo": "Queijo extra derretido",
  "extra-ovo": "Ovo adicional no burger",
  "extra-picles": "Porção extra de picles",
  "extra-molho": "Porção extra do molho Menfi's",
  "extra-maionese-barbecue": "Porção extra de Maionse Grill",
  "extra-maionese-alho-frito": "Porção extra de maionese alho frito",
  "batata-pequena": "Batata frita pequena 90g",
  "batata-media": "Batata frita média 180g",
  batata: "Batata frita grande 270g",
  "nuggets-90g": "Menfi's Nuggets 90g com molho e ketchup",
  "nuggets-180g": "Menfi's Nuggets 180g com molho e ketchup",
  "nuggets-grande": "Menfi's Nuggets 270g com molho e ketchup",
  "sweet-menfis-classic": "Sweet Menfi's Classic com 4 doces clássicos escolhidos",
  "sweet-menfis-plus": "Sweet Menfi's Plus com 4 doces premium escolhidos",
  cola: "Coca-Cola 350ml gelada",
  "coca-zero": "Coca-Cola Zero gelada",
  "guarana-zero": "Guaraná Zero gelado",
  guarana: "Guaraná tradicional gelado",
  "agua-com-gas": "Água com gás gelada",
};

export const deliveryEta = "35-50 min";
export const PICKUP_ADDRESS = "Rua Doutor Gilberto Studart, 728";
export const DELIVERY_FEE = 7.1;
export const SERVICE_FEE = 0.99;
export const KIOSK_PIX_CODE =
  "00020126330014br.gov.bcb.pix0111044117503175204000053039865802BR5922RODRIGO ARAUJO MUINHOS6009FORTALEZA62070503***63044AEB";

/** Gera um payload Pix copia-e-cola com o valor do pedido embutido (campo 54). */
export function pixCodeWithAmount(amount: number) {
  const withoutCrc = KIOSK_PIX_CODE.slice(0, -8);
  const formattedAmount = Math.max(0, amount).toFixed(2);
  const amountField = `54${String(formattedAmount.length).padStart(2, "0")}${formattedAmount}`;
  const amountPosition = withoutCrc.indexOf("5802BR");
  const payload =
    amountPosition >= 0
      ? `${withoutCrc.slice(0, amountPosition)}${amountField}${withoutCrc.slice(amountPosition)}`
      : `${withoutCrc}${amountField}`;
  const crcInput = `${payload}6304`;
  let crc = 0xffff;
  for (let index = 0; index < crcInput.length; index += 1) {
    crc ^= crcInput.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return `${crcInput}${crc.toString(16).toUpperCase().padStart(4, "0")}`;
}
export const SUPPORT_WHATSAPP_URL = "https://wa.me/5585997883764";
export const STORAGE_KEY = "menfis_cliente";
export const MEMBER_KEY = "menfis_member";
export const COUPON_STORAGE_KEY = "menfis_coupons";
export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/backend";
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
    { day: 0, label: "Domingo", open: true, soldOut: true, start: "18:00", end: "22:00" },
    { day: 1, label: "Segunda", open: false, soldOut: true, start: "18:00", end: "22:00" },
    { day: 2, label: "Terça", open: true, soldOut: true, start: "18:00", end: "22:00" },
    { day: 3, label: "Quarta", open: true, soldOut: true, start: "18:00", end: "22:00" },
    { day: 4, label: "Quinta", open: true, soldOut: true, start: "18:00", end: "22:00" },
    { day: 5, label: "Sexta", open: true, soldOut: true, start: "18:00", end: "22:00" },
    { day: 6, label: "Sábado", open: true, soldOut: true, start: "18:00", end: "22:00" },
  ],
};

export const DEFAULT_PRESENTATION_SETTINGS: PresentationSettings = {
  enabled: true,
  intervalSeconds: 6,
  imageCount: 1,
  images: ["/descanso.png"],
  featuredImage: "",
  featuredTitle: "",
  carouselIntervalSeconds: 3,
  carouselCards: [
    { id: "most-sold", enabled: true, productId: "triple-combo", eyebrow: "O mais vendido", title: "Combo Triple Menfi's", subtitle: "O favorito da galera", image: "/carrosel/omaisvendido.png", actionLabel: "Ver combo" },
    { id: "super-tropikal", enabled: true, productId: "tropikal-menfis", eyebrow: "Linha Super", title: "Tropikal Menfi's", subtitle: "Uma novidade tropical", image: "/super/tropikal.jpeg", actionLabel: "Ver Super" },
    { id: "super-chilli", enabled: true, productId: "tropikal-barbecue", eyebrow: "Linha Super", title: "Chilli Menfi's", subtitle: "Escolha sua ardência", image: "/super/Chilli.jpeg", actionLabel: "Personalizar" },
    { id: "sweet-smoore", enabled: true, productId: "smash-nutella-marshmallow", eyebrow: "Sweet", title: "Smoore Menfi's", subtitle: "Nutella e marshmallow maçaricado", image: "/buffetdoce/paonuella.jpeg", actionLabel: "Quero meu Sweet" },
  ],
};

export const DEFAULT_SPECIAL_OFFER_SETTINGS: SpecialOfferSettings = {
  enabled: true,
  oncePerSession: true,
  productId: "triple-combo",
  title: "Combo Triple Menfi's — O Matador de Fome",
  description:
    "3 carnes suculentas, cheddar derretido, salada, molho Menfi's e muito capricho. Um combo pesado, feito para quem chega com fome de verdade.",
  image: "/menu/supercombomnfis.png",
  price: 65.9,
  primaryButton: "Adicionar ao pedido",
  secondaryButton: "Ver cardápio",
};

export const DEFAULT_PROMO_CARDS: PromoCard[] = [
  {
    id: "mfb10",
    enabled: true,
    eyebrow: "Primeira compra?",
    title: "MFB10",
    copy: "Ganhe 10% OFF no primeiro pedido",
    value: "10%",
    suffix: "OFF",
    icon: "gift",
  },
  {
    id: "combolove",
    enabled: true,
    eyebrow: "Quarta-feira",
    title: "LOV50",
    copy: "Na compra de um combo, o segundo sai com 50% OFF",
    value: "50%",
    suffix: "2o combo",
    icon: "flame",
  },
];

export const PROMO_CARD_ICON_OPTIONS: Array<{ value: PromoCardIcon; label: string }> = [
  { value: "gift", label: "Presente" },
  { value: "flame", label: "Fogo" },
  { value: "ticket", label: "Cupom" },
  { value: "tag", label: "Etiqueta" },
  { value: "percent", label: "Percentual" },
  { value: "clock", label: "Tempo" },
  { value: "star", label: "Estrela" },
  { value: "heart", label: "Coração" },
  { value: "burger", label: "Burger" },
  { value: "fries", label: "Fritas" },
];

function normalizePromoCardIcon(value: unknown): PromoCardIcon {
  return PROMO_CARD_ICON_OPTIONS.some((option) => option.value === value)
    ? (value as PromoCardIcon)
    : "gift";
}

export function normalizePresentationSettings(value: unknown): PresentationSettings {
  const data =
    value && typeof value === "object"
      ? (value as Partial<PresentationSettings>)
      : {};
  const images = Array.isArray(data.images)
    ? data.images.map((image) => String(image)).filter(Boolean)
    : DEFAULT_PRESENTATION_SETTINGS.images;
  const intervalSeconds = Number(data.intervalSeconds);
  const imageCount = Number(data.imageCount);
  const featuredImage =
    typeof data.featuredImage === "string" ? data.featuredImage.trim() : "";
  const featuredTitle =
    typeof data.featuredTitle === "string" ? data.featuredTitle.slice(0, 80) : "";
  const carouselIntervalSeconds = Number(data.carouselIntervalSeconds);
  const carouselCards = Array.isArray(data.carouselCards)
    ? data.carouselCards.slice(0, 12).map((entry, index) => {
        const card = entry && typeof entry === "object" ? entry as Partial<CarouselCardSettings> : {};
        return {
          id: String(card.id || `carousel-${index + 1}`),
          enabled: card.enabled !== false,
          productId: String(card.productId || ""),
          eyebrow: String(card.eyebrow || "Destaque").slice(0, 40),
          title: String(card.title || "Novo destaque").slice(0, 80),
          subtitle: String(card.subtitle || "").slice(0, 140),
          image: String(card.image || ""),
          actionLabel: String(card.actionLabel || "Ver produto").slice(0, 40),
        };
      })
    : DEFAULT_PRESENTATION_SETTINGS.carouselCards;
  return {
    enabled:
      typeof data.enabled === "boolean"
        ? data.enabled
        : DEFAULT_PRESENTATION_SETTINGS.enabled,
    intervalSeconds:
      Number.isFinite(intervalSeconds) && intervalSeconds >= 2
        ? Math.min(60, Math.round(intervalSeconds))
        : DEFAULT_PRESENTATION_SETTINGS.intervalSeconds,
    imageCount:
      Number.isFinite(imageCount) && imageCount >= 1
        ? Math.min(20, Math.round(imageCount))
        : Math.max(1, images.length),
    images: images.length ? images : DEFAULT_PRESENTATION_SETTINGS.images,
    featuredImage,
    featuredTitle,
    carouselIntervalSeconds:
      Number.isFinite(carouselIntervalSeconds) && carouselIntervalSeconds >= 2
        ? Math.min(30, Math.round(carouselIntervalSeconds))
        : DEFAULT_PRESENTATION_SETTINGS.carouselIntervalSeconds,
    carouselCards: carouselCards.length ? carouselCards : DEFAULT_PRESENTATION_SETTINGS.carouselCards,
  };
}

export function normalizeSpecialOfferSettings(value: unknown): SpecialOfferSettings {
  const data =
    value && typeof value === "object"
      ? (value as Partial<SpecialOfferSettings>)
      : {};
  const price = Number(data.price);
  return {
    enabled: typeof data.enabled === "boolean" ? data.enabled : DEFAULT_SPECIAL_OFFER_SETTINGS.enabled,
    oncePerSession:
      typeof data.oncePerSession === "boolean"
        ? data.oncePerSession
        : DEFAULT_SPECIAL_OFFER_SETTINGS.oncePerSession,
    productId: String(data.productId || DEFAULT_SPECIAL_OFFER_SETTINGS.productId).trim(),
    title: String(data.title || DEFAULT_SPECIAL_OFFER_SETTINGS.title).trim().slice(0, 90),
    description: String(data.description || DEFAULT_SPECIAL_OFFER_SETTINGS.description).trim().slice(0, 260),
    image: String(data.image || DEFAULT_SPECIAL_OFFER_SETTINGS.image).trim(),
    price: Number.isFinite(price) && price > 0 ? Math.round(price * 100) / 100 : DEFAULT_SPECIAL_OFFER_SETTINGS.price,
    primaryButton: String(data.primaryButton || DEFAULT_SPECIAL_OFFER_SETTINGS.primaryButton).trim().slice(0, 32),
    secondaryButton: String(data.secondaryButton || DEFAULT_SPECIAL_OFFER_SETTINGS.secondaryButton).trim().slice(0, 32),
  };
}

export function normalizePromoCards(value: unknown): PromoCard[] {
  const hasExplicitRows = Array.isArray(value);
  const rows = hasExplicitRows ? value : DEFAULT_PROMO_CARDS;
  const cards: PromoCard[] = rows
    .map((row, index): PromoCard => {
      const data = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
      const id = String(data.id || `promo-${index + 1}`).trim();
      const title = String(data.title ?? "");
      const copy = String(data.copy ?? "");
      return {
        id: id || `promo-${index + 1}`,
        enabled: normalizePromoCardEnabled(data),
        eyebrow: String(data.eyebrow ?? ""),
        title,
        copy: String(data.copy ?? ""),
        value: String(data.value ?? ""),
        suffix: String(data.suffix ?? ""),
        icon: normalizePromoCardIcon(data.icon),
      };
    })
    .filter((card) => card.title || card.copy || card.value);
  if (cards.length) return cards.slice(0, 8);
  return hasExplicitRows ? [] : DEFAULT_PROMO_CARDS;
}

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
    delivery === "delivery" && subtotal > 0 && coupon?.type !== "free_shipping"
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
        soldOut: typeof day?.soldOut === "boolean" ? day.soldOut : fallback.soldOut,
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
  if (type !== "percent" && type !== "fixed_total" && type !== "free_shipping") return null;
  return {
    code,
    label: String(
      data.label ??
        (type === "percent"
          ? `${value}% de desconto`
          : type === "free_shipping"
            ? "Frete grátis"
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
  if (coupon.type === "free_shipping") return 0;
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
