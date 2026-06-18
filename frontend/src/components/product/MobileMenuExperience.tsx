import Image from "next/image";
import { useRef, useState, type ElementType } from "react";
import {
  Beef,
  Bell,
  ChevronRight,
  CheckCircle2,
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

type MobileCategory =
  | "burger"
  | "chicken"
  | "bacon"
  | "combo"
  | "bebida"
  | "promo"
  | "sobremesa";

const MOBILE_CATEGORIES: Array<{
  id: MobileCategory;
  label: string;
  icon: ElementType;
}> = [
  { id: "burger", label: "Burgers", icon: Beef },
  { id: "chicken", label: "Chicken", icon: Drumstick },
  { id: "bacon", label: "Bacon", icon: Utensils },
  { id: "combo", label: "Combos", icon: Package },
  { id: "bebida", label: "Bebidas", icon: CupSoda },
  { id: "promo", label: "Promos", icon: Flame },
  { id: "sobremesa", label: "Sobremesas", icon: Gift },
];

const BEST_SELLER_IDS = ["double-burger", "menfis-bacon", "menfis-chicken"];
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

function saleRank(item: MenuItem) {
  const index = SALES_ORDER.indexOf(item.id);
  return index >= 0 ? index : SALES_ORDER.length + 1;
}

function compactDescription(item: MenuItem) {
  const name = item.name.toLowerCase();
  if (item.id === "combo2") {
    return "2 burgers 100g + 2 batatas 200g + 2 refrigerantes";
  }
  if (name.includes("super") && name.includes("chicken")) {
    return "2 chickens 120g + 2 batatas 200g + 2 refrigerantes";
  }
  if (name.includes("super") && name.includes("bacon")) {
    return "2 bacons 100g + 40g bacon cada + 2 batatas 200g";
  }
  if (name.includes("double") && name.includes("chicken")) {
    return "2 chickens de 120g + batata 200g + refri";
  }
  if (name.includes("double")) return "2 carnes 100g + batata 200g + refri";
  if (name.includes("chicken")) return "Chicken 120g + batata 200g + refri";
  if (name.includes("bacon")) return "Bacon 100g + 40g bacon + batata 200g";
  if (item.category === "combo") return "Burger 100g + batata 200g + refri";
  if (item.category === "bebida") return "Bebida gelada";
  if (item.category === "extra") return item.desc;
  return "Burger Menfi's com molho da casa";
}

function categoryMatches(item: MenuItem, category: MobileCategory) {
  const text = `${item.id} ${item.name} ${item.tags.join(" ")}`.toLowerCase();
  if (category === "promo") {
    return Boolean(item.highlight || item.originalPrice || item.category === "combo");
  }
  if (category === "sobremesa") {
    return text.includes("sobremesa") || text.includes("doce") || text.includes("brownie");
  }
  if (category === "chicken") {
    return item.category === "burger" && text.includes("chicken");
  }
  if (category === "bacon") {
    return item.category === "burger" && text.includes("bacon");
  }
  if (category === "burger") {
    return (
      item.category === "burger" &&
      !text.includes("chicken") &&
      !text.includes("bacon")
    );
  }
  return item.category === category;
}

function bestsellerBadge(index: number) {
  if (index === 0) return "Mais vendido";
  if (index === 1) return "Favorito dos clientes";
  return "Novidade";
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
  const [category, setCategory] = useState<MobileCategory>("burger");
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<"reviews" | "club" | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const rewardCount = memberProfile?.orders ? memberProfile.orders % 10 : 0;
  const rewardRemaining = Math.max(0, 10 - rewardCount);
  const normalizedQuery = query.trim().toLowerCase();
  const sortedItems = [...items].sort((a, b) => saleRank(a) - saleRank(b));
  const visibleItems = sortedItems.filter((item) => {
    const matchesSearch =
      !normalizedQuery ||
      `${item.name} ${item.desc} ${item.tags.join(" ")}`
        .toLowerCase()
        .includes(normalizedQuery);
    return matchesSearch && categoryMatches(item, category);
  });
  const bestSellers = BEST_SELLER_IDS
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean) as MenuItem[];
  const heroItem =
    items.find((item) => item.id === "double-burger") ?? bestSellers[0] ?? items[0];
  const comboHighlight =
    items.find((item) => item.id === "combo2") ??
    sortedItems.find((item) => item.category === "combo");
  const promoItems = sortedItems.filter((item) => categoryMatches(item, "promo")).slice(0, 3);
  const categoryLabel =
    MOBILE_CATEGORIES.find((tab) => tab.id === category)?.label ?? "Produtos";
  const scrollToProducts = () => {
    document
      .getElementById("menfis-best-sellers")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="md:hidden" style={{ background: SURFACE, color: VERDE }}>
      <header className="relative overflow-hidden bg-white px-4 pb-5 pt-4">
        <div className="relative z-10 flex items-center justify-between gap-3">
          <button
            type="button"
            className="relative flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: ROSA, color: "#fff" }}
            aria-label="Abrir menu"
            onClick={onOpenMember}
          >
            <Menu size={24} strokeWidth={2.7} />
          </button>
          <button type="button" onClick={onOpenMember} className="text-center">
            <p
              className="uppercase"
              style={{
                color: ROSA,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "2.65rem",
                lineHeight: 0.85,
                letterSpacing: 0,
              }}
            >
              Menfi's
            </p>
            <p className="text-[11px] font-black uppercase tracking-[0.42em]">
              Burger
            </p>
          </button>
          <button
            type="button"
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white"
            style={{ border: `1px solid ${VERDE}12` }}
            aria-label="Notificacoes"
            onClick={onOpenNotifications}
          >
            <Bell size={21} strokeWidth={2.4} />
            {notificationCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black"
                style={{ background: ROSA, color: "#fff" }}
              >
                {notificationCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={goToCart}
            className="relative flex h-14 min-w-[86px] items-center justify-center gap-2 rounded-2xl px-3"
            style={{ background: ROSA, color: "#fff" }}
            aria-label="Abrir carrinho"
          >
            <ShoppingCart size={24} strokeWidth={2.7} />
            <span className="text-left">
              <span className="block text-lg font-black leading-none">{cartCount}</span>
              <span className="block text-[10px] font-black leading-none">
                {fmt(cartTotal)}
              </span>
            </span>
          </button>
        </div>

        <div className="relative z-10 mt-5 grid min-h-[265px] grid-cols-[1.05fr_0.95fr] items-center gap-1">
          <div className="min-w-0">
            <p
              className="uppercase text-black"
              style={{
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "4rem",
                lineHeight: 0.82,
                letterSpacing: 0,
              }}
            >
              Menfi's Burger
            </p>
            <p className="mt-3 text-lg font-black uppercase leading-tight">
              Hamburguer artesanal feito na hora.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <HeroMetric icon={Star} title="4,9" subtitle="avaliacao" onClick={() => setPanel("reviews")} />
              <HeroMetric icon={Timer} title="25-35 min" subtitle="entrega" />
              <HeroMetric icon={Flame} title="+500" subtitle="pedidos" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => heroItem && onOpenDetails(heroItem)}
            className="relative h-[250px] min-w-0 overflow-visible"
            aria-label={`Ver ${heroItem?.name ?? "produto"}`}
          >
            {heroItem?.image ? (
              <Image
                src={imageSrc(heroItem.image)}
                alt={heroItem.name}
                fill
                priority
                sizes="52vw"
                style={{ objectFit: "contain", objectPosition: "center" }}
              />
            ) : null}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setPanel("club")}
          className="relative z-10 mt-2 grid w-full grid-cols-[56px_1fr_auto] items-center gap-3 rounded-[18px] bg-black px-4 py-4 text-left text-white"
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: ROSA }}
          >
            <Gift size={25} strokeWidth={2.6} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black uppercase">Primeira compra?</span>
            <span className="block text-3xl font-black uppercase leading-none" style={{ color: ROSA }}>
              MFB10
            </span>
            <span className="block text-xs font-bold uppercase opacity-85">
              Ganhe 10% OFF no primeiro pedido
            </span>
          </span>
          <span className="text-right">
            <span className="block text-4xl font-black leading-none" style={{ color: ROSA }}>
              10%
            </span>
            <span className="block text-lg font-black leading-none" style={{ color: ROSA }}>
              OFF
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={scrollToProducts}
          className="relative z-10 mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black uppercase tracking-wide"
          style={{ background: ROSA, color: "#fff" }}
        >
          Fazer pedido agora <ChevronRight size={20} strokeWidth={2.8} />
        </button>

        <label
          className="relative z-10 mt-4 flex h-12 items-center gap-2 rounded-2xl bg-white px-4 shadow-sm"
          style={{ border: `1px solid ${VERDE}12` }}
        >
          <Search size={18} strokeWidth={2.4} style={{ opacity: 0.7 }} />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar bacon, chicken, combo, batata, Coca"
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:font-bold"
            style={{ color: VERDE }}
          />
        </label>
      </header>

      <nav
        className="sticky top-0 z-40 flex gap-3 overflow-x-auto border-y bg-white px-4 py-3 shadow-[0_12px_26px_rgba(101,0,31,0.08)]"
        style={{
          borderColor: `${VERDE}10`,
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
              className="flex min-w-[86px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-[11px] font-black uppercase"
              style={{
                background: active ? ROSA : "#fff",
                color: active ? "#fff" : VERDE,
                border: `1px solid ${active ? ROSA : `${VERDE}12`}`,
                boxShadow: active
                  ? "0 12px 24px rgba(236,23,103,0.24)"
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
        <section id="menfis-best-sellers" className="pt-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-wide">
              <Flame size={23} strokeWidth={2.5} style={{ color: ROSA }} />
              Mais pedidos hoje
            </h2>
            <button
              type="button"
              onClick={() => setCategory("burger")}
              className="flex items-center gap-1 text-xs font-black uppercase"
              style={{ color: ROSA }}
            >
              Ver todos <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
          <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2">
            {bestSellers.map((item, index) => (
              <BestSellerCard
                key={item.id}
                item={item}
                badge={bestsellerBadge(index)}
                onAdd={() => onQuickAdd(item)}
                onOpen={() => onOpenDetails(item)}
              />
            ))}
          </div>
        </section>

        {comboHighlight && (
          <section className="mt-5 overflow-hidden rounded-[22px] bg-black text-white">
            <div className="grid grid-cols-[1fr_118px] items-center gap-1 p-4">
              <div>
                <p
                  className="w-fit rounded-xl px-3 py-1 text-sm font-black uppercase"
                  style={{ background: ROSA }}
                >
                  Combo destaque
                </p>
                <h2 className="mt-3 text-xl font-black uppercase leading-tight">
                  {comboHighlight.name}
                </h2>
                <div className="mt-2 grid gap-1 text-sm font-bold opacity-90">
                  <p>✓ 2 Hamburgueres</p>
                  <p>✓ 2 Batatas</p>
                  <p>✓ 2 Refrigerantes</p>
                </div>
                <div className="mt-3 flex items-end gap-2">
                  {comboHighlight.originalPrice && (
                    <span className="text-xs font-bold line-through opacity-55">
                      De {fmt(comboHighlight.originalPrice)}
                    </span>
                  )}
                  <span className="text-3xl font-black" style={{ color: ROSA }}>
                    {fmt(comboHighlight.price)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenDetails(comboHighlight)}
                  className="mt-3 rounded-xl px-4 py-2 text-xs font-black uppercase"
                  style={{ background: ROSA, color: "#fff" }}
                >
                  Quero esse combo
                </button>
              </div>
              <button
                type="button"
                onClick={() => onOpenDetails(comboHighlight)}
                className="relative h-36 overflow-visible"
                aria-label={`Ver ${comboHighlight.name}`}
              >
                {comboHighlight.image ? (
                  <Image
                    src={imageSrc(comboHighlight.image)}
                    alt={comboHighlight.name}
                    fill
                    sizes="118px"
                    style={{ objectFit: "contain", objectPosition: "center" }}
                  />
                ) : null}
              </button>
            </div>
          </section>
        )}

        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-wide">Promocoes</h2>
            <button
              type="button"
              onClick={() => setCategory("promo")}
              className="text-xs font-black uppercase"
              style={{ color: ROSA }}
            >
              Ver promos
            </button>
          </div>
          <div className="mt-3 grid gap-3">
            <PromoBanner title="MFB10" copy="10% OFF na primeira compra" />
            <PromoBanner title="Quarta em dobro" copy="Segundo combo com 50% OFF" />
            <PromoBanner title="Frete gratis" copy="Acima de R$ 49 no Clube Menfi's" />
          </div>
        </section>

        <section className="mt-5">
          <h2 className="text-lg font-black uppercase tracking-wide">
            {category === "promo" ? "Promocoes ativas" : categoryLabel}
          </h2>
          <div className="mt-3 grid gap-3">
            {(category === "promo" ? promoItems : visibleItems).map((item) => (
              <MobileListItem
                key={item.id}
                item={item}
                onAdd={() => onQuickAdd(item)}
                onOpen={() => onOpenDetails(item)}
              />
            ))}
            {(category === "sobremesa" || visibleItems.length === 0) && (
              <div
                className="rounded-[18px] bg-white p-5 text-sm font-bold leading-relaxed"
                style={{ border: `1px solid ${VERDE}12` }}
              >
                Sobremesas entram aqui quando estiverem cadastradas no cardapio.
              </div>
            )}
          </div>
        </section>

        {cartCount > 0 && (
          <section className="mt-5 rounded-[20px] bg-white p-4" style={{ border: `1px solid ${VERDE}12` }}>
            <p className="text-sm font-black uppercase">Seu pedido esta esperando.</p>
            <p className="mt-1 text-sm font-semibold opacity-70">
              Finalize agora e use MFB10 se for sua primeira compra.
            </p>
          </section>
        )}

        <section className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={() => setPanel("club")}
            className="rounded-[20px] bg-white p-4 text-left"
            style={{ border: `1px solid ${VERDE}12` }}
          >
            <p className="text-lg font-black uppercase">Clube Menfi's</p>
            <p className="mt-1 text-sm font-semibold opacity-70">
              Frete gratis, cupons, cashback e promocoes antecipadas.
            </p>
            <p className="mt-3 text-sm font-black">
              {rewardCount}/10 pedidos para voucher de troca
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPanel("reviews")}
            className="rounded-[20px] bg-white p-4 text-left"
            style={{ border: `1px solid ${VERDE}12` }}
          >
            <p className="text-lg font-black uppercase">Prova social</p>
            <p className="mt-2 text-sm font-black">★★★★★</p>
            <p className="mt-1 text-sm font-semibold opacity-70">
              "Melhor hamburguer de Fortaleza." Joao Silva
            </p>
            <p className="mt-1 text-sm font-semibold opacity-70">
              "Chegou quente." Maria Santos
            </p>
          </button>
        </section>

        <footer className="mt-5 grid grid-cols-2 gap-2 pb-2 text-xs font-black uppercase">
          {["Pix e cartao", "Ambiente seguro", "Atendimento WhatsApp", "Pedido protegido", "Politica de privacidade", "Termos de uso"].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-2xl bg-white p-3" style={{ border: `1px solid ${VERDE}10` }}>
              <CheckCircle2 size={16} strokeWidth={2.5} style={{ color: ROSA }} />
              {item}
            </div>
          ))}
        </footer>
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

function HeroMetric({
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
      className="min-w-0 border-r px-1 text-center last:border-r-0"
      style={{ borderColor: `${VERDE}16` }}
    >
      <Icon size={22} strokeWidth={2.7} style={{ color: ROSA, margin: "0 auto" }} />
      <span className="mt-1 block text-sm font-black leading-tight">{title}</span>
      <span className="block text-[10px] font-bold leading-tight opacity-70">
        {subtitle}
      </span>
    </Component>
  );
}

function PromoBanner({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] bg-white p-4 shadow-sm">
      <span className="min-w-0">
        <span className="block text-lg font-black uppercase" style={{ color: ROSA }}>
          {title}
        </span>
        <span className="mt-1 block text-sm font-semibold opacity-70">{copy}</span>
      </span>
      <Gift size={26} strokeWidth={2.5} style={{ color: VERDE }} />
    </div>
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
  const [reviewText, setReviewText] = useState("");
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
      <form
        className="mt-4 rounded-2xl bg-white p-4"
        style={{ border: `1px solid ${VERDE}12` }}
        onSubmit={(event) => {
          event.preventDefault();
          setReviewText("");
        }}
      >
        <label className="block text-sm font-black uppercase tracking-wide">
          Deixe sua avaliação
        </label>
        <textarea
          value={reviewText}
          onChange={(event) => setReviewText(event.target.value)}
          className="mt-3 min-h-24 w-full resize-none rounded-2xl bg-transparent p-3 text-sm font-semibold leading-relaxed outline-none"
          style={{ border: `1px solid ${VERDE}14`, color: VERDE }}
          placeholder="Conte como foi seu pedido"
        />
        <button
          type="submit"
          disabled={!reviewText.trim()}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-2xl text-xs font-black uppercase tracking-wide disabled:opacity-40"
          style={{ background: VERDE, color: ROSA }}
        >
          Enviar avaliação
        </button>
      </form>
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
  const voucherValue = 21.9;
  const exchangeItems = [
    {
      label: "Voucher Menfi's Burger",
      value: voucherValue,
      copy: "Liberado ao completar 10 pedidos.",
    },
    {
      label: "Molho extra",
      value: 2.9,
      copy: "Valor de referência do adicional.",
    },
    {
      label: "Extra queijo",
      value: 2,
      copy: "Valor de referência do adicional.",
    },
    {
      label: "Refrigerante zero",
      value: 8.9,
      copy: "Valor de referência da bebida.",
    },
  ];
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
                ? `Faltam ${rewardRemaining} pedidos para liberar um voucher de troca.`
                : `Voucher de ${fmt(voucherValue)} liberado para troca.`}
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
        {exchangeItems.map((benefit) => (
          <div
            key={benefit.label}
            className="flex items-center gap-3 rounded-2xl p-4"
            style={{ border: `1px solid ${VERDE}12` }}
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
            <span
              className="shrink-0"
              style={{
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "1.4rem",
                lineHeight: 1,
              }}
            >
              {fmt(benefit.value)}
            </span>
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
