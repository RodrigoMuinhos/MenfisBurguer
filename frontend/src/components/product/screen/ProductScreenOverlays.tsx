import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  CircleCheckBig,
  ChevronLeft,
  ChefHat,
  Loader2,
  Mail,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
  Clock3,
  Home,
  PackageSearch,
} from "lucide-react";
import { CartItem, Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { MENU_ITEMS } from "@/features/catalog/menu";
import { MenuItem, ProductCategory } from "@/features/catalog/types";
import friesPhoto from "@/imports/image-20.png";
import {
  BuilderState,
  CATEGORIES,
  COMBO_DRINK_SURCHARGE_PRODUCT_ID,
  CustomizerState,
  DRINK_OPTIONS,
  BURGER_ID,
  CHEESE_PRICE,
  MEMBER_KEY,
  MEMBER_TOKEN_KEY,
  MEAT_POINT_OPTIONS,
  MemberProfile,
  SAUCE_OPTIONS,
  SAUCE_PRICE,
  SWEET_BOX_REQUIRED_COUNT,
  buildBurger,
  fmt,
  getSweetOptionsForItem,
  getExtraOptionsForItem,
  imageSrc,
  isChickenProduct,
  isNuggetsProduct,
  isSpecialOfferOnlyProduct,
  isSuperProduct,
  isSweetBoxProduct,
  readMemberProfile,
  readSavedDelivery,
  requiredCustomizerCount,
  requiresSpiceLevel,
  sortCatalogItems,
} from "../shared";
import {
  loginCustomerSession,
  loadCustomerSession,
  logoutCustomerSession,
  requestCustomerPasswordRecovery,
  resetCustomerPassword,
  saveCustomerSession,
  updateCustomerProfile,
} from "@/services/customerSession";
import {
  BurgerBuilder,
  MenuCard,
  ProductDetailModal,
  ProductCustomizer,
  SuperLaunchCard,
} from "../ProductParts";
import { MemberModals } from "../MemberModals";
import {
  CategoryTabs,
  MemberAccessBanner,
  ProductHeader,
  ProductHero,
} from "../ProductHomeSections";
import {
  DEFAULT_SPECIAL_OFFER_SETTINGS,
  PromoCard,
  SpecialOfferSettings,
  normalizePresentationSettings,
  normalizePromoCards,
  normalizeSpecialOfferSettings,
} from "@/components/order/checkout";
import { MobileMenuExperience } from "../MobileMenuExperience";
import { MemberNotification } from "../notifications";
import { SoldOutAlertModal, SoldOutBanner, SOLD_OUT_MESSAGE } from "../SoldOutNotice";

const SPECIAL_OFFER_SESSION_KEY = "menfis_special_offer_seen";
export function BottomNavButton({
  icon: Icon,
  label,
  active,
  badge = 0,
  onClick,
}: {
  icon: ElementType;
  label: string;
  active?: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-black"
      style={{
        color: active ? VERDE : `${VERDE}75`,
        background: active ? `${ROSA}55` : "transparent",
      }}
    >
      <span className="relative">
        <Icon size={18} strokeWidth={2.4} />
        {badge > 0 && (
          <span
            className="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black"
            style={{ background: ROSA, color: VERDE, border: "2px solid #fff" }}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span>{label}</span>
    </button>
  );
}

export function specialOfferSessionKey(offer: SpecialOfferSettings, kioskMode: boolean) {
  const mode =
    kioskMode
      ? "pdv"
      : typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
        ? "mobile"
        : "desktop";
  const offerKey = `${offer.productId}-${offer.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${SPECIAL_OFFER_SESSION_KEY}:${mode}:${offerKey || "default"}`;
}

export function SpecialOfferModal({
  offer,
  onClose,
  onAdd,
  onViewMenu,
}: {
  offer: SpecialOfferSettings;
  onClose: () => void;
  onAdd: () => void;
  onViewMenu: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={offer.title}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, scale: 0.94 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative max-h-[92dvh] w-full max-w-[720px] overflow-hidden rounded-[32px] border shadow-[0_36px_110px_rgba(0,0,0,0.62)]"
        style={{ color: "#fff", borderColor: "rgba(255,63,135,.4)", background: "radial-gradient(circle at 30% 20%,#750020 0%,#2a0713 48%,#12070b 100%)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full"
          style={{ background: "rgba(18,7,11,.82)", color: "#fff", border: "1px solid rgba(255,255,255,.25)", backdropFilter: "blur(10px)" }}
          aria-label="Fechar promoção"
        >
          <X size={19} strokeWidth={2.7} />
        </button>

        <div className="grid max-h-[92dvh] overflow-y-auto md:grid-cols-[1.25fr_.85fr]">
          <div className="relative min-h-[46dvh] overflow-hidden md:min-h-[660px]">
            <div className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(circle at center,rgba(255,63,135,.24),transparent 62%)" }} />
            {offer.image ? (
              <img
                src={offer.image}
                alt={offer.title}
                className="relative z-[1] h-full w-full object-contain p-5 pt-16 drop-shadow-[0_28px_30px_rgba(0,0,0,.55)] md:p-8 md:pt-20"
                loading="eager"
              />
            ) : (
              <div className="grid h-full place-items-center" style={{ background: `${ROSA}35` }}>
                <Sparkles size={54} strokeWidth={1.7} />
              </div>
            )}
            <span
              className="absolute left-5 top-5 z-[2] rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em]"
              style={{ background: ROSA, color: "#330810", boxShadow: "0 10px 28px rgba(255,63,135,.3)" }}
            >
              Produto em destaque
            </span>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-40 bg-gradient-to-t from-[#210810] to-transparent md:hidden" />
          </div>

          <div className="relative z-[3] flex flex-col justify-center border-t border-white/10 p-6 md:border-l md:border-t-0 md:p-8">
            <p className="text-[10px] font-black uppercase tracking-[.24em] text-[#ff8fb7]">Menfi's seleciona</p>
            <h2
              className="mt-3 uppercase text-white"
              style={{
                fontFamily: "var(--menfis-font-display)",
                fontSize: "clamp(2.5rem, 9vw, 4.2rem)",
                lineHeight: 0.86,
                letterSpacing: 0,
              }}
            >
              {offer.title}
            </h2>
            <p className="mt-5 text-sm font-semibold leading-relaxed text-white/72">
              {offer.description}
            </p>
            <div className="mt-7 flex items-end justify-between gap-4 border-y border-white/10 py-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                  Peça agora por
                </p>
                <p
                  className="mt-1 text-[#ff3f87]"
                  style={{
                    fontFamily: "var(--menfis-font-display)",
                    fontSize: "3.2rem",
                    lineHeight: 0.9,
                  }}
                >
                  {fmt(offer.price)}
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={onAdd}
                className="flex min-h-14 items-center justify-center gap-2 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wide transition-transform hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg,#ff3f87,#ff668f)", color: "#25070f", boxShadow: "0 16px 36px rgba(255,63,135,.3)" }}
              >
                {offer.primaryButton} <Plus size={18} />
              </button>
              <button
                type="button"
                onClick={onViewMenu}
                className="min-h-12 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-wide text-white/75"
                style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)" }}
              >
                {offer.secondaryButton}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
