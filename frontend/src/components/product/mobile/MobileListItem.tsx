import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import {
  Beef,
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Drumstick,
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
import { PINK, VINHO, discountPercent } from "./mobileMenuConfig";

export function MobileListItem({
  item,
  onAdd,
  onOpen,
}: {
  item: MenuItem;
  onAdd: () => void;
  onOpen: () => void;
}) {
  const isSmoore = item.id === "smash-nutella-marshmallow";
  return (
    <article className="grid grid-cols-[minmax(0,1fr)_112px] gap-3 overflow-hidden rounded-[18px] bg-white p-3 shadow-sm min-[390px]:grid-cols-[minmax(0,1fr)_132px]">
      <button type="button" onClick={onOpen} className="min-w-0 text-left">
        <h3
          className="line-clamp-2 uppercase"
          style={{
            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
            fontSize: "1.45rem",
            lineHeight: 0.96,
            letterSpacing: 0,
          }}
        >
          {item.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm font-semibold opacity-70">
          {item.desc}
        </p>
        {isSmoore && (
          <div className="mt-2 grid gap-1">
            {["Nutella", "Marshmallow", "Chocolate"].map((feature) => (
              <span key={feature} className="flex items-center gap-1.5 text-[10px] font-black">
                <CheckCircle2 size={12} strokeWidth={2.7} style={{ color: "#16A34A" }} />
                {feature}
              </span>
            ))}
          </div>
        )}
        <p
          className="mt-2 w-fit rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{ background: `${ROSA}66` }}
        >
          {item.tags[0] ?? "Menfi's"}
        </p>
        <PriceBlock item={item} className="mt-2" />
      </button>
      <div
        className="relative h-28 overflow-hidden rounded-2xl min-[390px]:h-32"
        style={{ background: "#fff" }}
      >
        <button
          type="button"
          onClick={onOpen}
          className="absolute inset-0"
          aria-label={`Ver detalhes de ${item.name}`}
        >
          {item.image ? (
            <Image
              src={imageSrc(item.image)}
              alt={item.name}
              fill
              sizes="132px"
              style={{
                objectFit: "contain",
                objectPosition: "center",
                filter: "saturate(1.12) contrast(1.05)",
                transform: "scale(1.18)",
              }}
            />
          ) : null}
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-2xl shadow-lg"
          style={{ background: PINK, color: "#fff" }}
          aria-label={`Adicionar ${item.name}`}
        >
          <Plus size={22} strokeWidth={2.8} />
        </button>
      </div>
    </article>
  );
}

export function PriceBlock({
  item,
  className = "",
  size = "list",
}: {
  item: MenuItem;
  className?: string;
  size?: "list" | "card";
}) {
  const discount = discountPercent(item);
  return (
    <div className={className}>
      {discount > 0 && item.originalPrice ? (
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-black uppercase line-through opacity-45">
            {fmt(item.originalPrice)}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-black"
            style={{ background: `${ROSA}66`, color: VINHO }}
          >
            -{discount}%
          </span>
        </div>
      ) : null}
      <p
        style={{
          fontFamily: "'Bebas Neue','Arial Black',sans-serif",
          fontSize: size === "card" ? "1.55rem" : "1.45rem",
          lineHeight: 1,
          color: VINHO,
        }}
      >
        {isSweetBoxProduct(item) ? sweetCardPriceLabel(item) : fmt(item.price)}
      </p>
    </div>
  );
}

