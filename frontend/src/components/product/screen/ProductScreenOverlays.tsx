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
        className="relative max-h-[86dvh] w-full max-w-[390px] overflow-hidden rounded-[26px] bg-white shadow-[0_28px_80px_rgba(0,0,0,0.35)] sm:max-w-lg"
        style={{ color: VERDE }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full"
          style={{ background: "rgba(255,255,255,0.92)", color: VERDE, border: `1px solid ${VERDE}14` }}
          aria-label="Fechar promoção"
        >
          <X size={19} strokeWidth={2.7} />
        </button>

        <div className="max-h-[86dvh] overflow-y-auto">
          <div className="relative aspect-[1.18/1] bg-white sm:aspect-[1.45/1]">
            {offer.image ? (
              <img
                src={offer.image}
                alt={offer.title}
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="grid h-full place-items-center" style={{ background: `${ROSA}35` }}>
                <Sparkles size={54} strokeWidth={1.7} />
              </div>
            )}
            <span
              className="absolute left-4 top-4 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em]"
              style={{ background: VERDE, color: ROSA }}
            >
              Destaque especial do mês
            </span>
          </div>

          <div className="p-5 sm:p-6">
            <h2
              className="uppercase"
              style={{
                fontFamily: "var(--menfis-font-display)",
                fontSize: "clamp(2.1rem, 9vw, 3.25rem)",
                lineHeight: 0.9,
                letterSpacing: 0,
              }}
            >
              {offer.title}
            </h2>
            <p className="mt-3 text-sm font-semibold leading-relaxed opacity-75 sm:text-base">
              {offer.description}
            </p>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-45">
                  Preço especial
                </p>
                <p
                  className="mt-1"
                  style={{
                    fontFamily: "var(--menfis-font-display)",
                    fontSize: "2.6rem",
                    lineHeight: 0.9,
                  }}
                >
                  {fmt(offer.price)}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
              <button
                type="button"
                onClick={onAdd}
                className="min-h-13 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wide"
                style={{ background: VERDE, color: ROSA }}
              >
                {offer.primaryButton}
              </button>
              <button
                type="button"
                onClick={onViewMenu}
                className="min-h-13 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-wide"
                style={{ background: "#fff", color: VERDE, border: `1.5px solid ${VERDE}18` }}
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
