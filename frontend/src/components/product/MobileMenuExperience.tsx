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
} from "lucide-react";
import { MenuItem } from "@/features/catalog/types";
import { ROSA } from "@/utils/theme";
import { API_URL, PromoCard, PromoCardIcon, SUPPORT_WHATSAPP_URL, normalizePromoCards } from "@/components/order/checkout";
import { fmt, imageSrc, isSpecialOfferOnlyProduct, isSuperProduct, isSweetBoxProduct, MemberProfile, sortCatalogItems, sweetCardPriceLabel } from "./shared";
import { SoldOutAlertModal, SoldOutBanner, SOLD_OUT_MESSAGE } from "./SoldOutNotice";

type MobileCategory = "promo" | "combo" | "burger" | "chicken" | "bacon" | "super" | "fries" | "extras" | "sweet";

const VINHO = "#65001F";
const MAGENTA = "#B20B47";
const PINK = "#EC1767";
const BRAND_M_LOGO = "/logo_M.jpeg";
const REVIEWS_STORAGE_KEY = "menfis_mobile_reviews";
const CLOSED_HOURS_ALERT_KEY = "menfis_closed_hours_alert_seen";
const MOBILE_CATEGORIES: Array<{
  id: MobileCategory;
  label: string;
  icon: ElementType;
}> = [
  { id: "promo", label: "Promocoes", icon: Flame },
  { id: "combo", label: "Combos", icon: Package },
  { id: "burger", label: "Burgers", icon: Beef },
  { id: "chicken", label: "Chicken", icon: Drumstick },
  { id: "bacon", label: "Bacon", icon: Utensils },
  { id: "super", label: "SUPER", icon: Star },
  { id: "fries", label: "Fries", icon: Utensils },
  { id: "sweet", label: "Sweet", icon: Candy },
  { id: "extras", label: "Extras", icon: Plus },
];

const SEARCHABLE_ITEM_FIELDS = ["name", "desc", "tags"] as const;

function itemSearchText(item: MenuItem) {
  return SEARCHABLE_ITEM_FIELDS.map((field) => {
    const value = item[field];
    return Array.isArray(value) ? value.join(" ") : value;
  })
    .join(" ")
    .toLowerCase();
}

function categoryMatches(item: MenuItem, category: MobileCategory) {
  const text = `${item.id} ${item.name} ${item.tags.join(" ")}`.toLowerCase();
  if (category === "promo")
    return item.category === "combo" && Boolean(item.highlight);
  if (category === "chicken")
    return item.category === "burger" && text.includes("chicken");
  if (category === "bacon")
    return item.category === "burger" && text.includes("bacon");
  if (category === "super") return isSuperProduct(item);
  if (category === "burger") {
    return (
      item.category === "burger" &&
      !text.includes("chicken") &&
      !text.includes("bacon") &&
      !isSuperProduct(item)
    );
  }
  if (category === "combo") return item.category === "combo" && !item.highlight;
  if (category === "fries") return item.category === "fries";
  if (category === "extras") return item.category === "extra" || item.category === "bebida";
  if (category === "sweet") return item.category === "sweet";
  return false;
}

function discountPercent(item: MenuItem) {
  if (!item.originalPrice || item.originalPrice <= item.price) return 0;
  return Math.round((1 - item.price / item.originalPrice) * 100);
}

export function MobileMenuExperience({
  items,
  cartCount,
  cartTotal,
  featuredItem,
  featuredImage,
  featuredTitle,
  heroReady = true,
  promoCards = [],
  memberProfile,
  notificationCount,
  onOpenMember,
  onOpenNotifications,
  onQuickAdd,
  onOpenDetails,
  goToCart,
  soldOutEnabled = false,
  soldOutMessage = SOLD_OUT_MESSAGE,
}: {
  items: MenuItem[];
  cartCount: number;
  cartTotal: number;
  featuredItem?: MenuItem;
  featuredImage?: string;
  featuredTitle?: string;
  heroReady?: boolean;
  promoCards?: PromoCard[];
  memberProfile: MemberProfile | null;
  notificationCount: number;
  onOpenMember: () => void;
  onOpenNotifications: () => void;
  onQuickAdd: (item: MenuItem) => void;
  onOpenDetails: (item: MenuItem) => void;
  goToCart: () => void;
  soldOutEnabled?: boolean;
  soldOutMessage?: string;
}) {
  const [category, setCategory] = useState<MobileCategory>("combo");
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<"reviews" | null>(
    null,
  );
  const [closedHoursOpen, setClosedHoursOpen] = useState(false);
  const [closedHoursMessage, setClosedHoursMessage] = useState("");
  const [soldOutAlertOpen, setSoldOutAlertOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLowerCase();

  const sortedItems = useMemo(
    () => sortCatalogItems(items),
    [items],
  );
  const visibleItems = useMemo(
    () =>
      sortedItems.filter((item) => {
        if (isSpecialOfferOnlyProduct(item)) return false;
        const matchesSearch =
          !normalizedQuery || itemSearchText(item).includes(normalizedQuery);
        return matchesSearch && categoryMatches(item, category);
      }),
    [category, normalizedQuery, sortedItems],
  );
  const heroItem =
    featuredItem ?? items.find((item) => item.id === "double-burger") ?? items[0];
  const heroTitle = heroReady
    ? featuredTitle?.trim() || heroItem?.name || "Hamburguer artesanal feito na hora."
    : "";
  const categoryLabel =
    MOBILE_CATEGORIES.find((tab) => tab.id === category)?.label ?? "Produtos";
  const friesGalleryItems =
    category === "extras"
      ? visibleItems.filter((item) => item.eyebrow === "Galeria de Fritas")
      : [];
  const regularVisibleItems =
    category === "extras"
      ? visibleItems.filter((item) => item.eyebrow !== "Galeria de Fritas")
      : visibleItems;
  const whatsappText = encodeURIComponent(
    "Oi, Menfi's! Quero fazer um pedido pelo WhatsApp.",
  );

  const scrollToProducts = () => {
    document
      .getElementById("menfis-products")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openExtras = () => {
    setCategory("extras");
    scrollToProducts();
  };

  const closeClosedHoursAlert = () => {
    sessionStorage.setItem(CLOSED_HOURS_ALERT_KEY, "1");
    setClosedHoursOpen(false);
  };

  useEffect(() => {
    if (!API_URL) return;
    const controller = new AbortController();
    fetch(`${API_URL}/settings/public?_=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings) => {
        if (soldOutEnabled) return;
        if (sessionStorage.getItem(CLOSED_HOURS_ALERT_KEY) === "1") return;
        if (settings?.operatingNow !== false) return;
        setClosedHoursMessage(String(settings.operatingHoursMessage ?? "Estamos fechados no momento."));
        setClosedHoursOpen(true);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [soldOutEnabled]);

  return (
    <div className="md:hidden bg-white" style={{ color: VINHO }}>
      <header className="relative overflow-hidden bg-white px-4 pb-5 pt-4">
        <div className="pointer-events-none absolute inset-0 z-0 bg-white" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <BrandMenuButton onClick={onOpenMember} />
          <button type="button" onClick={onOpenMember} className="flex min-w-0 flex-1 justify-center" aria-label="Abrir perfil Menfis">
            <Image
              src="/logo%20hor.png"
              alt="Menfi's Burger"
              width={230}
              height={115}
              className="h-20 w-auto max-w-full object-contain"
            />
          </button>
          <IconButton
            label="Notificacoes"
            icon={Bell}
            onClick={onOpenNotifications}
            badge={notificationCount}
          />
          <button
            type="button"
            onClick={goToCart}
            className="relative flex h-14 min-w-[86px] items-center justify-center gap-2 rounded-2xl px-3"
            style={{ background: PINK, color: "#fff" }}
            aria-label="Abrir carrinho"
          >
            <ShoppingCart size={24} strokeWidth={2.7} />
            <span className="text-left">
              <span className="block text-lg font-black leading-none">
                {cartCount}
              </span>
              <span className="block text-[10px] font-black leading-none">
                {fmt(cartTotal)}
              </span>
            </span>
          </button>
        </div>

        <div className="relative z-10 mt-4 overflow-hidden rounded-[26px] bg-white shadow-[0_18px_42px_rgba(101,0,31,0.08)]">
          <button
            type="button"
            onClick={() => heroItem && onOpenDetails(heroItem)}
            className="relative block aspect-[1.08/1] w-full overflow-hidden bg-white min-[420px]:aspect-[1.18/1]"
            aria-label={`Ver ${heroItem?.name ?? "produto"}`}
          >
            {heroItem && (featuredImage || heroItem.image) ? (
              <Image
                src={featuredImage || imageSrc(heroItem.image)}
                alt={heroItem.name}
                fill
                priority
                loading="eager"
                sizes="100vw"
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                }}
              />
            ) : null}
          </button>
          <div className="grid gap-2 px-4 pb-4 pt-3">
            <Image
              src="/logonome.jpeg"
              alt="Menfi's Burger"
              width={210}
              height={96}
              className="h-16 w-auto max-w-full object-contain object-left"
              priority
            />
            <p className="text-[15px] font-black uppercase leading-tight">
              {heroTitle}
            </p>
          </div>
        </div>

        <OfferCarousel
          offers={promoCards}
          onOpenReviews={() => setPanel("reviews")}
        />

        {soldOutEnabled && (
          <div className="-mx-4">
            <SoldOutBanner
              message={soldOutMessage}
              onNotify={() => setSoldOutAlertOpen(true)}
            />
          </div>
        )}

        <button
          type="button"
          onClick={soldOutEnabled ? () => setSoldOutAlertOpen(true) : scrollToProducts}
          className="relative z-10 mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black uppercase tracking-wide"
          style={{ background: PINK, color: "#fff" }}
        >
          {soldOutEnabled ? "Quero ser avisado" : "Fazer pedido agora"} <ChevronRight size={20} strokeWidth={2.8} />
        </button>

        <label
          className="relative z-10 mt-4 flex h-12 items-center gap-2 rounded-2xl bg-white px-4 shadow-sm"
          style={{ border: `1px solid ${VINHO}12` }}
        >
          <Search size={18} strokeWidth={2.4} style={{ color: MAGENTA }} />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar bacon, chicken, combo, batata, Coca"
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:font-bold"
            style={{ color: VINHO }}
          />
        </label>
      </header>

      <CategoryNav category={category} setCategory={setCategory} />

      <main className="px-3 pb-44 min-[390px]:px-4">
        <section id="menfis-products" className="pt-5">
          <h2 className="text-lg font-black uppercase tracking-wide">
            {categoryLabel}
          </h2>
          <div
            className={`mt-3 grid gap-3 ${category === "super" ? "rounded-[26px] bg-black p-3 text-white shadow-2xl" : ""}`}
          >
            {category === "super" && (
              <div className="px-1 pb-1 pt-2">
                <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: ROSA }}>Linha especial</p>
                <p className="mt-1 text-sm font-black uppercase text-white">Escolha seu SUPER Menfi's</p>
              </div>
            )}
            {friesGalleryItems.length > 0 && (
              <div className="grid gap-3 rounded-[22px] p-3" style={{ background: "#FFF8F2", border: `1px solid ${VINHO}12` }}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: MAGENTA }}>
                    Galeria de Fritas
                  </p>
                  <p className="mt-1 text-xs font-bold opacity-60">
                    Batatas e Menfi's Nuggets para adicionar ao pedido.
                  </p>
                </div>
                {friesGalleryItems.map((item) => (
                  <MobileListItem
                    key={item.id}
                    item={item}
                    onAdd={() => onQuickAdd(item)}
                    onOpen={() => onOpenDetails(item)}
                  />
                ))}
              </div>
            )}
            {regularVisibleItems.map((item) => (
              <MobileListItem
                key={item.id}
                item={item}
                onAdd={() => onQuickAdd(item)}
                onOpen={() => onOpenDetails(item)}
              />
            ))}
            {visibleItems.length === 0 && (
              <div
                className="rounded-[18px] bg-white p-5 text-sm font-bold leading-relaxed"
                style={{ border: `1px solid ${VINHO}12` }}
              >
                Nenhum produto encontrado nesta categoria.
              </div>
            )}
          </div>
        </section>

      </main>

      <a
        href={`${SUPPORT_WHATSAPP_URL}?text=${whatsappText}`}
        target="_blank"
        rel="noreferrer"
        className="fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl"
        style={{
          bottom: cartCount > 0 ? 168 : 86,
          background: "#1F3D2E",
          color: ROSA,
          boxShadow: "0 16px 34px rgba(31,61,46,0.32)",
        }}
        aria-label="Chamar Menfi's no WhatsApp"
      >
        <MessageCircle size={27} strokeWidth={2.6} />
      </a>

      <MobileBottomNav
        cartCount={cartCount}
        cartTotal={cartTotal}
        onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onSearch={() => searchRef.current?.focus()}
        onOrders={goToCart}
        onExtras={openExtras}
        onProfile={onOpenMember}
      />
      {panel === "reviews" && <ReviewsPanel onClose={() => setPanel(null)} />}
      {closedHoursOpen && (
        <ClosedHoursModal
          message={closedHoursMessage}
          onClose={closeClosedHoursAlert}
        />
      )}
      {soldOutAlertOpen && (
        <SoldOutAlertModal
          message={soldOutMessage}
          onClose={() => setSoldOutAlertOpen(false)}
        />
      )}
    </div>
  );
}

function ClosedHoursModal({
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

function BrandMenuButton({ onClick }: { onClick: () => void }) {
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

function IconButton({
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

function CategoryNav({
  category,
  setCategory,
}: {
  category: MobileCategory;
  setCategory: (value: MobileCategory) => void;
}) {
  return (
    <nav
      className="sticky top-0 z-40 flex gap-3 overflow-x-auto border-y bg-white px-4 py-3 shadow-[0_12px_26px_rgba(101,0,31,0.08)]"
      style={{ borderColor: `${VINHO}10` }}
    >
      {MOBILE_CATEGORIES.map((tab) => {
        const Icon = tab.icon;
        const active = category === tab.id;
        const featured = tab.id === "super";
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategory(tab.id)}
            className="flex min-w-[92px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-[11px] font-black uppercase"
            style={{
              background: active ? (featured ? "#000" : VINHO) : featured ? "#000" : "#fff",
              color: active || featured ? ROSA : VINHO,
              border: `1px solid ${featured ? "#000" : active ? VINHO : `${VINHO}12`}`,
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

function OfferCarousel({
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

function MobileBottomNav({
  cartCount,
  cartTotal,
  onHome,
  onSearch,
  onOrders,
  onExtras,
  onProfile,
}: {
  cartCount: number;
  cartTotal: number;
  onHome: () => void;
  onSearch: () => void;
  onOrders: () => void;
  onExtras: () => void;
  onProfile: () => void;
}) {
  const items = [
    { label: "Inicio", icon: Home, onClick: onHome, active: true },
    { label: "Buscar", icon: Search, onClick: onSearch },
    {
      label: "Pedidos",
      icon: ClipboardList,
      onClick: onOrders,
      badge: cartCount,
    },
    { label: "Extras", icon: Plus, onClick: onExtras },
    { label: "Perfil", icon: UserRound, onClick: onProfile },
  ];
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 overflow-hidden border-t bg-white shadow-[0_-14px_32px_rgba(101,0,31,0.10)]"
      style={{ borderColor: `${VINHO}12` }}
    >
      {cartCount > 0 && (
        <button
          type="button"
          onClick={onOrders}
          className="flex h-[74px] w-full items-center gap-3 border-b px-4 text-left"
          style={{ borderColor: `${VINHO}10`, color: VINHO }}
        >
          <span
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: `${ROSA}55` }}
          >
            <ShoppingCart size={23} strokeWidth={2.6} />
            <span
              className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-black"
              style={{ background: PINK, color: "#fff" }}
            >
              {cartCount}
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black leading-tight">
              {cartCount} {cartCount === 1 ? "item" : "itens"}
            </span>
            <span className="block text-2xl font-black leading-tight">
              {fmt(cartTotal)}
            </span>
          </span>
          <span
            className="flex h-12 shrink-0 items-center gap-2 rounded-2xl px-4 text-xs font-black uppercase"
            style={{ background: PINK, color: "#fff" }}
          >
            Ver pedido <ChevronRight size={17} strokeWidth={2.8} />
          </span>
        </button>
      )}
      <nav className="grid grid-cols-5 px-2 pb-2 pt-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-black"
              style={{ color: item.active ? VINHO : `${VINHO}99` }}
            >
              <span className="relative">
                <Icon size={21} strokeWidth={2.4} />
                {Boolean(item.badge) && (
                  <span
                    className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black"
                    style={{ background: PINK, color: "#fff" }}
                  >
                    {item.badge}
                  </span>
                )}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function PanelShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] bg-[rgba(101,0,31,0.42)]"
      onClick={onClose}
    >
      <section
        className="absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-auto rounded-t-[28px] bg-white p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black uppercase tracking-wide">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: `${ROSA}70`, color: VINHO }}
            aria-label="Fechar"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function ReviewsPanel({ onClose }: { onClose: () => void }) {
  const defaultReviews = [
    { score: "4.9", text: "Melhor hamburguer que ja pedi." },
    { score: "5.0", text: "Chegou quente e muito rapido." },
    { score: "5.0", text: "Vale cada centavo." },
  ];
  const [reviews, setReviews] = useState<Array<{ name?: string; score: string; text: string; createdAt?: string }>>(() => {
    if (typeof window === "undefined") return defaultReviews;
    try {
      const saved = JSON.parse(localStorage.getItem(REVIEWS_STORAGE_KEY) ?? "[]");
      return [...defaultReviews, ...(Array.isArray(saved) ? saved : [])];
    } catch {
      return defaultReviews;
    }
  });
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [score, setScore] = useState("5");
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");

  const submitReview = () => {
    const cleanName = name.trim();
    const cleanText = text.trim();
    if (!cleanName || !cleanText) {
      setFeedback("Informe seu nome e escreva sua avaliacao.");
      return;
    }
    const review = {
      name: cleanName,
      score: `${Number(score).toFixed(1)}`,
      text: cleanText,
      createdAt: new Date().toISOString(),
    };
    const nextReviews = [...reviews, review];
    setReviews(nextReviews);
    if (typeof window !== "undefined") {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(nextReviews.slice(defaultReviews.length)));
    }
    setName("");
    setScore("5");
    setText("");
    setFeedback("Avaliacao enviada.");
    setFormOpen(false);
  };

  return (
    <PanelShell title="Avaliacoes Menfi's" onClose={onClose}>
      <div className="mt-4 rounded-2xl p-4" style={{ background: "#fff" }}>
        <p
          style={{
            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
            fontSize: "3.2rem",
            lineHeight: 0.9,
          }}
        >
          4.9
        </p>
        <p className="mt-1 text-sm font-black uppercase tracking-wide">
          Avaliacao media dos clientes
        </p>
        <p className="mt-2 text-sm font-semibold opacity-70">
          Prova social real para decidir rapido.
        </p>
        <button
          type="button"
          onClick={() => {
            setFormOpen((current) => !current);
            setFeedback("");
          }}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl text-xs font-black uppercase tracking-wide"
          style={{ background: `${ROSA}70`, color: VINHO }}
        >
          Inserir sua avaliacao
        </button>
      </div>
      {formOpen && (
        <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4" style={{ border: `1px solid ${VINHO}12` }}>
          <label className="grid gap-1">
            <span className="text-[10px] font-black uppercase tracking-wide opacity-55">Nome</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              className="h-11 rounded-2xl px-4 text-sm font-bold outline-none"
              style={{ border: `1px solid ${VINHO}14`, color: VINHO }}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[10px] font-black uppercase tracking-wide opacity-55">Nota</span>
            <select
              value={score}
              onChange={(event) => setScore(event.target.value)}
              className="h-11 rounded-2xl px-4 text-sm font-bold outline-none"
              style={{ border: `1px solid ${VINHO}14`, color: VINHO }}
              aria-label="Escolha sua nota"
            >
              <option value="5">5 estrelas</option>
              <option value="4">4 estrelas</option>
              <option value="3">3 estrelas</option>
              <option value="2">2 estrelas</option>
              <option value="1">1 estrela</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-[10px] font-black uppercase tracking-wide opacity-55">Observacao</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Conte como foi sua experiencia com a Menfi's"
              className="min-h-24 resize-none rounded-2xl px-4 py-3 text-sm font-bold outline-none"
              style={{ border: `1px solid ${VINHO}14`, color: VINHO }}
            />
          </label>
          <button
            type="button"
            onClick={submitReview}
            className="flex h-12 w-full items-center justify-center rounded-2xl text-xs font-black uppercase tracking-wide"
            style={{ background: VINHO, color: ROSA }}
          >
            Enviar avaliacao
          </button>
        </div>
      )}
      {feedback && (
        <p className="mt-3 rounded-2xl px-4 py-3 text-xs font-black" style={{ background: `${ROSA}55`, color: VINHO }}>
          {feedback}
        </p>
      )}
      <div className="mt-4 grid gap-3">
        {reviews.map((review) => (
          <article
            key={`${review.text}-${review.createdAt ?? review.score}`}
            className="rounded-2xl bg-white p-4"
            style={{ border: `1px solid ${VINHO}12` }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black">{"★".repeat(Math.max(1, Math.round(Number(review.score))))}</p>
              <p className="font-black">{review.score}</p>
            </div>
            {review.name && <p className="mt-2 text-xs font-black uppercase tracking-wide opacity-60">{review.name}</p>}
            <p className="mt-2 text-sm font-semibold leading-relaxed opacity-70">
              "{review.text}"
            </p>
          </article>
        ))}
      </div>
    </PanelShell>
  );
}

function MobileListItem({
  item,
  onAdd,
  onOpen,
}: {
  item: MenuItem;
  onAdd: () => void;
  onOpen: () => void;
}) {
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

function PriceBlock({
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
