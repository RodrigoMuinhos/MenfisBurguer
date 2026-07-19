import { MENU_ITEMS } from "@/features/catalog/menu";
import type { MenuItem, ProductCategory } from "@/features/catalog/types";
import type { MemberProfile } from "../shared";
import { requiredCustomizerCount } from "../shared";
import { DEFAULT_SPECIAL_OFFER_SETTINGS } from "@/components/order/checkout";

export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/backend";
export const DEFAULT_FEATURED_PRODUCT_ID = DEFAULT_SPECIAL_OFFER_SETTINGS.productId;
export const TRIPLE_COMBO_IMAGE = "/menu/supercombomnfis.png";
export const PUBLIC_SETTINGS_CACHE_KEY = "menfis_public_settings_cache_v2";
export const PRICING_ROWS_CACHE_KEY = "menfis_pricing_rows_cache_v2";
export const CUSTOMIZER_ADDON_IDS = new Set([
  "extra-carne",
  "extra-frango",
  "extra-queijo",
  "extra-ovo",
  "extra-picles",
  "extra-bacon",
  "extra-cheddar",
  "extra-maionese-barbecue",
  "extra-maionese-alho-frito",
]);

export function hasRequiredCustomerProfile(profile: MemberProfile | null) {
  return Boolean(
    profile?.name?.trim() &&
      profile.phone?.replace(/\D/g, "").length >= 10 &&
      profile.hasPassword !== false,
  );
}

export function readJsonCache<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJsonCache(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Cache is best-effort; never block the menu because storage is full or unavailable.
  }
}

export function applyPricingToMenu(rows: Array<Record<string, unknown>>) {
  const defaults = new Map(MENU_ITEMS.map((item) => [item.id, item]));
  return rows
    .filter((row) => row.active !== false)
    .map((row) => {
      const id = String(row.id ?? "");
      const item = defaults.get(id);
      if (!item) return pricingRowToMenuItem(row);
      const salePrice = Number(row.salePrice ?? row.sale_price ?? item.price);
      const originalPrice = Number(row.originalPrice ?? row.original_price ?? item.originalPrice ?? 0);
      const imageUrl = canonicalProductImage(item.id, String(row.imageUrl ?? row.image_url ?? ""));
      const name = String(row.name ?? "").trim();
      const notes = String(row.notes ?? "").trim();
      const categoryLabel = String(row.category ?? "").trim();
      const category = pricingKindToMenuCategory(String(row.kind ?? ""), categoryLabel);
      const nextCategory =
        categoryLabel || row.kind ? category : item.category;
      const nextEyebrow = categoryLabel || labelCategory(nextCategory);
      const nextItem: MenuItem = {
        ...item,
        name: name || item.name,
        eyebrow: nextEyebrow,
        desc: notes || item.desc,
        price: Number.isFinite(salePrice) && salePrice > 0 ? salePrice : item.price,
        originalPrice:
          Number.isFinite(originalPrice) && originalPrice > salePrice
            ? originalPrice
            : undefined,
        image: imageUrl || "/logo_M.jpeg",
        tags: [nextEyebrow].filter(Boolean),
        category: nextCategory,
      };
      return nextItem;
    })
    .filter((item): item is MenuItem => Boolean(item));
}

export function pricingRowToMenuItem(row: Record<string, unknown>): MenuItem | null {
  const id = String(row.id ?? "");
  const name = String(row.name ?? "").trim();
  const salePrice = Number(row.salePrice ?? row.sale_price ?? 0);
  if (!id || !name || !Number.isFinite(salePrice) || salePrice <= 0) return null;
  const originalPrice = Number(row.originalPrice ?? row.original_price ?? 0);
  const kind = String(row.kind ?? "");
  const categoryLabel = String(row.category ?? "").trim();
  const category = pricingKindToMenuCategory(kind, categoryLabel);
  return {
    id,
    name,
    eyebrow: categoryLabel || labelCategory(category),
    desc: String(row.notes ?? "").trim() || `${name} cadastrado em Custos e Precificacao.`,
    price: salePrice,
    originalPrice: Number.isFinite(originalPrice) && originalPrice > salePrice ? originalPrice : undefined,
    image: canonicalProductImage(id, String(row.imageUrl ?? row.image_url ?? "")),
    tags: [categoryLabel || labelCategory(category)].filter(Boolean),
    category,
  };
}

export function canonicalProductImage(id: string, imageUrl: string) {
  return id === DEFAULT_FEATURED_PRODUCT_ID ? TRIPLE_COMBO_IMAGE : imageUrl;
}

export function pricingKindToMenuCategory(kind: string, categoryLabel = ""): ProductCategory {
  if (kind === "combo") return "combo";
  if (kind === "drink") return "bebida";
  if (categoryLabel.toLowerCase().includes("sweet")) return "sweet";
  if (
    categoryLabel.toLowerCase().includes("galeria de fritas") ||
    categoryLabel.toLowerCase().includes("fries") ||
    categoryLabel.toLowerCase().includes("batata")
  ) return "fries";
  if (kind === "side") return "extra";
  return "burger";
}

export function labelCategory(category: ProductCategory) {
  if (category === "combo") return "Pedido completo";
  if (category === "bebida") return "Bebida";
  if (category === "extra") return "Extra";
  if (category === "fries") return "Galeria de Fritas";
  if (category === "sweet") return "Sweet";
  return "Burger";
}

export function comboPotatoComponent(item: MenuItem) {
  return requiredCustomizerCount(item) > 1
    ? "Batata Frita 200g"
    : "Batata Frita 100g";
}

export function freshApiUrl(path: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${API_URL}${path}${separator}_=${Date.now()}`;
}

export function preloadClientImages(srcs: Array<string | undefined>) {
  if (typeof window === "undefined") return;
  srcs
    .map((src) => String(src ?? "").trim())
    .filter(Boolean)
    .forEach((src) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = src;
    });
}

