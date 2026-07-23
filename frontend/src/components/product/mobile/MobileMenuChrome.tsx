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
import { BRAND_M_LOGO, MAGENTA, MOBILE_CATEGORIES, PINK, REVIEWS_STORAGE_KEY, VINHO, type MobileCategory } from "./mobileMenuConfig";

export function ClosedHoursModal({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-end bg-[rgba(101,0,31,0.42)] px-3 pb-4"
      onClick={onClose}
    >
      <section
        className="w-full rounded-[28px] bg-white p-5 shadow-[0_22px_60px_rgba(101,0,31,0.24)]"
        style={{ color: VINHO }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest opacity-55">
              Atendimento indisponível
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight">
              Estamos fechados no momento
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: `${ROSA}55`, color: VINHO }}
            aria-label="Fechar aviso"
          >
            <X size={21} strokeWidth={2.8} />
          </button>
        </div>

        <div className="mt-4 rounded-2xl p-4 text-sm font-bold leading-relaxed" style={{ background: `${ROSA}35` }}>
          <p>{message || "Assim que abrirmos, você será informado e poderá finalizar seu pedido."}</p>
        </div>

        <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: `${VINHO}12` }}>
          <div className="flex items-center gap-2 text-sm font-black uppercase">
            <CalendarClock size={18} strokeWidth={2.6} style={{ color: PINK }} />
            Pedido temporariamente indisponível
          </div>
          <div className="mt-3 grid gap-2 text-sm font-bold opacity-75">
            <p>Você pode continuar montando o carrinho.</p>
            <p>O envio será liberado no próximo horário configurado.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-full items-center justify-center rounded-2xl text-sm font-black uppercase tracking-wide"
            style={{ border: `1px solid ${VINHO}14`, color: VINHO }}
          >
            Entendi
          </button>
        </div>
      </section>
    </div>
  );
}

export function BrandMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full"
      style={{
        background: "#fff",
        color: VINHO,
        border: `2px solid ${ROSA}`,
        boxShadow: "0 10px 22px rgba(101,0,31,0.12)",
      }}
      aria-label="Abrir menu"
      onClick={onClick}
    >
      <Image
        src={BRAND_M_LOGO}
        alt="Menfi's"
        fill
        sizes="48px"
        style={{ objectFit: "cover" }}
      />
    </button>
  );
}

export function IconButton({
  label,
  icon: Icon,
  onClick,
  badge = 0,
  filled = false,
}: {
  label: string;
  icon: ElementType;
  onClick: () => void;
  badge?: number;
  filled?: boolean;
}) {
  return (
    <button
      type="button"
      className="relative flex h-12 w-12 items-center justify-center rounded-full"
      style={{
        background: filled ? ROSA : "#fff",
        color: VINHO,
        border: filled ? "none" : `1px solid ${VINHO}12`,
      }}
      aria-label={label}
      onClick={onClick}
    >
      <Icon size={filled ? 24 : 21} strokeWidth={filled ? 2.7 : 2.4} />
      {badge > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black"
          style={{ background: PINK, color: "#fff" }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export function CategoryNav({
  category,
  setCategory,
  showKioskOnly = false,
}: {
  category: MobileCategory;
  setCategory: (value: MobileCategory) => void;
  showKioskOnly?: boolean;
}) {
  return (
    <nav
      className="sticky top-0 z-40 flex gap-3 overflow-x-auto border-y bg-white px-4 py-3 shadow-[0_12px_26px_rgba(101,0,31,0.08)]"
      style={{ borderColor: `${VINHO}10` }}
    >
      {MOBILE_CATEGORIES.filter((tab) => showKioskOnly || tab.id !== "lemonade").map((tab) => {
        const Icon = tab.icon;
        const active = category === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategory(tab.id)}
            className="flex min-w-[92px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-[11px] font-black uppercase"
            style={{
              background: active ? VINHO : "#fff",
              color: active ? ROSA : VINHO,
              border: `1px solid ${active ? VINHO : `${VINHO}12`}`,
              boxShadow: active
                ? "0 12px 24px rgba(101,0,31,0.22)"
                : "0 8px 20px rgba(101,0,31,0.06)",
              transition:
                "background 160ms ease, color 160ms ease, transform 160ms ease",
              transform: active ? "translateY(-2px)" : "translateY(0)",
            }}
          >
            <Icon size={21} strokeWidth={2.3} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export function OfferCarousel({
  offers,
  onOpenReviews,
}: {
  offers: PromoCard[];
  onOpenReviews: () => void;
}) {
  const visibleOffers = normalizePromoCards(offers).filter((offer) => offer.enabled);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeOffer = visibleOffers[activeIndex] ?? visibleOffers[0];
  const hasMultipleOffers = visibleOffers.length > 1;

  useEffect(() => {
    if (activeIndex <= visibleOffers.length - 1) return;
    setActiveIndex(0);
  }, [activeIndex, visibleOffers.length]);

  useEffect(() => {
    if (!hasMultipleOffers) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % visibleOffers.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [hasMultipleOffers, visibleOffers.length]);

  if (visibleOffers.length === 0) return null;
  const Icon = promoCardIcon(activeOffer.icon);
  const previousOffer = () =>
    setActiveIndex((current) => (current - 1 + visibleOffers.length) % visibleOffers.length);
  const nextOffer = () =>
    setActiveIndex((current) => (current + 1) % visibleOffers.length);

  return (
    <section className="relative z-10 mt-2 px-0 pb-1">
      <button
        type="button"
        onClick={onOpenReviews}
        className="relative block min-h-[132px] w-full overflow-hidden rounded-[18px] px-4 py-4 text-left text-white"
        style={{ background: VINHO }}
      >
        <span
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20"
          style={{ background: ROSA }}
        />
        <span
          className="absolute right-3 top-3 flex min-h-14 min-w-16 flex-col items-center justify-center rounded-2xl px-2 text-center"
          style={{ background: ROSA, color: VINHO }}
        >
          <span className="text-2xl font-black leading-none">
            {activeOffer.value}
          </span>
          <span className="mt-0.5 max-w-[58px] text-[10px] font-black uppercase leading-[0.95]">
            {activeOffer.suffix}
          </span>
        </span>

        <span className="grid max-w-[calc(100%-82px)] grid-cols-[48px_minmax(0,1fr)] gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: ROSA, color: VINHO }}
          >
            <Icon size={24} strokeWidth={2.6} />
          </span>
          <span className="min-w-0 pt-0.5">
            <span className="block text-[13px] font-black uppercase leading-tight text-white">
              {activeOffer.eyebrow}
            </span>
            <span
              className="mt-1 block truncate text-[clamp(1.75rem,8vw,2.35rem)] font-black uppercase leading-[0.9]"
              style={{ color: ROSA }}
            >
              {activeOffer.title}
            </span>
            <span className="mt-2 block max-w-[210px] text-[11px] font-black uppercase leading-tight opacity-90">
              {activeOffer.copy}
            </span>
          </span>
        </span>

        <span className="absolute bottom-3 left-4 right-4 h-1 overflow-hidden rounded-full bg-white/10">
          <span
            className="block h-full rounded-full transition-all duration-300"
            style={{
              background: ROSA,
              width: hasMultipleOffers ? `${((activeIndex + 1) / visibleOffers.length) * 100}%` : "100%",
            }}
          />
        </span>
      </button>
      {hasMultipleOffers && (
        <div className="pointer-events-none absolute inset-y-0 left-2 right-2 flex items-center justify-between">
          <button
            type="button"
            onClick={previousOffer}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-lg"
            style={{ color: VINHO }}
            aria-label="Promoção anterior"
          >
            <ChevronLeft size={18} strokeWidth={2.8} />
          </button>
          <button
            type="button"
            onClick={nextOffer}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-lg"
            style={{ color: VINHO }}
            aria-label="Próxima promoção"
          >
            <ChevronRight size={18} strokeWidth={2.8} />
          </button>
        </div>
      )}
    </section>
  );
}

function promoCardIcon(icon: PromoCardIcon): ElementType {
  switch (icon) {
    case "flame":
      return Flame;
    case "ticket":
      return Ticket;
    case "tag":
      return Tag;
    case "percent":
      return Percent;
    case "clock":
      return Clock;
    case "star":
      return Star;
    case "heart":
      return Heart;
    case "burger":
      return Beef;
    case "fries":
      return Utensils;
    case "gift":
    default:
      return Gift;
  }
}

