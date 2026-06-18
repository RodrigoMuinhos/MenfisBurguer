import Image from "next/image";
import { useRef, useState, type ElementType } from "react";
import {
  Beef,
  Bell,
  ChevronRight,
  ClipboardList,
  CupSoda,
  Drumstick,
  Flame,
  Gift,
  Home,
  Menu,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Star,
  Timer,
  Utensils,
  UserRound,
  X,
} from "lucide-react";
import { MenuItem } from "@/features/catalog/types";
import { ROSA, SURFACE, VERDE } from "@/utils/theme";
import { fmt, imageSrc, MemberProfile } from "./shared";

type MobileCategory = "promo" | "burger" | "chicken" | "bacon" | "extra" | "bebida";

const MOBILE_CATEGORIES: Array<{
  id: MobileCategory;
  label: string;
  icon: ElementType;
}> = [
  { id: "promo", label: "Promocoes", icon: Flame },
  { id: "burger", label: "Burgers", icon: Beef },
  { id: "chicken", label: "Chicken", icon: Drumstick },
  { id: "bacon", label: "Bacon", icon: Utensils },
  { id: "extra", label: "Acompanh.", icon: Package },
  { id: "bebida", label: "Bebidas", icon: CupSoda },
];

const BEST_SELLER_IDS = ["combo2", "combo", "double-combo"];
const SALES_ORDER = [
  "combo2",
  "combo",
  "double-combo",
  "chicken-combo",
  "bacon-combo",
  "double-chicken-combo",
  "double-bacon-combo",
  "chicken-super-combo",
  "bacon-super-combo",
  "menfis-chicken",
  "menfis-bacon",
  "burger",
  "double-burger",
  "batata",
  "coca-zero",
  "guarana-zero",
  "agua-com-gas",
];

function saleRank(item: MenuItem) {
  const index = SALES_ORDER.indexOf(item.id);
  return index >= 0 ? index : SALES_ORDER.length + 1;
}

function compactDescription(item: MenuItem) {
  const name = item.name.toLowerCase();
  if (item.id === "combo2") return "2 burgers + batata + 2 refrigerantes";
  if (name.includes("super") && name.includes("chicken")) {
    return "2 chicken + batata + 2 refrigerantes";
  }
  if (name.includes("super") && name.includes("bacon")) {
    return "2 bacon + batata + 2 refrigerantes";
  }
  if (name.includes("double") && name.includes("chicken")) {
    return "2 chickens de 120g + batata + refri";
  }
  if (name.includes("double")) return "2 carnes + batata + refrigerante";
  if (name.includes("chicken")) return "Chicken + batata + refrigerante";
  if (name.includes("bacon")) return "Bacon + batata + refrigerante";
  if (item.category === "combo") return "Burger + batata + refrigerante";
  if (item.category === "bebida") return "Bebida gelada";
  if (item.category === "extra") return item.desc;
  return "Burger Menfi's com molho da casa";
}

function categoryMatches(item: MenuItem, category: MobileCategory) {
  const text = `${item.id} ${item.name} ${item.tags.join(" ")}`.toLowerCase();
  if (category === "promo") return true;
  if (category === "chicken") return text.includes("chicken");
  if (category === "bacon") return text.includes("bacon");
  if (category === "burger") {
    return (
      item.category === "burger" &&
      !text.includes("chicken") &&
      !text.includes("bacon")
    );
  }
  return item.category === category;
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
  const [category, setCategory] = useState<MobileCategory>("promo");
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<"reviews" | "club" | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const rewardCount = memberProfile?.orders ? memberProfile.orders % 10 : 0;
  const rewardRemaining = Math.max(0, 10 - rewardCount);
  const normalizedQuery = query.trim().toLowerCase();
  const sortedItems = [...items].sort((a, b) => saleRank(a) - saleRank(b));
  const bestSellers = BEST_SELLER_IDS
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean) as MenuItem[];
  const visibleItems = sortedItems.filter((item) => {
    const matchesSearch =
      !normalizedQuery ||
      `${item.name} ${item.desc} ${item.tags.join(" ")}`
        .toLowerCase()
        .includes(normalizedQuery);
    return matchesSearch && categoryMatches(item, category);
  });

  return (
    <div className="md:hidden" style={{ background: SURFACE, color: VERDE }}>
      <header
        className="sticky top-0 z-40 border-b px-4 pb-3 pt-4"
        style={{
          background: "rgba(255,248,242,0.96)",
          borderColor: `${VERDE}12`,
          backdropFilter: "blur(18px)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white"
            style={{ border: `1px solid ${VERDE}12` }}
            aria-label="Abrir menu"
            onClick={onOpenMember}
          >
            <Menu size={22} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={onOpenMember}
          >
            <p
              className="uppercase"
              style={{
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "2rem",
                lineHeight: 0.86,
                letterSpacing: 0,
              }}
            >
              Menfi's
            </p>
            <p className="text-[11px] font-black uppercase tracking-[0.28em]">
              Burger
            </p>
          </button>
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white"
            style={{ border: `1px solid ${VERDE}12` }}
            aria-label="Notificacoes"
            onClick={onOpenNotifications}
          >
            <Bell size={21} strokeWidth={2.4} />
            {notificationCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black"
                style={{ background: ROSA, color: VERDE }}
              >
                {notificationCount}
              </span>
            )}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-[20px] bg-white text-center shadow-sm">
          <CompactInfo
            icon={Star}
            title="4,9"
            subtitle="avaliacao"
            onClick={() => setPanel("reviews")}
          />
          <CompactInfo icon={Timer} title="30-45 min" subtitle="entrega" />
          <button
            type="button"
            onClick={() => setPanel("club")}
            className="flex items-center justify-center gap-2 border-l px-2 py-3 text-left"
            style={{ borderColor: `${VERDE}12` }}
          >
            <Gift size={21} strokeWidth={2.4} style={{ color: VERDE }} />
            <span className="min-w-0">
              <span className="block text-[12px] font-black leading-tight">
                Clube Menfi's
              </span>
              <span className="block text-[11px] font-bold opacity-55">
                {rewardCount}/10 pedidos
              </span>
            </span>
            <ChevronRight size={16} strokeWidth={2.4} />
          </button>
        </div>

        <label
          className="mt-3 flex h-11 items-center gap-2 rounded-full bg-white px-4"
          style={{ border: `1px solid ${VERDE}10` }}
        >
          <Search size={18} strokeWidth={2.4} style={{ opacity: 0.7 }} />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar"
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:font-bold"
            style={{ color: VERDE }}
          />
        </label>
      </header>

      <nav
        className="sticky top-[188px] z-30 flex gap-2 overflow-x-auto px-4 py-3"
        style={{
          background: "rgba(255,248,242,0.96)",
          backdropFilter: "blur(18px)",
        }}
      >
        {MOBILE_CATEGORIES.map((tab) => {
          const Icon = tab.icon;
          const active = category === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategory(tab.id)}
              className="flex min-w-[92px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-xs font-black"
              style={{
                background: active ? VERDE : "#fff",
                color: active ? "#fff" : VERDE,
                border: `1px solid ${active ? VERDE : `${VERDE}12`}`,
                boxShadow: active
                  ? "0 12px 26px rgba(101,0,31,0.22)"
                  : "0 8px 20px rgba(101,0,31,0.06)",
              }}
            >
              <Icon size={21} strokeWidth={2.3} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main className="px-4 pb-44">
        <section className="pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase tracking-wide">
              Mais vendidos
            </h2>
            <button
              type="button"
              onClick={() => setCategory("promo")}
              className="flex items-center gap-1 text-sm font-bold opacity-70"
            >
              Ver todos <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
          <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2">
            {bestSellers.map((item, index) => (
              <BestSellerCard
                key={item.id}
                item={item}
                badge={index === 0 ? "Mais vendido" : index === 1 ? "Mais pedido" : "Fome de respeito"}
                onAdd={() => onQuickAdd(item)}
                onOpen={() => onOpenDetails(item)}
              />
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h2 className="text-lg font-black uppercase tracking-wide">
            {category === "promo"
              ? "Combos"
              : MOBILE_CATEGORIES.find((tab) => tab.id === category)?.label}
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
          </div>
        </section>
      </main>

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-[72px] z-50 p-4">
          <button
            type="button"
            onClick={goToCart}
            className="flex h-20 w-full items-center justify-between gap-4 rounded-[28px] px-4 shadow-2xl"
            style={{
              background: VERDE,
              color: "#fff",
              boxShadow: "0 18px 40px rgba(101,0,31,0.28)",
            }}
          >
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
              <ShoppingCart size={25} strokeWidth={2.6} style={{ color: VERDE }} />
              <span
                className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-black"
                style={{ background: ROSA, color: VERDE }}
              >
                {cartCount}
              </span>
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-lg font-black leading-tight">
                {cartCount} {cartCount === 1 ? "item" : "itens"}
              </span>
              <span className="block text-xl font-black leading-tight">
                {fmt(cartTotal)}
              </span>
            </span>
            <span
              className="flex h-12 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-black"
              style={{ background: ROSA, color: VERDE }}
            >
              Finalizar pedido <ChevronRight size={18} strokeWidth={2.8} />
            </span>
          </button>
        </div>
      )}

      <MobileBottomNav
        cartCount={cartCount}
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
          onOpenProfile={onOpenMember}
        />
      )}
    </div>
  );
}

function CompactInfo({
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
      className="flex items-center justify-center gap-2 border-r px-2 py-3 text-left"
      style={{ borderColor: `${VERDE}12` }}
    >
      <Icon size={21} strokeWidth={2.4} style={{ color: VERDE }} />
      <span className="text-left">
        <span className="block text-sm font-black leading-tight">{title}</span>
        <span className="block text-[11px] font-bold opacity-55">{subtitle}</span>
      </span>
    </Component>
  );
}

function MobileBottomNav({
  cartCount,
  onHome,
  onSearch,
  onOrders,
  onClub,
  onProfile,
}: {
  cartCount: number;
  onHome: () => void;
  onSearch: () => void;
  onOrders: () => void;
  onClub: () => void;
  onProfile: () => void;
}) {
  const items = [
    { label: "Inicio", icon: Home, onClick: onHome, active: true },
    { label: "Buscar", icon: Search, onClick: onSearch },
    { label: "Pedidos", icon: ClipboardList, onClick: onOrders, badge: cartCount },
    { label: "Clube", icon: Gift, onClick: onClub },
    { label: "Perfil", icon: UserRound, onClick: onProfile },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-white px-2 pb-2 pt-2 shadow-[0_-12px_30px_rgba(101,0,31,0.08)]"
      style={{ borderColor: `${VERDE}12` }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className="relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-black"
            style={{ color: item.active ? VERDE : `${VERDE}99` }}
          >
            <span className="relative">
              <Icon size={21} strokeWidth={2.4} />
              {Boolean(item.badge) && (
                <span
                  className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black"
                  style={{ background: ROSA, color: VERDE }}
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
    <div className="fixed inset-0 z-[80] bg-black/35" onClick={onClose}>
      <section
        className="absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-auto rounded-t-[28px] bg-white p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black uppercase tracking-wide">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: `${ROSA}70`, color: VERDE }}
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
  const reviews = [
    {
      name: "Artur G.",
      text: "Burger chegou quente, molho muito bom e entrega dentro do prazo.",
    },
    {
      name: "Mariane C.",
      text: "Super Combo vale a pena para dividir. Batata crocante e bebida gelada.",
    },
    {
      name: "Paulo M.",
      text: "Double Menfi's veio bem servido. Carne suculenta e cheddar no ponto.",
    },
  ];
  return (
    <PanelShell title="Avaliacoes Menfi's" onClose={onClose}>
      <div className="mt-4 rounded-2xl p-4" style={{ background: `${ROSA}55` }}>
        <p
          style={{
            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
            fontSize: "3.2rem",
            lineHeight: 0.9,
          }}
        >
          4,9
        </p>
        <p className="mt-1 text-sm font-black uppercase tracking-wide">
          Baseado em 86 avaliacoes
        </p>
        <p className="mt-2 text-sm font-semibold opacity-70">
          Clientes destacam entrega quente, combos bem servidos e molho da casa.
        </p>
      </div>
      <div className="mt-4 grid gap-3">
        {reviews.map((review) => (
          <article
            key={review.name}
            className="rounded-2xl bg-white p-4"
            style={{ border: `1px solid ${VERDE}12` }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-black">{review.name}</p>
              <p className="text-sm font-black">★★★★★</p>
            </div>
            <p className="mt-2 text-sm font-semibold leading-relaxed opacity-70">
              {review.text}
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
  onOpenProfile,
}: {
  rewardCount: number;
  rewardRemaining: number;
  onClose: () => void;
  onOpenProfile: () => void;
}) {
  const progress = Math.min(100, (rewardCount / 10) * 100);
  return (
    <PanelShell title="Clube Menfi's" onClose={onClose}>
      <div className="mt-4 rounded-2xl p-4" style={{ background: `${ROSA}55` }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-wide">
              {rewardCount}/10 pedidos
            </p>
            <p className="mt-1 text-sm font-semibold opacity-70">
              {rewardRemaining > 0
                ? `Faltam ${rewardRemaining} para ganhar um beneficio.`
                : "Voce ja pode resgatar seu beneficio."}
            </p>
          </div>
          <Gift size={34} strokeWidth={2.2} />
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full"
            style={{ width: `${progress}%`, background: VERDE }}
          />
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {["1 burger gratis", "Frete gratis", "Molho extra", "Cupom exclusivo"].map((benefit) => (
          <div
            key={benefit}
            className="flex items-center gap-3 rounded-2xl p-4"
            style={{ border: `1px solid ${VERDE}12` }}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: `${ROSA}70` }}
            >
              <Gift size={19} strokeWidth={2.4} />
            </span>
            <p className="font-black">{benefit}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          onClose();
          onOpenProfile();
        }}
        className="mt-5 flex h-13 w-full items-center justify-center rounded-2xl text-sm font-black uppercase tracking-wide"
        style={{ background: VERDE, color: ROSA }}
      >
        Ver minha conta
      </button>
    </PanelShell>
  );
}

function BestSellerCard({
  item,
  badge,
  onAdd,
  onOpen,
}: {
  item: MenuItem;
  badge: string;
  onAdd: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="w-[210px] shrink-0 snap-start overflow-hidden rounded-[18px] bg-white shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        className="relative h-32 w-full overflow-hidden text-left"
        aria-label={`Ver detalhes de ${item.name}`}
      >
        {item.image ? (
          <Image
            src={imageSrc(item.image)}
            alt={item.name}
            fill
            sizes="210px"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        ) : null}
        <span
          className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black uppercase"
          style={{ background: VERDE, color: "#fff" }}
        >
          {badge}
        </span>
      </button>
      <div className="p-3">
        <h3
          className="line-clamp-2 uppercase"
          style={{
            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
            fontSize: "1.45rem",
            lineHeight: 0.95,
            letterSpacing: 0,
          }}
        >
          {item.name}
        </h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold opacity-65">
          {compactDescription(item)}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <p
            style={{
              fontFamily: "'Bebas Neue','Arial Black',sans-serif",
              fontSize: "1.55rem",
              lineHeight: 1,
            }}
          >
            {fmt(item.price)}
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{ background: ROSA, color: VERDE }}
            aria-label={`Adicionar ${item.name}`}
          >
            <Plus size={22} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </article>
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
    <article className="grid grid-cols-[1fr_104px] gap-3 rounded-[18px] bg-white p-3 shadow-sm">
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
          {compactDescription(item)}
        </p>
        <p className="mt-2 w-fit rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${ROSA}66` }}>
          {item.tags[0] ?? "Menfi's"}
        </p>
        <p
          className="mt-2"
          style={{
            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
            fontSize: "1.45rem",
            lineHeight: 1,
          }}
        >
          {fmt(item.price)}
        </p>
      </button>
      <div className="relative h-28 overflow-hidden rounded-2xl" style={{ background: `${ROSA}55` }}>
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
              sizes="104px"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          ) : null}
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-2xl shadow-lg"
          style={{ background: ROSA, color: VERDE }}
          aria-label={`Adicionar ${item.name}`}
        >
          <Plus size={22} strokeWidth={2.8} />
        </button>
      </div>
    </article>
  );
}
