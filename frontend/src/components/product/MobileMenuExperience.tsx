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
import { API_URL, type CarouselCardSettings, PromoCard, PromoCardIcon, SUPPORT_WHATSAPP_URL, normalizePromoCards } from "@/components/order/checkout";
import { fmt, imageSrc, isSpecialOfferOnlyProduct, isSuperProduct, isSweetBoxProduct, MemberProfile, sortCatalogItems, sweetCardPriceLabel } from "./shared";
import { SoldOutAlertModal, SoldOutBanner, SOLD_OUT_MESSAGE } from "./SoldOutNotice";
import { SuperLaunchCard } from "./ProductParts";

import { BRAND_M_LOGO, CLOSED_HOURS_ALERT_KEY, MAGENTA, MOBILE_CATEGORIES, PINK, REVIEWS_STORAGE_KEY, VINHO, categoryMatches, discountPercent, itemSearchText, type MobileCategory } from "./mobile/mobileMenuConfig";
import { BrandMenuButton, CategoryNav, ClosedHoursModal, IconButton, OfferCarousel } from "./mobile/MobileMenuChrome";
import { ProductCarousel } from "./carousel/ProductCarousel";
import { MobileBottomNav, ReviewsPanel } from "./mobile/MobileMenuPanels";
import { MobileListItem } from "./mobile/MobileListItem";
import { LemonadeShowcase } from "./LemonadeShowcase";
export function MobileMenuExperience({
  items,
  cartCount,
  cartTotal,
  featuredItem,
  featuredImage,
  featuredTitle,
  heroReady = true,
  carouselCards,
  carouselIntervalSeconds = 3,
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
  carouselCards: CarouselCardSettings[];
  carouselIntervalSeconds?: number;
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
  const kioskMobLoggedIn =
    String(memberProfile?.name ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "-")
      .replace(/-+/g, "-") === "KIOSK-MOB";
  const searchRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLowerCase();

  const sortedItems = useMemo(
    () => sortCatalogItems(items),
    [items],
  );
  const visibleItems = useMemo(
    () => {
      const matches = sortedItems.filter((item) => {
        if (isSpecialOfferOnlyProduct(item)) return false;
        const matchesSearch =
          !normalizedQuery || itemSearchText(item).includes(normalizedQuery);
        return matchesSearch && categoryMatches(item, category);
      });
      return category === "super"
        ? matches.sort((a, b) => a.id === "tropikal-menfis" ? -1 : b.id === "tropikal-menfis" ? 1 : 0)
        : matches;
    },
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
    if (!kioskMobLoggedIn && category === "lemonade") setCategory("combo");
  }, [category, kioskMobLoggedIn]);

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

  if (category === "super") {
    return (
      <div
        className="min-h-dvh bg-black pb-24 pt-[136px] text-white md:hidden"
        style={{ backgroundImage: "linear-gradient(rgba(0,0,0,.48),rgba(0,0,0,.82)), url('/super/bakcgourd%20super.png')", backgroundSize: "cover", backgroundPosition: "center top", backgroundAttachment: "fixed" }}
      >
        <header className="fixed inset-x-0 top-0 z-50 h-[72px] border-b px-3" style={{ background: "rgba(2,20,18,.82)", borderColor: "rgba(156,221,34,.35)", backdropFilter: "blur(18px)" }}>
          <div className="flex h-full items-center gap-3">
            <button type="button" onClick={() => setCategory("combo")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border" style={{ borderColor: "#9CDD22", color: "#C8FF43", background: "rgba(0,0,0,.35)" }} aria-label="Voltar"><ChevronLeft size={21} /></button>
            <Image src="/super/logo%20super.png" alt="Menfi's Burger SUPER" width={180} height={70} className="h-12 w-auto min-w-0 object-contain" />
            <button type="button" onClick={goToCart} className="relative ml-auto flex h-11 min-w-14 items-center justify-center gap-1 rounded-xl px-3 text-xs font-black text-black" style={{ background: "#9CDD22" }}><ShoppingCart size={17} />{cartCount}</button>
          </div>
        </header>
        <nav className="fixed inset-x-0 top-[72px] z-50 flex h-[52px] items-center gap-2 overflow-x-auto border-b px-3" style={{ background: "rgba(3,27,24,.78)", borderColor: "rgba(255,255,255,.12)", backdropFilter: "blur(16px)" }}>
          {MOBILE_CATEGORIES.filter(({ id }) => kioskMobLoggedIn || id !== "lemonade").map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setCategory(id)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[10px] font-black uppercase" style={{ background: id === "super" ? "rgba(156,221,34,.18)" : "rgba(0,0,0,.32)", borderColor: id === "super" ? "#9CDD22" : "rgba(255,255,255,.22)", color: id === "super" ? "#C8FF43" : "#fff" }}><Icon size={13} />{label}</button>)}
        </nav>
        <div className="grid gap-5 px-2 pb-4">
          {regularVisibleItems.map((item) => (
            <SuperLaunchCard
              key={item.id}
              item={item}
              onAdd={() => onQuickAdd(item)}
              onOpenDetails={() => onOpenDetails(item)}
            />
          ))}
        </div>
        <footer className="fixed inset-x-0 bottom-0 z-50 h-[82px] border-t px-2" style={{ background: "rgba(2,20,18,.88)", borderColor: "rgba(156,221,34,.35)", backdropFilter: "blur(18px)" }}>
          <div className="grid h-full grid-cols-5 gap-1">
            {[{ Icon: ClipboardList, label: "Pedidos" }, { Icon: Clock, label: "Histórico" }, { Icon: Home, label: "Início" }, { Icon: Bell, label: "Avisos" }, { Icon: UserRound, label: "Perfil" }].map(({ Icon, label }) => <button key={label} type="button" onClick={label === "Pedidos" ? goToCart : label === "Início" ? () => window.scrollTo({ top: 0, behavior: "smooth" }) : label === "Perfil" ? onOpenMember : undefined} className="flex flex-col items-center justify-center gap-1 text-[9px] font-black uppercase text-white/70"><Icon size={19} style={{ color: label === "Início" ? "#C8FF43" : undefined }} /><span>{label}</span></button>)}
          </div>
        </footer>
      </div>
    );
  }

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

        {category !== "lemonade" && heroItem && (
          <div className="relative z-10 -mx-4 mt-4">
            <ProductCarousel
              products={items}
              cards={carouselCards}
              intervalSeconds={carouselIntervalSeconds}
              onOpenProduct={onOpenDetails}
              onAddProduct={onQuickAdd}
            />
          </div>
        )}

        {category !== "lemonade" && <OfferCarousel offers={promoCards} onOpenReviews={() => setPanel("reviews")} />}

        {category !== "lemonade" && soldOutEnabled && (
          <div className="-mx-4">
            <SoldOutBanner
              message={soldOutMessage}
              onNotify={() => setSoldOutAlertOpen(true)}
            />
          </div>
        )}

        {category !== "lemonade" && <button
          type="button"
          onClick={soldOutEnabled ? () => setSoldOutAlertOpen(true) : scrollToProducts}
          className="relative z-10 mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black uppercase tracking-wide"
          style={{ background: PINK, color: "#fff" }}
        >
          {soldOutEnabled ? "Quero ser avisado" : "Fazer pedido agora"} <ChevronRight size={20} strokeWidth={2.8} />
        </button>}

        {category !== "lemonade" && <label
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
        </label>}
      </header>

      <CategoryNav category={category} setCategory={setCategory} showKioskOnly={kioskMobLoggedIn} />

      <main className={category === "lemonade" ? "pb-44" : "px-3 pb-44 min-[390px]:px-4"}>
        {category === "lemonade" ? (
          <LemonadeShowcase items={visibleItems} onAdd={onQuickAdd} />
        ) : (
        <section id="menfis-products" className="pt-5">
          <h2 className="text-lg font-black uppercase tracking-wide">
            {categoryLabel}
          </h2>
          <div className="mt-3 grid gap-3">
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
        )}

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
