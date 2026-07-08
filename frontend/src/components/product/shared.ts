import type { StaticImageData } from "next/image";
import { Beef, Drumstick, Package, Plus } from "lucide-react";
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
  { id: "chicken", label: "Chicken", Icon: Drumstick },
  { id: "bacon", label: "Bacon", Icon: Beef },
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

export const MEAT_POINT_OPTIONS = [
  { label: "Ao ponto", copy: "Centro suculento" },
  { label: "Bem passada", copy: "Mais firme" },
  { label: "Mal passada", copy: "Mais vermelha" },
];

export const SAUCE_OPTIONS = [
  { label: "Maionese Barbecue", image: "/EXTRAS/MaioneseBarbecue.jpg" },
  { label: "Maionese Alho Frito", image: "/EXTRAS/MaionseAlhoFrito.jpg" },
];

export const DRINK_OPTIONS = [
  { id: "guarana-zero", label: "Guaraná Zero", comboPrice: 0, image: "/EXTRAS/Gurarana.jpg" },
  { id: "coca-zero", label: "Coca-Cola Zero", comboPrice: 2, image: "/EXTRAS/cocazero.jpg" },
  { id: "agua-com-gas", label: "Água com gás", comboPrice: 0, image: "/EXTRAS/aguaComGas.png" },
];

export const EXTRA_OPTIONS = [
  { id: "extra-queijo", label: "Extra queijo", price: 2, image: "/EXTRAS/queijo.jpg" },
  { id: "extra-ovo", label: "Ovo", price: 2.5, image: "/EXTRAS/ovo.jpg" },
  { id: "extra-bacon", label: "Adicional de bacon", price: 5.9, image: "/EXTRAS/bacon.jpg" },
  { id: "extra-cheddar", label: "Adicional de cheddar", price: 6.9, image: "/queijo.jpg" },
  { id: "batata-pequena", label: "Batata frita pequena", price: 9.9, image: "/EXTRAS/batata.jpg" },
  { id: "batata-media", label: "Batata frita média", price: 14.9, image: "/EXTRAS/batata.jpg" },
  { id: "batata", label: "Batata frita grande", price: 19.9, image: "/EXTRAS/batata.jpg" },
  { id: "nuggets-100g", label: "Menfi's Nuggets 100g", price: 12.9, image: "/nugget.jpeg" },
  { id: "nuggets-10un", label: "Menfi's Nuggets 10 unidades", price: 18.9, image: "/nugget.jpeg" },
  { id: "nuggets-grande", label: "Menfi's Nuggets Grande", price: 29.9, image: "/nugget.jpeg" },
  { id: "extra-maionese-barbecue", label: "Maionese Barbecue", price: 2, image: "/EXTRAS/MaioneseBarbecue.jpg" },
  { id: "extra-maionese-alho-frito", label: "Maionese Alho Frito", price: 2, image: "/EXTRAS/MaionseAlhoFrito.jpg" },
  { id: "coca-zero", label: "Coca-Cola Zero", price: 8.9, image: "/EXTRAS/cocazero.jpg" },
  { id: "guarana-zero", label: "Guaraná Zero", price: 6.9, image: "/EXTRAS/Gurarana.jpg" },
  { id: "agua-com-gas", label: "Água com gás", price: 5.9, image: "/EXTRAS/aguaComGas.png" },
];

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
  "coca-zero": "combo-coca-adicional",
};

export function imageSrc(image?: StaticImageData | string) {
  if (!image) return "";
  return typeof image === "string" ? image : image.src;
}

export function isChickenProduct(item: MenuItem) {
  return item.id.includes("chicken");
}

export function getExtraOptionsForItem(item: MenuItem) {
  if (item.category !== "burger" && item.category !== "combo") {
    return EXTRA_OPTIONS;
  }
  return [
    isChickenProduct(item) ? EXTRA_FRANGO_OPTION : EXTRA_CARNE_OPTION,
    ...EXTRA_OPTIONS,
  ];
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
