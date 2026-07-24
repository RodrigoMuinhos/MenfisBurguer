import type { StaticImageData } from "next/image";
import { Beef, Candy, CupSoda, Package, Plus, Utensils } from "lucide-react";
import { CartItem } from "@/types/order";
import { MenuItem } from "@/features/catalog/types";

export type BuilderState = {
  cheese: boolean;
  sauce: boolean;
};

export type CustomizerState = {
  item: MenuItem;
  meatPoints: string[];
  sauces: string[];
  drinks: string[];
  extras: Record<string, number>;
  qty: number;
  note: string;
  spiceLevel?: number;
};

export type MemberProfile = {
  id?: number;
  name: string;
  email?: string;
  phone: string;
  birthday?: string;
  avatarUrl?: string;
  defaultAddress?: Record<string, string>;
  hasPassword?: boolean;
  freeShipping: boolean;
  orders: number;
  rewards: number;
  clubLevel?: "Silver" | "Gold";
  clubExpiresAt?: string;
  createdAt: number;
};

export const CATEGORIES = [
  { id: "combo", label: "Combos", Icon: Package },
  { id: "burger", label: "Burgers", Icon: Beef },
  { id: "fries", label: "Fries", Icon: Utensils },
  { id: "sweet", label: "Sweet", Icon: Candy },
  { id: "lemonade", label: "Lemonade", Icon: CupSoda },
  { id: "super", label: "SUPER", Icon: Candy },
  { id: "extras", label: "Extras", Icon: Plus },
] as const;

export const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
export const BURGER_ID = "burger";
export const BURGER_PRICE = 25.9;
export const CHEESE_PRICE = 2;
export const SAUCE_PRICE = 2.9;
export const COMBO_PRICE = 37.9;
export const COMBO_UPGRADE_PRICE = COMBO_PRICE - BURGER_PRICE;
export const MEMBER_KEY = "menfis_member";
export const MEMBER_TOKEN_KEY = "menfis_member_token";
export const DELIVERY_STORAGE_KEY = "menfis_cliente";
export const SPECIAL_OFFER_PRODUCT_ID = "triple-combo";
export const SUPER_PRODUCT_IDS = new Set([
  "tropikal-menfis",
  "tropikal-barbecue",
]);

export function isSuperProduct(item: MenuItem) {
  return SUPER_PRODUCT_IDS.has(item.id);
}

export function requiresSpiceLevel(item: MenuItem) {
  return item.id === "tropikal-barbecue";
}

export const MEAT_POINT_OPTIONS = [
  { label: "Ao ponto", copy: "Centro suculento" },
  { label: "Bem passada", copy: "Mais firme" },
  { label: "Mal passada", copy: "Mais vermelha" },
];

export const SAUCE_OPTIONS = [
  { label: "Maionse Grill", image: "/EXTRAS/MaioneseBarbecue.jpg" },
  { label: "Maionese Alho Frito", image: "/EXTRAS/MaionseAlhoFrito.jpg" },
];

export const DRINK_OPTIONS = [
  { id: "coca-cola", label: "Coca-Cola", comboPrice: 2, image: "/EXTRAS/cocacola.png" },
  { id: "guarana", label: "Guaraná", comboPrice: 2, image: "/EXTRAS/Gurarana.jpg" },
  { id: "coca-zero", label: "Coca-Cola Zero", comboPrice: 2, image: "/EXTRAS/cocazero.jpg" },
  { id: "guarana-zero", label: "Guaraná Zero", comboPrice: 0, image: "/EXTRAS/GuraranaZero.jpg" },
  { id: "agua-com-gas", label: "Água com gás", comboPrice: 0, image: "/EXTRAS/aguaComGas.png" },
];

export const EXTRA_OPTIONS = [
  { id: "extra-queijo", label: "Extra queijo", price: 2, image: "/EXTRAS/queijo.jpg" },
  { id: "extra-ovo", label: "Ovo", price: 2.5, image: "/EXTRAS/ovo.jpg" },
  { id: "extra-picles", label: "Picles", price: 1.99, image: "/EXTRAS/picles.jpg" },
  { id: "extra-bacon", label: "Adicional de bacon", price: 5.9, image: "/EXTRAS/bacon.jpg" },
  { id: "extra-cheddar", label: "Adicional de cheddar", price: 6.9, image: "/queijo.jpg" },
  { id: "extra-maionese-barbecue", label: "Maionse Grill", price: 2.5, image: "/EXTRAS/MaioneseBarbecue.jpg" },
  { id: "extra-maionese-alho-frito", label: "Maionese Alho Frito", price: 2.5, image: "/EXTRAS/MaionseAlhoFrito.jpg" },
  { id: "coca-cola", label: "Coca-Cola", price: 9.9, image: "/EXTRAS/cocacola.png" },
  { id: "guarana", label: "Guaraná", price: 9.9, image: "/EXTRAS/Gurarana.jpg" },
  { id: "coca-zero", label: "Coca-Cola Zero", price: 9.9, image: "/EXTRAS/cocazero.jpg" },
  { id: "guarana-zero", label: "Guaraná Zero", price: 9.9, image: "/EXTRAS/GuraranaZero.jpg" },
  { id: "agua-com-gas", label: "Água com gás", price: 6.9, image: "/EXTRAS/aguaComGas.png" },
];

export const LEMONADE_TOPPING_OPTIONS = [
  { id: "topping-chantilly", label: "Chantilly", price: 3, image: "/logo_M.jpeg" },
  { id: "topping-espuma-ginger", label: "Espuma Ginger", price: 3, image: "/logo_M.jpeg" },
  { id: "adicional-vodka", label: "Adicional de Vodka", price: 6.5, image: "/logo_M.jpeg" },
];

export const SWEET_BOX_REQUIRED_COUNT = 4;
export const SWEET_PREMIUM_PRICE = 0;
export const SWEET_CLASSIC_PRODUCT_ID = "sweet-menfis-classic";
export const SWEET_PLUS_PRODUCT_ID = "sweet-menfis-plus";
export const SWEET_CLASSIC_OPTIONS = [
  { id: "brigadeiro", label: "Brigadeiro", price: 0, premium: false },
  { id: "beijinho", label: "Beijinho", price: 0, premium: false },
  { id: "cajuzinho", label: "Cajuzinho", price: 0, premium: false },
  { id: "casadinho", label: "Casadinho", price: 0, premium: false },
];
export const SWEET_PLUS_OPTIONS = [
  { id: "bala-baiana", label: "Bala baiana", price: SWEET_PREMIUM_PRICE, premium: true },
  { id: "ninho-nutella", label: "Ninho com Nutella", price: SWEET_PREMIUM_PRICE, premium: true },
  { id: "churros", label: "Churros", price: SWEET_PREMIUM_PRICE, premium: true },
  { id: "cafe", label: "Café", price: SWEET_PREMIUM_PRICE, premium: true },
];
export const SWEET_OPTIONS = [...SWEET_CLASSIC_OPTIONS, ...SWEET_PLUS_OPTIONS];

const EXTRA_CARNE_OPTION = {
  id: "extra-carne",
  label: "Adicional de carne",
  price: 9.9,
  image: "/carne.jpg",
};

const EXTRA_FRANGO_OPTION = {
  id: "extra-frango",
  label: "Adicional de frango",
  price: 9.9,
  image: "/AdicionalFrango.jpg",
};

export const COMBO_DRINK_SURCHARGE_PRODUCT_ID: Record<string, string> = {
  "coca-cola": "combo-coca-adicional",
  guarana: "combo-coca-adicional",
  "coca-zero": "combo-coca-adicional",
};

export function imageSrc(image?: StaticImageData | string) {
  if (!image) return "";
  return typeof image === "string" ? image : image.src;
}

export function isChickenProduct(item: MenuItem) {
  return item.id.includes("chicken");
}

export function isNuggetsProduct(item: MenuItem) {
  return item.id.includes("nuggets");
}

export function isSpecialOfferOnlyProduct(item: MenuItem) {
  return item.id === SPECIAL_OFFER_PRODUCT_ID;
}

function itemText(item: MenuItem) {
  return `${item.id} ${item.name} ${item.tags.join(" ")} ${item.eyebrow}`.toLowerCase();
}

function productFamilyRank(item: MenuItem) {
  const text = itemText(item);
  if (text.includes("chicken")) return 1;
  if (text.includes("bacon")) return 2;
  return 0;
}

function burgerTierRank(item: MenuItem) {
  return item.name.toLocaleUpperCase("pt-BR").includes("BIG") ? 1 : 0;
}

function comboTierRank(item: MenuItem) {
  const name = item.name.toLocaleUpperCase("pt-BR");
  if (name.includes("SUPER")) return 2;
  if (name.includes("BIG")) return 1;
  return 0;
}

function comboFamilyRank(item: MenuItem) {
  const name = item.name.toLocaleUpperCase("pt-BR");
  if (name.includes("CHICKEN")) return 1;
  if (name.includes("BACON")) return 2;
  return 0;
}

export function sortComboRows<T extends MenuItem>(items: T[]) {
  return [...items].sort((a, b) =>
    comboTierRank(a) - comboTierRank(b) ||
    comboFamilyRank(a) - comboFamilyRank(b) ||
    a.name.localeCompare(b.name),
  );
}

export function menuItemNameLines(item: MenuItem) {
  if (item.category !== "combo") return [item.name];
  const flavorMatch = item.name.match(/\s+(Chicken|Bacon)$/i);
  if (!flavorMatch || flavorMatch.index === undefined) return [item.name];
  return [item.name.slice(0, flavorMatch.index), flavorMatch[1]];
}

function friesFamilyRank(item: MenuItem) {
  const text = itemText(item);
  if (text.includes("nugget")) return 1;
  return 0;
}

function sizeRank(item: MenuItem) {
  const text = itemText(item);
  if (text.includes("pequena") || text.includes("90g")) return 0;
  if (text.includes("media") || text.includes("média") || text.includes("180g")) return 1;
  if (text.includes("grande") || text.includes("270g")) return 2;
  return 9;
}

function categoryRank(item: MenuItem) {
  if (item.category === "combo") return 0;
  if (item.category === "burger") return 1;
  if (item.category === "fries") return 2;
  if (item.category === "sweet") return 3;
  if (item.category === "bebida") return 4;
  return 5;
}

export function sortCatalogItems<T extends MenuItem>(items: T[]) {
  return [...items].sort((a, b) => {
    if (a.category === "combo" && b.category === "combo") {
      return (
        comboTierRank(a) - comboTierRank(b) ||
        comboFamilyRank(a) - comboFamilyRank(b) ||
        a.name.localeCompare(b.name)
      );
    }
    if (a.category === "burger" && b.category === "burger") {
      return (
        burgerTierRank(a) - burgerTierRank(b) ||
        productFamilyRank(a) - productFamilyRank(b) ||
        a.price - b.price ||
        a.name.localeCompare(b.name)
      );
    }
    if (a.category === "fries" && b.category === "fries") {
      return (
        friesFamilyRank(a) - friesFamilyRank(b) ||
        sizeRank(a) - sizeRank(b) ||
        a.price - b.price ||
        a.name.localeCompare(b.name)
      );
    }
    if (a.category === b.category) {
      return a.price - b.price || a.name.localeCompare(b.name);
    }
    return categoryRank(a) - categoryRank(b);
  });
}

export function isSweetBoxProduct(item: MenuItem) {
  return item.id === SWEET_CLASSIC_PRODUCT_ID || item.id === SWEET_PLUS_PRODUCT_ID;
}

export function isSweetPlusProduct(item: MenuItem) {
  return item.id === SWEET_PLUS_PRODUCT_ID;
}

export function getSweetOptionsForItem(item: MenuItem) {
  return isSweetPlusProduct(item) ? SWEET_PLUS_OPTIONS : SWEET_CLASSIC_OPTIONS;
}

export function sweetCardPriceLabel(item: MenuItem) {
  return fmt(item.price);
}

export function getExtraOptionsForItem(item: MenuItem) {
  if (isLemonadeProduct(item)) {
    return LEMONADE_TOPPING_OPTIONS;
  }
  if (item.category !== "burger" && item.category !== "combo") {
    return EXTRA_OPTIONS;
  }
  return [
    isChickenProduct(item) ? EXTRA_FRANGO_OPTION : EXTRA_CARNE_OPTION,
    ...EXTRA_OPTIONS,
  ];
}

export function isLemonadeProduct(item: MenuItem) {
  return item.id.endsWith("-lemonade");
}

export function requiredCustomizerCount(item: MenuItem) {
  return item.id === "combo2" ||
    item.id === "chicken-super-combo" ||
    item.id === "bacon-super-combo"
    ? 2
    : 1;
}

export function readMemberProfile(): MemberProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MEMBER_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.phone) return null;
    return {
      id: data.id ? Number(data.id) : undefined,
      name: String(data.name ?? ""),
      email: data.email ? String(data.email) : undefined,
      phone: String(data.phone ?? ""),
      birthday: data.birthday ? String(data.birthday) : undefined,
      avatarUrl: data.avatarUrl ? String(data.avatarUrl) : undefined,
      defaultAddress: data.defaultAddress ?? undefined,
      hasPassword: data.hasPassword === undefined ? true : Boolean(data.hasPassword),
      freeShipping: Boolean(data.freeShipping),
      orders: Number(data.orders ?? data.orderCount ?? 0),
      rewards: Number(data.rewards ?? Math.floor(Number(data.orders ?? 0) / 10)),
      clubLevel: data.clubLevel ?? data.club_level ?? undefined,
      clubExpiresAt: data.clubExpiresAt ?? data.club_expires_at ?? undefined,
      createdAt: Number(data.createdAt ?? Date.now()),
    };
  } catch {
    return null;
  }
}

export function readSavedDelivery() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(DELIVERY_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function isEmail(value: string) {
  if (!value.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function buildBurger(builder: BuilderState): Omit<CartItem, "qty"> {
  const additions = [
    builder.cheese ? "Extra queijo" : "",
    builder.sauce ? "Molho extra" : "",
  ].filter(Boolean);
  const price =
    BURGER_PRICE +
    (builder.cheese ? CHEESE_PRICE : 0) +
    (builder.sauce ? SAUCE_PRICE : 0);

  return {
    id: additions.length
      ? `burger-${additions.join("-").toLowerCase().replace(/\s+/g, "-")}`
      : BURGER_ID,
    name: additions.length
      ? `MENFI'S BURGER (${additions.join(" + ")})`
      : "MENFI'S BURGER",
    price,
  };
}
