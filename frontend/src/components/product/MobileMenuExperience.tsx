import Image from "next/image";
import { useMemo, useRef, useState, type ElementType } from "react";
import {
  Beef,
  Bell,
  ChevronRight,
  ClipboardList,
  Drumstick,
  Gift,
  Home,
  Menu,
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
} from "lucide-react";
import { MenuItem } from "@/features/catalog/types";
import { ROSA } from "@/utils/theme";
import { SUPPORT_WHATSAPP_URL } from "@/components/order/checkout";
import { fmt, imageSrc, MemberProfile } from "./shared";

type MobileCategory = "combo" | "burger" | "chicken" | "bacon";

const VINHO = "#65001F";
const MAGENTA = "#B20B47";
const PINK = "#EC1767";
const MOBILE_CATEGORIES: Array<{ id: MobileCategory; label: string; icon: ElementType }> = [
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
  if (category === "chicken") return item.category === "burger" && text.includes("chicken");
  if (category === "bacon") return item.category === "burger" && text.includes("bacon");
  if (category === "burger") {
    return item.category === "burger" && !text.includes("chicken") && !text.includes("bacon");
  }
  return item.category === category;
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
  const [panel, setPanel] = useState<"reviews" | "club" | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const rewardCount = memberProfile?.orders ? memberProfile.orders % 10 : 0;
  const rewardRemaining = Math.max(0, 10 - rewardCount);
  const normalizedQuery = query.trim().toLowerCase();

  const sortedItems = useMemo(() => [...items].sort((a, b) => saleRank(a) - saleRank(b)), [items]);
  const visibleItems = useMemo(
    () =>
      sortedItems.filter((item) => {
        const matchesSearch = !normalizedQuery || itemSearchText(item).includes(normalizedQuery);
        return matchesSearch && categoryMatches(item, category);
      }),
    [category, normalizedQuery, sortedItems],
  );
  const heroItem = items.find((item) => item.id === "double-burger") ?? items[0];
  const categoryLabel = MOBILE_CATEGORIES.find((tab) => tab.id === category)?.label ?? "Produtos";
  const whatsappText = encodeURIComponent("Oi, Menfi's! Quero fazer um pedido pelo WhatsApp.");

  const scrollToProducts = () => {
    document.getElementById("menfis-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="md:hidden bg-white" style={{ color: VINHO }}>
      <header className="relative overflow-hidden bg-white px-4 pb-5 pt-4">
        <div className="pointer-events-none absolute inset-0 z-0 bg-white" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <IconButton label="Abrir menu" icon={Menu} onClick={onOpenMember} filled />
          <button type="button" onClick={onOpenMember} className="text-center">
            <p className="uppercase" style={{ color: ROSA, fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: "2.65rem", lineHeight: 0.85, letterSpacing: 0 }}>
              Menfi's
            </p>
            <p className="text-[11px] font-black uppercase tracking-[0.42em]">Burger</p>
          </button>
          <IconButton label="Notificacoes" icon={Bell} onClick={onOpenNotifications} badge={notificationCount} />
          <button type="button" onClick={goToCart} className="relative flex h-14 min-w-[86px] items-center justify-center gap-2 rounded-2xl px-3" style={{ background: PINK, color: "#fff" }} aria-label="Abrir carrinho">
            <ShoppingCart size={24} strokeWidth={2.7} />
            <span className="text-left">
              <span className="block text-lg font-black leading-none">{cartCount}</span>
              <span className="block text-[10px] font-black leading-none">{fmt(cartTotal)}</span>
            </span>
          </button>
        </div>

        <div className="relative z-10 mt-4 flex flex-wrap gap-2">
          <TopTrustItem icon={Star} title="4.9" subtitle="avaliacao dos clientes" onClick={() => setPanel("reviews")} />
          <TopTrustItem icon={Gift} title="Frete gratis" subtitle="acima de R$ 59,90 no Clube" onClick={() => setPanel("club")} />
          <TopTrustItem icon={Timer} title="30-35 min" subtitle="entrega media" />
        </div>

        <div className="relative z-10 mt-4 min-h-[312px] overflow-hidden bg-white">
          <div className="relative z-30 max-w-[52%] pt-10">
            <p className="uppercase" style={{ fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: "4.35rem", lineHeight: 0.82, letterSpacing: 0, color: VINHO }}>
              Menfi's Burger
            </p>
            <p className="mt-3 text-lg font-black uppercase leading-tight">Hamburguer artesanal feito na hora.</p>
          </div>
          <button type="button" onClick={() => heroItem && onOpenDetails(heroItem)} className="absolute -right-20 top-0 z-10 h-[330px] w-[72%] overflow-visible bg-white" aria-label={`Ver ${heroItem?.name ?? "produto"}`}>
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

        <button type="button" onClick={() => setPanel("club")} className="relative z-10 mt-2 grid w-full grid-cols-[56px_1fr_auto] items-center gap-3 rounded-[18px] px-4 py-4 text-left text-white" style={{ background: VINHO }}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: ROSA, color: VINHO }}>
            <Gift size={25} strokeWidth={2.6} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black uppercase">Primeira compra?</span>
            <span className="block text-3xl font-black uppercase leading-none" style={{ color: ROSA }}>MFB10</span>
            <span className="block text-xs font-bold uppercase opacity-85">Ganhe 10% OFF no primeiro pedido</span>
          </span>
          <span className="text-right">
            <span className="block text-4xl font-black leading-none" style={{ color: ROSA }}>10%</span>
            <span className="block text-lg font-black leading-none" style={{ color: ROSA }}>OFF</span>
          </span>
        </button>

        <button type="button" onClick={scrollToProducts} className="relative z-10 mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black uppercase tracking-wide" style={{ background: PINK, color: "#fff" }}>
          Fazer pedido agora <ChevronRight size={20} strokeWidth={2.8} />
        </button>

        <label className="relative z-10 mt-4 flex h-12 items-center gap-2 rounded-2xl bg-white px-4 shadow-sm" style={{ border: `1px solid ${VINHO}12` }}>
          <Search size={18} strokeWidth={2.4} style={{ color: MAGENTA }} />
          <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar bacon, chicken, combo, batata, Coca" className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:font-bold" style={{ color: VINHO }} />
        </label>
      </header>

      <CategoryNav category={category} setCategory={setCategory} />

      <main className="px-3 pb-44 min-[390px]:px-4">
        <section id="menfis-products" className="pt-5">
          <h2 className="text-lg font-black uppercase tracking-wide">{categoryLabel}</h2>
          <div className="mt-3 grid gap-3">
            {visibleItems.map((item) => (
              <MobileListItem key={item.id} item={item} onAdd={() => onQuickAdd(item)} onOpen={() => onOpenDetails(item)} />
            ))}
            {visibleItems.length === 0 && (
              <div className="rounded-[18px] bg-white p-5 text-sm font-bold leading-relaxed" style={{ border: `1px solid ${VINHO}12` }}>
                Nenhum produto encontrado nesta categoria.
              </div>
            )}
          </div>
        </section>

        <section className="mt-5 grid gap-3">
          <button type="button" onClick={() => setPanel("club")} className="rounded-[20px] bg-white p-4 text-left" style={{ border: `1px solid ${VINHO}12` }}>
            <p className="text-lg font-black uppercase">Clube Menfi's</p>
            <p className="mt-1 text-sm font-semibold opacity-70">R$ 9,90/mes com frete gratis, cupons e ofertas antecipadas.</p>
            <p className="mt-3 text-sm font-black">{rewardCount}/10 pedidos no seu historico</p>
          </button>

        </section>
      </main>

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-[72px] z-50 p-4">
          <button type="button" onClick={goToCart} className="flex h-20 w-full items-center justify-between gap-3 rounded-[28px] px-4 shadow-2xl" style={{ background: VINHO, color: "#fff", boxShadow: "0 18px 40px rgba(101,0,31,0.28)" }}>
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
              <ShoppingCart size={25} strokeWidth={2.6} style={{ color: VINHO }} />
              <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-black" style={{ background: PINK, color: "#fff" }}>{cartCount}</span>
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-lg font-black leading-tight">{cartCount} {cartCount === 1 ? "item" : "itens"}</span>
              <span className="block text-xl font-black leading-tight">{fmt(cartTotal)}</span>
            </span>
            <span className="flex h-12 shrink-0 items-center gap-2 rounded-2xl px-3 text-xs font-black" style={{ background: PINK, color: "#fff" }}>
              FINALIZAR PEDIDO <ChevronRight size={17} strokeWidth={2.8} />
            </span>
          </button>
        </div>
      )}

      <a
        href={`${SUPPORT_WHATSAPP_URL}?text=${whatsappText}`}
        target="_blank"
        rel="noreferrer"
        className="fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl"
        style={{
          bottom: cartCount > 0 ? 160 : 86,
          background: VINHO,
          color: ROSA,
          boxShadow: "0 16px 34px rgba(101,0,31,0.32)",
        }}
        aria-label="Chamar Menfi's no WhatsApp"
      >
        <MessageCircle size={27} strokeWidth={2.6} />
      </a>

      <MobileBottomNav cartCount={cartCount} onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })} onSearch={() => searchRef.current?.focus()} onOrders={goToCart} onClub={() => setPanel("club")} onProfile={onOpenMember} />
      {panel === "reviews" && <ReviewsPanel onClose={() => setPanel(null)} />}
      {panel === "club" && <ClubPanel rewardCount={rewardCount} rewardRemaining={rewardRemaining} onClose={() => setPanel(null)} onOpenProfile={onOpenMember} />}
    </div>
  );
}

function IconButton({ label, icon: Icon, onClick, badge = 0, filled = false }: { label: string; icon: ElementType; onClick: () => void; badge?: number; filled?: boolean }) {
  return (
    <button type="button" className="relative flex h-12 w-12 items-center justify-center rounded-full" style={{ background: filled ? ROSA : "#fff", color: VINHO, border: filled ? "none" : `1px solid ${VINHO}12` }} aria-label={label} onClick={onClick}>
      <Icon size={filled ? 24 : 21} strokeWidth={filled ? 2.7 : 2.4} />
      {badge > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black" style={{ background: PINK, color: "#fff" }}>{badge}</span>}
    </button>
  );
}

function TopTrustItem({ icon: Icon, title, subtitle, onClick }: { icon: ElementType; title: string; subtitle: string; onClick?: () => void }) {
  const Component = onClick ? "button" : "div";
  return (
    <Component type={onClick ? "button" : undefined} onClick={onClick} className="flex min-h-12 flex-1 basis-[30%] items-center gap-2 rounded-2xl bg-white px-2 py-2 text-left shadow-sm" style={{ border: `1px solid ${VINHO}10` }}>
      <Icon size={17} strokeWidth={2.5} style={{ color: PINK }} />
      <span className="min-w-0">
        <span className="block text-[11px] font-black leading-tight">{title}</span>
        <span className="block text-[9px] font-bold leading-tight opacity-65">{subtitle}</span>
      </span>
    </Component>
  );
}

function CategoryNav({ category, setCategory }: { category: MobileCategory; setCategory: (value: MobileCategory) => void }) {
  return (
    <nav className="sticky top-0 z-40 flex gap-3 overflow-x-auto border-y bg-white px-4 py-3 shadow-[0_12px_26px_rgba(101,0,31,0.08)]" style={{ borderColor: `${VINHO}10` }}>
      {MOBILE_CATEGORIES.map((tab) => {
        const Icon = tab.icon;
        const active = category === tab.id;
        return (
          <button key={tab.id} type="button" onClick={() => setCategory(tab.id)} className="flex min-w-[92px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-[11px] font-black uppercase" style={{ background: active ? VINHO : "#fff", color: active ? ROSA : VINHO, border: `1px solid ${active ? VINHO : `${VINHO}12`}`, boxShadow: active ? "0 12px 24px rgba(101,0,31,0.22)" : "0 8px 20px rgba(101,0,31,0.06)", transition: "background 160ms ease, color 160ms ease, transform 160ms ease", transform: active ? "translateY(-2px)" : "translateY(0)" }}>
            <Icon size={21} strokeWidth={2.3} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function MobileBottomNav({ cartCount, onHome, onSearch, onOrders, onClub, onProfile }: { cartCount: number; onHome: () => void; onSearch: () => void; onOrders: () => void; onClub: () => void; onProfile: () => void }) {
  const items = [
    { label: "Inicio", icon: Home, onClick: onHome, active: true },
    { label: "Buscar", icon: Search, onClick: onSearch },
    { label: "Pedidos", icon: ClipboardList, onClick: onOrders, badge: cartCount },
    { label: "Clube", icon: Gift, onClick: onClub },
    { label: "Perfil", icon: UserRound, onClick: onProfile },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-white px-2 pb-2 pt-2 shadow-[0_-12px_30px_rgba(101,0,31,0.08)]" style={{ borderColor: `${VINHO}12` }}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.label} type="button" onClick={item.onClick} className="relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-black" style={{ color: item.active ? VINHO : `${VINHO}99` }}>
            <span className="relative">
              <Icon size={21} strokeWidth={2.4} />
              {Boolean(item.badge) && <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black" style={{ background: PINK, color: "#fff" }}>{item.badge}</span>}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function PanelShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] bg-[rgba(101,0,31,0.42)]" onClick={onClose}>
      <section className="absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-auto rounded-t-[28px] bg-white p-5" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black uppercase tracking-wide">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: `${ROSA}70`, color: VINHO }} aria-label="Fechar">
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
    { score: "4.9", text: "Melhor hamburguer que ja pedi." },
    { score: "5.0", text: "Chegou quente e muito rapido." },
    { score: "5.0", text: "Vale cada centavo." },
  ];
  return (
    <PanelShell title="Avaliacoes Menfi's" onClose={onClose}>
      <div className="mt-4 rounded-2xl p-4" style={{ background: "#fff" }}>
        <p style={{ fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: "3.2rem", lineHeight: 0.9 }}>4.9</p>
        <p className="mt-1 text-sm font-black uppercase tracking-wide">Avaliacao media dos clientes</p>
        <p className="mt-2 text-sm font-semibold opacity-70">Prova social real para decidir rapido.</p>
      </div>
      <div className="mt-4 grid gap-3">
        {reviews.map((review) => (
          <article key={review.text} className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${VINHO}12` }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black">★★★★★</p>
              <p className="font-black">{review.score}</p>
            </div>
            <p className="mt-2 text-sm font-semibold leading-relaxed opacity-70">"{review.text}"</p>
          </article>
        ))}
      </div>
    </PanelShell>
  );
}

function ClubPanel({ rewardCount, rewardRemaining, onClose, onOpenProfile }: { rewardCount: number; rewardRemaining: number; onClose: () => void; onOpenProfile: () => void }) {
  const progress = Math.min(100, (rewardCount / 10) * 100);
  const benefits = [
    { label: "Assinatura", value: "R$ 9,90/mes", copy: "Plano mensal do Clube Menfi's." },
    { label: "10 vouchers de frete gratis", value: "Mensal", copy: "Acima de R$ 59,90 para membros." },
    { label: "5 cupons de 10% OFF", value: "Opcao", copy: "Alternativa mensal aos vouchers de frete." },
    { label: "Promocoes exclusivas", value: "Clube", copy: "Ofertas especiais para membros." },
    { label: "Acesso antecipado", value: "Lancamentos", copy: "Novidades aparecem primeiro para membros." },
  ];
  return (
    <PanelShell title="Clube Menfi's" onClose={onClose}>
      <div className="mt-4 rounded-2xl p-4" style={{ background: "#fff" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-wide">{rewardCount}/10 pedidos</p>
            <p className="mt-1 text-sm font-semibold opacity-70">{rewardRemaining > 0 ? `Faltam ${rewardRemaining} pedidos no ciclo atual.` : "Ciclo completo no seu historico."}</p>
          </div>
          <Gift size={34} strokeWidth={2.2} />
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: VINHO }} />
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {benefits.map((benefit) => (
          <div key={benefit.label} className="flex items-center gap-3 rounded-2xl p-4" style={{ border: `1px solid ${VINHO}12` }}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: `${ROSA}70` }}>
              <Gift size={19} strokeWidth={2.4} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-black">{benefit.label}</span>
              <span className="mt-1 block text-xs font-semibold opacity-60">{benefit.copy}</span>
            </span>
            <span className="shrink-0 text-right text-sm font-black">{benefit.value}</span>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => { onClose(); onOpenProfile(); }} className="mt-5 flex h-13 w-full items-center justify-center rounded-2xl text-sm font-black uppercase tracking-wide" style={{ background: VINHO, color: ROSA }}>
        Ver minha conta
      </button>
    </PanelShell>
  );
}

function MobileListItem({ item, onAdd, onOpen }: { item: MenuItem; onAdd: () => void; onOpen: () => void }) {
  return (
    <article className="grid grid-cols-[minmax(0,1fr)_112px] gap-3 overflow-hidden rounded-[18px] bg-white p-3 shadow-sm min-[390px]:grid-cols-[minmax(0,1fr)_132px]">
      <button type="button" onClick={onOpen} className="min-w-0 text-left">
        <h3 className="line-clamp-2 uppercase" style={{ fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: "1.45rem", lineHeight: 0.96, letterSpacing: 0 }}>{item.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm font-semibold opacity-70">{item.desc}</p>
        <p className="mt-2 w-fit rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${ROSA}66` }}>{item.tags[0] ?? "Menfi's"}</p>
        <PriceBlock item={item} className="mt-2" />
      </button>
      <div
        className="relative h-28 overflow-hidden rounded-2xl min-[390px]:h-32"
        style={{ background: "#fff" }}
      >
        <button type="button" onClick={onOpen} className="absolute inset-0" aria-label={`Ver detalhes de ${item.name}`}>
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
        <button type="button" onClick={onAdd} className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-2xl shadow-lg" style={{ background: PINK, color: "#fff" }} aria-label={`Adicionar ${item.name}`}>
          <Plus size={22} strokeWidth={2.8} />
        </button>
      </div>
    </article>
  );
}

function PriceBlock({ item, className = "", size = "list" }: { item: MenuItem; className?: string; size?: "list" | "card" }) {
  const discount = discountPercent(item);
  return (
    <div className={className}>
      {discount > 0 && item.originalPrice ? (
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-black uppercase line-through opacity-45">{fmt(item.originalPrice)}</span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: `${ROSA}66`, color: VINHO }}>
            -{discount}%
          </span>
        </div>
      ) : null}
      <p style={{ fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: size === "card" ? "1.55rem" : "1.45rem", lineHeight: 1, color: VINHO }}>
        {fmt(item.price)}
      </p>
    </div>
  );
}
