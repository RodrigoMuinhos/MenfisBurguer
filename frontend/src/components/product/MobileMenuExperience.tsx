import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import {
  Beef,
  Bell,
  ChevronRight,
  ClipboardList,
  Drumstick,
  Flame,
  Gift,
  Home,
  MessageCircle,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Star,
  Timer,
  Utensils,
  UserRound,
  X,
  CalendarClock,
} from "lucide-react";
import { MenuItem } from "@/features/catalog/types";
import { ROSA } from "@/utils/theme";
import { API_URL, SUPPORT_WHATSAPP_URL } from "@/components/order/checkout";
import { fmt, imageSrc, MEMBER_TOKEN_KEY, MemberProfile } from "./shared";

type MobileCategory = "promo" | "combo" | "burger" | "chicken" | "bacon";

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
];

const SALES_ORDER = [
  "double-burger",
  "menfis-bacon",
  "menfis-chicken",
  "burger",
  "double-menfis-bacon",
  "double-menfis-chicken",
  "combo2",
  "combo",
  "double-combo",
  "chicken-combo",
  "double-chicken-combo",
  "chicken-super-combo",
  "bacon-combo",
  "double-bacon-combo",
  "bacon-super-combo",
  "batata",
  "coca-zero",
  "guarana-zero",
  "agua-com-gas",
];

const SEARCHABLE_ITEM_FIELDS = ["name", "desc", "tags"] as const;

function saleRank(item: MenuItem) {
  const index = SALES_ORDER.indexOf(item.id);
  return index >= 0 ? index : SALES_ORDER.length + 1;
}

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
  if (category === "burger") {
    return (
      item.category === "burger" &&
      !text.includes("chicken") &&
      !text.includes("bacon")
    );
  }
  if (category === "combo") return item.category === "combo" && !item.highlight;
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
  memberProfile,
  notificationCount,
  onOpenMember,
  onOpenNotifications,
  onQuickAdd,
  onOpenDetails,
  goToCart,
}: {
  items: MenuItem[];
  cartCount: number;
  cartTotal: number;
  memberProfile: MemberProfile | null;
  notificationCount: number;
  onOpenMember: () => void;
  onOpenNotifications: () => void;
  onQuickAdd: (item: MenuItem) => void;
  onOpenDetails: (item: MenuItem) => void;
  goToCart: () => void;
}) {
  const [category, setCategory] = useState<MobileCategory>("combo");
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<"reviews" | "club" | "subscribe" | null>(
    null,
  );
  const [closedHoursOpen, setClosedHoursOpen] = useState(false);
  const [closedHoursMessage, setClosedHoursMessage] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const rewardCount = memberProfile?.orders ? memberProfile.orders % 10 : 0;
  const rewardRemaining = Math.max(0, 10 - rewardCount);
  const normalizedQuery = query.trim().toLowerCase();

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => saleRank(a) - saleRank(b)),
    [items],
  );
  const visibleItems = useMemo(
    () =>
      sortedItems.filter((item) => {
        const matchesSearch =
          !normalizedQuery || itemSearchText(item).includes(normalizedQuery);
        return matchesSearch && categoryMatches(item, category);
      }),
    [category, normalizedQuery, sortedItems],
  );
  const heroItem =
    items.find((item) => item.id === "double-burger") ?? items[0];
  const categoryLabel =
    MOBILE_CATEGORIES.find((tab) => tab.id === category)?.label ?? "Produtos";
  const whatsappText = encodeURIComponent(
    "Oi, Menfi's! Quero fazer um pedido pelo WhatsApp.",
  );

  const scrollToProducts = () => {
    document
      .getElementById("menfis-products")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const closeClosedHoursAlert = () => {
    sessionStorage.setItem(CLOSED_HOURS_ALERT_KEY, "1");
    setClosedHoursOpen(false);
  };

  useEffect(() => {
    if (!API_URL) return;
    if (sessionStorage.getItem(CLOSED_HOURS_ALERT_KEY) === "1") return;
    const controller = new AbortController();
    fetch(`${API_URL}/settings/public`, { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings) => {
        if (settings?.operatingNow !== false) return;
        setClosedHoursMessage(String(settings.operatingHoursMessage ?? "Estamos fechados no momento."));
        setClosedHoursOpen(true);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <div className="md:hidden bg-white" style={{ color: VINHO }}>
      <header className="relative overflow-hidden bg-white px-4 pb-5 pt-4">
        <div className="pointer-events-none absolute inset-0 z-0 bg-white" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <BrandMenuButton onClick={onOpenMember} />
          <button
            type="button"
            onClick={onOpenMember}
            className="flex min-w-0 flex-1 justify-center"
            aria-label="Abrir perfil Menfis"
          >
            <span
              className="truncate leading-none"
              style={{
                color: PINK,
                fontFamily: "'Pacifico', cursive",
                fontSize: "1.85rem",
              }}
            >
              Menfis
            </span>
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

        <div className="relative z-10 mt-4 flex flex-wrap gap-2">
          <TopTrustItem
            icon={Star}
            title="4.9"
            subtitle="avaliacao dos clientes"
            onClick={() => setPanel("reviews")}
          />
          <TopTrustItem
            icon={Gift}
            title="Frete gratis"
            subtitle="acima de R$ 59,90 no Clube"
            onClick={() => setPanel("club")}
          />
          <TopTrustItem
            icon={Timer}
            title="30-35 min"
            subtitle="entrega media"
          />
        </div>

        <div className="relative z-10 mt-4 min-h-[312px] overflow-hidden bg-white">
          <div className="relative z-30 max-w-[52%] pt-10">
            <p
              className="uppercase"
              style={{
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "4.35rem",
                lineHeight: 0.82,
                letterSpacing: 0,
                color: VINHO,
              }}
            >
              Menfi's Burger
            </p>
            <p className="mt-3 text-lg font-black uppercase leading-tight">
              Hamburguer artesanal feito na hora.
            </p>
          </div>
          <button
            type="button"
            onClick={() => heroItem && onOpenDetails(heroItem)}
            className="absolute -right-20 top-0 z-10 h-[330px] w-[72%] overflow-visible bg-white"
            aria-label={`Ver ${heroItem?.name ?? "produto"}`}
          >
            {heroItem?.image ? (
              <Image
                src={imageSrc(heroItem.image)}
                alt={heroItem.name}
                fill
                priority
                sizes="78vw"
                style={{
                  objectFit: "contain",
                  objectPosition: "left center",
                  transform: "scale(1.24)",
                }}
              />
            ) : null}
          </button>
        </div>

        <OfferCarousel
          onOpenClub={() => setPanel("club")}
          onSubscribe={() => setPanel("subscribe")}
        />

        <button
          type="button"
          onClick={scrollToProducts}
          className="relative z-10 mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black uppercase tracking-wide"
          style={{ background: PINK, color: "#fff" }}
        >
          Fazer pedido agora <ChevronRight size={20} strokeWidth={2.8} />
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
          <div className="mt-3 grid gap-3">
            {visibleItems.map((item) => (
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

        <section className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={() => setPanel("club")}
            className="rounded-[20px] bg-white p-4 text-left"
            style={{ border: `1px solid ${VINHO}12` }}
          >
            <p className="text-lg font-black uppercase">Clube Menfi's</p>
            <p className="mt-1 text-sm font-semibold opacity-70">
              R$ 9,90/mes com frete gratis, cupons e ofertas antecipadas.
            </p>
            <p className="mt-3 text-sm font-black">
              {rewardCount}/10 pedidos no seu historico
            </p>
          </button>
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
        onClub={() => setPanel("club")}
        onProfile={onOpenMember}
      />
      {panel === "reviews" && <ReviewsPanel onClose={() => setPanel(null)} />}
      {panel === "club" && (
        <ClubPanel
          rewardCount={rewardCount}
          rewardRemaining={rewardRemaining}
          onClose={() => setPanel(null)}
          onSubscribe={() => setPanel("subscribe")}
        />
      )}
      {panel === "subscribe" && (
        <SubscriptionPanel
          memberProfile={memberProfile}
          onClose={() => setPanel(null)}
          onLogin={onOpenMember}
        />
      )}
      {closedHoursOpen && (
        <ClosedHoursModal
          message={closedHoursMessage}
          onClose={closeClosedHoursAlert}
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

function TopTrustItem({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: ElementType;
  title: string;
  subtitle: string;
  onClick?: () => void;
}) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="flex min-h-12 flex-1 basis-[30%] items-center gap-2 rounded-2xl bg-white px-2 py-2 text-left shadow-sm"
      style={{ border: `1px solid ${VINHO}10` }}
    >
      <Icon size={17} strokeWidth={2.5} style={{ color: PINK }} />
      <span className="min-w-0">
        <span className="block text-[11px] font-black leading-tight">
          {title}
        </span>
        <span className="block text-[9px] font-bold leading-tight opacity-65">
          {subtitle}
        </span>
      </span>
    </Component>
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

function OfferCarousel({
  onOpenClub,
  onSubscribe,
}: {
  onOpenClub: () => void;
  onSubscribe: () => void;
}) {
  const offers = [
    {
      id: "mfb10",
      eyebrow: "Primeira compra?",
      title: "MFB10",
      copy: "Ganhe 10% OFF no primeiro pedido",
      value: "10%",
      suffix: "OFF",
      icon: Gift,
      action: onOpenClub,
    },
    {
      id: "combolove",
      eyebrow: "Quarta-feira",
      title: "LOV50",
      copy: "Na compra de um combo, o segundo sai com 50% OFF",
      value: "50%",
      suffix: "2o combo",
      icon: Flame,
      action: onOpenClub,
    },
    {
      id: "club",
      eyebrow: "Menfi's Club",
      title: "VEMM...",
      copy: "Frete gratis e descontos por 31 dias",
      value: "R$ 6,90",
      suffix: "31 dias",
      icon: Gift,
      action: onSubscribe,
    },
  ];

  return (
    <section className="relative z-10 mt-2 -mx-4 overflow-x-auto px-4 pb-1">
      <div className="flex snap-x snap-mandatory gap-3">
        {offers.map((offer) => {
          const Icon = offer.icon;
          return (
            <button
              key={offer.id}
              type="button"
              onClick={offer.action}
              className="relative min-h-[132px] w-[86vw] max-w-[380px] shrink-0 snap-start overflow-hidden rounded-[18px] px-4 py-4 text-left text-white"
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
                  {offer.value}
                </span>
                <span className="mt-0.5 max-w-[58px] text-[10px] font-black uppercase leading-[0.95]">
                  {offer.suffix}
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
                    {offer.eyebrow}
                  </span>
                  <span
                    className="mt-1 block truncate text-[clamp(1.75rem,8vw,2.35rem)] font-black uppercase leading-[0.9]"
                    style={{ color: ROSA }}
                  >
                    {offer.title}
                  </span>
                  <span className="mt-2 block max-w-[210px] text-[11px] font-black uppercase leading-tight opacity-90">
                    {offer.copy}
                  </span>
                </span>
              </span>

              <span className="absolute bottom-3 left-4 right-4 h-1 overflow-hidden rounded-full bg-white/10">
                <span
                  className="block h-full w-1/2 rounded-full"
                  style={{ background: ROSA }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MobileBottomNav({
  cartCount,
  cartTotal,
  onHome,
  onSearch,
  onOrders,
  onClub,
  onProfile,
}: {
  cartCount: number;
  cartTotal: number;
  onHome: () => void;
  onSearch: () => void;
  onOrders: () => void;
  onClub: () => void;
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
    { label: "Clube", icon: Gift, onClick: onClub },
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

function ClubPanel({
  rewardCount,
  rewardRemaining,
  onClose,
  onSubscribe,
}: {
  rewardCount: number;
  rewardRemaining: number;
  onClose: () => void;
  onSubscribe: () => void;
}) {
  const progress = Math.min(100, (rewardCount / 10) * 100);
  const benefits = [
    {
      label: "Pacote Assinante",
      value: "R$ 6,90/mes",
      copy: "5 fretes gratis e 5 descontos de R$ 10,00.",
    },
    {
      label: "Pacote Assinante Plus",
      value: "R$ 12,90/mes",
      copy: "10 fretes gratis e 5 descontos de R$ 10,00.",
    },
    {
      label: "Escolha no checkout",
      value: "Pedido",
      copy: "Use frete gratis, R$ 10 OFF ou nenhum beneficio.",
    },
    {
      label: "Promocoes exclusivas",
      value: "Clube",
      copy: "Ofertas especiais para membros.",
    },
    {
      label: "Acesso antecipado",
      value: "Lancamentos",
      copy: "Novidades aparecem primeiro para membros.",
    },
  ];
  return (
    <PanelShell title="Clube Menfi's" onClose={onClose}>
      <div className="mt-4 rounded-2xl p-4" style={{ background: "#fff" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-wide">
              {rewardCount}/10 pedidos
            </p>
            <p className="mt-1 text-sm font-semibold opacity-70">
              {rewardRemaining > 0
                ? `Faltam ${rewardRemaining} pedidos no ciclo atual.`
                : "Ciclo completo no seu historico."}
            </p>
          </div>
          <Gift size={34} strokeWidth={2.2} />
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full"
            style={{ width: `${progress}%`, background: VINHO }}
          />
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {benefits.map((benefit) => (
          <div
            key={benefit.label}
            className="flex items-center gap-3 rounded-2xl p-4"
            style={{ border: `1px solid ${VINHO}12` }}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: `${ROSA}70` }}
            >
              <Gift size={19} strokeWidth={2.4} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-black">{benefit.label}</span>
              <span className="mt-1 block text-xs font-semibold opacity-60">
                {benefit.copy}
              </span>
            </span>
            <span className="shrink-0 text-right text-sm font-black">
              {benefit.value}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onSubscribe}
        className="mt-5 flex h-13 w-full items-center justify-center rounded-2xl text-sm font-black uppercase tracking-wide"
        style={{ background: VINHO, color: ROSA }}
      >
        Assinar
      </button>
    </PanelShell>
  );
}

function SubscriptionPanel({
  memberProfile,
  onClose,
  onLogin,
}: {
  memberProfile: MemberProfile | null;
  onClose: () => void;
  onLogin: () => void;
}) {
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");
  const plans = [
    {
      id: "silver",
      level: "Silver",
      name: "Menfi's Club Silver",
      price: 6.9,
      badge: "Essencial",
      freeShippingCount: 5,
      discountCount: 5,
      benefits: [
        "Frete gratis em ate 5 pedidos",
        "R$ 10,00 OFF em ate 5 pedidos",
      ],
    },
    {
      id: "gold",
      level: "Gold",
      name: "Menfi's Club Gold",
      price: 12.9,
      badge: "Melhor oferta",
      freeShippingCount: 10,
      discountCount: 5,
      benefits: [
        "Frete gratis em ate 10 pedidos",
        "R$ 10,00 OFF em ate 5 pedidos",
      ],
    },
  ];
  const [selectedPlanId, setSelectedPlanId] = useState("gold");
  const selectedPlan =
    plans.find((plan) => plan.id === selectedPlanId) ?? plans[1];
  const subscribe = async (plan: string) => {
    setError("");
    if (!memberProfile?.id) {
      onClose();
      onLogin();
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem(MEMBER_TOKEN_KEY) : "";
    if (!API_URL || !token) {
      onClose();
      onLogin();
      return;
    }
    setSubscribingPlan(plan);
    try {
      const response = await fetch(`${API_URL}/payments/club/preference`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
        }),
      });
      const data = await response.json().catch(() => ({}));
      const checkoutUrl = data.checkoutUrl || data.sandboxCheckoutUrl;
      if (!response.ok || !checkoutUrl) {
        const errorCode = data.details?.message || data.error;
        const safeMessage =
          errorCode === "mercado_pago_not_configured"
            ? "Mercado Pago indisponivel no momento. Tente novamente em alguns minutos."
            : "Nao foi possivel criar o checkout do Mercado Pago.";
        throw new Error(safeMessage);
      }
      window.location.href = checkoutUrl;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Nao foi possivel abrir o Mercado Pago. Tente novamente.");
      setSubscribingPlan(null);
    }
  };

  return (
    <PanelShell title="Assinar Menfi's Club" onClose={onClose}>
      <div className="mt-5 text-center">
        <div
          className="mx-auto flex w-fit items-center gap-2 rounded-full px-4 py-2"
          style={{ background: `${ROSA}45`, color: VINHO }}
        >
          <Gift size={21} strokeWidth={2.6} />
          <span className="text-sm font-black uppercase tracking-wide">
            Menfi's Club
          </span>
        </div>
        <p className="mt-6 text-2xl font-black">Resumo da compra</p>
        <p className="mt-3 text-sm font-black" style={{ color: "#047857" }}>
          Pacote avulso por 31 dias
        </p>
        <p
          className="mt-2"
          style={{
            color: VINHO,
            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
            fontSize: "4.4rem",
            lineHeight: 0.9,
          }}
        >
          {fmt(selectedPlan.price)}
        </p>
        <p className="mt-2 text-base font-black">sem renovacao automatica</p>
      </div>

      <div className="mt-7">
        <p className="text-lg font-black">Detalhes dos beneficios</p>
        <div className="mt-3 grid gap-3 text-sm font-bold leading-relaxed opacity-70">
          <p>
            • {selectedPlan.freeShippingCount} usos de frete gratis em pedidos
            elegiveis
          </p>
          <p>
            • {selectedPlan.discountCount} descontos de R$ 10,00 para usar no
            checkout
          </p>
          <p>
            • Identificacao visual ⭐ {selectedPlan.level} no perfil e no painel
            administrativo
          </p>
        </div>
      </div>

      <div
        className="mt-6 rounded-[24px] p-4"
        style={{ background: "#fff", border: `1px solid ${VINHO}12` }}
      >
        <p className="text-base font-black">Escolha seu pacote</p>
        <div className="mt-4 grid gap-3">
          {plans.map((plan) => {
            const selected = selectedPlanId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className="flex min-h-[118px] items-center gap-4 rounded-2xl p-4 text-left"
                style={{
                  border: `2px solid ${selected ? VINHO : `${VINHO}14`}`,
                  background: selected ? "#fff" : "#FAFAFA",
                  color: VINHO,
                }}
              >
                <span className="min-w-0 flex-1">
                  <span
                    className="block w-fit rounded-full px-3 py-1 text-[11px] font-black"
                    style={{
                      background: selected ? `${ROSA}55` : "#fff",
                      color: selected ? VINHO : `${VINHO}99`,
                    }}
                  >
                    <Star
                      size={12}
                      className="mr-1 inline"
                      fill="currentColor"
                      strokeWidth={2.4}
                    />
                    {plan.badge}
                  </span>
                  <span className="mt-3 block text-2xl font-black leading-tight">
                    {fmt(plan.price)}
                  </span>
                  <span className="mt-1 block text-base font-black">
                    {plan.name}
                  </span>
                  <span className="mt-1 block text-sm font-bold opacity-60">
                    Para usar em 31 dias
                  </span>
                </span>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{
                    border: `7px solid ${selected ? PINK : "#EEE"}`,
                    background: "#fff",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="mt-4 rounded-[24px] p-4"
        style={{ background: "#F7F7F7", color: VINHO }}
      >
        <p className="text-base font-black">Pagamento pelo Mercado Pago</p>
        <div className="mt-4 rounded-2xl bg-white p-4">
          <p className="text-sm font-black">Checkout seguro Mercado Pago</p>
          <p className="mt-1 text-xs font-bold opacity-60">
            Voce sera redirecionado para concluir o pagamento.
          </p>
        </div>
      </div>

      {error && (
        <p
          className="mt-3 rounded-2xl px-4 py-3 text-xs font-black leading-relaxed"
          style={{ background: "#FEF2F2", color: "#991B1B" }}
        >
          {error}
        </p>
      )}
      <div className="sticky bottom-0 -mx-5 mt-5 bg-white px-5 pb-2 pt-4">
        <button
          type="button"
          onClick={() => void subscribe(selectedPlan.id)}
          className="flex h-14 w-full items-center justify-center rounded-2xl text-sm font-black uppercase tracking-wide disabled:opacity-70"
          style={{ background: PINK, color: "#fff" }}
          disabled={subscribingPlan !== null}
        >
          {subscribingPlan
            ? "Abrindo Mercado Pago"
            : memberProfile
              ? "Continuar para Mercado Pago"
              : "Entrar para assinar"}
        </button>
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
        {fmt(item.price)}
      </p>
    </div>
  );
}
