import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import {
  Beef,
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Flame,
  Gift,
  Heart,
  Home,
  MessageCircle,
  Package,
  Percent,
  Plus,
  Search,
  ShoppingCart,
  Star,
  Tag,
  Ticket,
  Utensils,
  UserRound,
  X,
  CalendarClock,
  Candy,
  CheckCircle2,
} from "lucide-react";
import { MenuItem } from "@/features/catalog/types";
import { ROSA } from "@/utils/theme";
import { API_URL, PromoCard, PromoCardIcon, SUPPORT_WHATSAPP_URL, normalizePromoCards } from "@/components/order/checkout";
import { fmt, imageSrc, isSpecialOfferOnlyProduct, isSuperProduct, isSweetBoxProduct, MemberProfile, sortCatalogItems, sweetCardPriceLabel } from "../shared";
import { SoldOutAlertModal, SoldOutBanner, SOLD_OUT_MESSAGE } from "../SoldOutNotice";
import { SuperLaunchCard } from "../ProductParts";

export type MobileCategory = "combo" | "burger" | "super" | "fries" | "extras" | "sweet";

export const VINHO = "#65001F";
export const MAGENTA = "#B20B47";
export const PINK = "#EC1767";
export const BRAND_M_LOGO = "/logo_M.jpeg";
export const REVIEWS_STORAGE_KEY = "menfis_mobile_reviews";
export const CLOSED_HOURS_ALERT_KEY = "menfis_closed_hours_alert_seen";
export const MOBILE_CATEGORIES: Array<{
  id: MobileCategory;
  label: string;
  icon: ElementType;
}> = [
  { id: "combo", label: "Combos", icon: Package },
  { id: "burger", label: "Burgers", icon: Beef },
  { id: "super", label: "SUPER", icon: Star },
  { id: "fries", label: "Fries", icon: Utensils },
  { id: "sweet", label: "Sweet", icon: Candy },
  { id: "extras", label: "Extras", icon: Plus },
];

const SEARCHABLE_ITEM_FIELDS = ["name", "desc", "tags"] as const;

export function itemSearchText(item: MenuItem) {
  return SEARCHABLE_ITEM_FIELDS.map((field) => {
    const value = item[field];
    return Array.isArray(value) ? value.join(" ") : value;
  })
    .join(" ")
    .toLowerCase();
}

export function categoryMatches(item: MenuItem, category: MobileCategory) {
  if (category === "super") return isSuperProduct(item);
  if (category === "burger") {
    return item.category === "burger" && !isSuperProduct(item);
  }
  if (category === "combo") return item.category === "combo" && !item.highlight;
  if (category === "fries") return item.category === "fries";
  if (category === "extras") return item.category === "extra" || item.category === "bebida";
  if (category === "sweet") return item.category === "sweet";
  return false;
}

export function discountPercent(item: MenuItem) {
  if (!item.originalPrice || item.originalPrice <= item.price) return 0;
  return Math.round((1 - item.price / item.originalPrice) * 100);
}
