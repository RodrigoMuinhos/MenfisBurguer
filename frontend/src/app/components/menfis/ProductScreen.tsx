import { useMemo, useRef, useState } from "react";
import Image, { StaticImageData } from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  Beef,
  Bike,
  ChefHat,
  ChevronRight,
  Coffee,
  Flame,
  Gift,
  Loader2,
  Mail,
  MapPin,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { CartItem, CREME, ROSA, VERDE } from "./types";
import burgerPhoto from "@/imports/image-9.png";
import friesPhoto from "@/imports/image-20.png";
import colaPhoto from "@/imports/image-19.png";

type MenuItem = {
  id: string;
  name: string;
  eyebrow: string;
  desc: string;
  price: number;
  image?: StaticImageData | string;
  tags: string[];
  category: "burger" | "combo" | "bebida" | "extra";
  highlight?: boolean;
};

type BuilderState = {
  cheese: boolean;
  sauce: boolean;
};

type CustomizerState = {
  item: MenuItem;
  sauces: string[];
  drink: string;
  extras: string[];
  qty: number;
  note: string;
};

type MemberProfile = {
  name: string;
  email: string;
  phone: string;
  freeShipping: boolean;
  orders: number;
  rewards: number;
  createdAt: number;
};

const MENU_ITEMS: MenuItem[] = [
  {
    id: "burger",
    name: "Menfi's Burger",
    eyebrow: "Clássico da casa",
    desc: "Pão brioche selado, burger 100g, queijo, alface crocante, cebola caramelizada e molho Menfi's.",
    price: 23.9,
    image: burgerPhoto,
    tags: ["100g", "Molho da casa", "Brioche"],
    category: "burger",
    highlight: true,
  },
  {
    id: "double-burger",
    name: "Double Menfi's",
    eyebrow: "Mais carne",
    desc: "O dobro de burger, queijo derretido, cebola caramelizada e molho Menfi's no brioche.",
    price: 33.9,
    image: burgerPhoto,
    tags: ["Double", "Mais suculento", "Brioche"],
    category: "burger",
  },
  {
    id: "combo",
    name: "Combo Menfi's",
    eyebrow: "Pedido completo",
    desc: "Menfi's Burger com Coca-Cola 350ml e batata frita 250g. Ideal para quem quer o pedido fechado.",
    price: 37.9,
    image: burgerPhoto,
    tags: ["Burger", "Batata", "Refri"],
    category: "combo",
  },
  {
    id: "double-combo",
    name: "Double Combo Menfi's",
    eyebrow: "Pedido completo",
    desc: "Double Menfi's com Coca-Cola 350ml e batata frita 250g. Mais burger no combo.",
    price: 46.9,
    image: burgerPhoto,
    tags: ["Double", "Batata", "Refri"],
    category: "combo",
  },
  {
    id: "combo2",
    name: "Super Combo",
    eyebrow: "Para dividir",
    desc: "2 burgers, 2 Coca-Cola 350ml e batata frita. Melhor custo por pessoa.",
    price: 64.9,
    image: burgerPhoto,
    tags: ["2 pessoas", "Mais vendido", "Economia"],
    category: "combo",
    highlight: true,
  },
  {
    id: "batata",
    name: "Batata Frita",
    eyebrow: "Acompanhamento",
    desc: "Porção 250g crocante, finalizada quente para acompanhar o burger.",
    price: 15.9,
    image: friesPhoto,
    tags: ["250g", "Crocante"],
    category: "extra",
  },
  {
    id: "extra-queijo",
    name: "Extra Queijo",
    eyebrow: "Adicional",
    desc: "Camada extra de queijo derretido no burger.",
    price: 2,
    image: "/queijo.jpg",
    tags: ["Derretido", "Cremoso"],
    category: "extra",
  },
  {
    id: "extra-ovo",
    name: "Ovo",
    eyebrow: "Adicional",
    desc: "Ovo preparado para completar o burger.",
    price: 2.5,
    image: "/ovo.jpg",
    tags: ["Adicional", "Quente"],
    category: "extra",
  },
  {
    id: "extra-molho",
    name: "Molho Extra",
    eyebrow: "Adicional",
    desc: "Porção extra do molho Menfi's.",
    price: 2.9,
    image: "/maionese.jpg",
    tags: ["Molho da casa"],
    category: "extra",
  },
  {
    id: "cola",
    name: "Coca-Cola 350ml",
    eyebrow: "Bebida",
    desc: "Lata gelada para retirada ou envio junto do pedido.",
    price: 7.9,
    image: colaPhoto,
    tags: ["350ml", "Gelada"],
    category: "bebida",
  },
];

const CATEGORIES = [
  { id: "combo", label: "Combos", Icon: Package },
  { id: "burger", label: "Burgers", Icon: Beef },
  { id: "extra", label: "Extras", Icon: Flame },
  { id: "bebida", label: "Bebidas", Icon: Coffee },
] as const;

const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
const BURGER_ID = "burger";
const BURGER_PRICE = 23.9;
const CHEESE_PRICE = 2;
const SAUCE_PRICE = 2.9;
const COMBO_PRICE = 37.9;
const COMBO_UPGRADE_PRICE = COMBO_PRICE - BURGER_PRICE;
const MEMBER_KEY = "menfis_member";
const DELIVERY_STORAGE_KEY = "menfis_cliente";

const SAUCE_OPTIONS = [
  "Sem molho",
  "Barbecue",
  "Catchup",
  "Maionese temperada",
  "Maionese do chef",
  "Mostarda e mel",
];

const DRINK_OPTIONS = [
  "Coca-Cola 350ml",
  "Coca-Cola Zero 350ml",
  "Guarana 350ml",
  "Agua sem gas",
];

const EXTRA_OPTIONS = [
  { id: "extra-queijo", label: "Extra queijo", price: 2 },
  { id: "extra-ovo", label: "Ovo", price: 2.5 },
  { id: "extra-molho", label: "Molho extra", price: 2.9 },
  { id: "batata", label: "Batata frita", price: 15.9 },
];

function readMemberProfile(): MemberProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MEMBER_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.email) return null;
    return {
      name: String(data.name ?? ""),
      email: String(data.email ?? ""),
      phone: String(data.phone ?? ""),
      freeShipping: Boolean(data.freeShipping),
      orders: Number(data.orders ?? 0),
      rewards: Number(data.rewards ?? Math.floor(Number(data.orders ?? 0) / 10)),
      createdAt: Number(data.createdAt ?? Date.now()),
    };
  } catch {
    return null;
  }
}

function readSavedDelivery() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(DELIVERY_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildBurger(builder: BuilderState) {
  const additions = [
    builder.cheese ? "Extra queijo" : "",
    builder.sauce ? "Molho extra" : "",
  ].filter(Boolean);
  const price =
    BURGER_PRICE +
    (builder.cheese ? CHEESE_PRICE : 0) +
    (builder.sauce ? SAUCE_PRICE : 0);

  return {
    id: additions.length ? `burger-${additions.join("-").toLowerCase().replace(/\s+/g, "-")}` : BURGER_ID,
    name: additions.length
      ? `MENFI'S BURGER (${additions.join(" + ")})`
      : "MENFI'S BURGER",
    price,
  };
}

interface Props {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "qty">) => void;
  updateQty: (id: string, delta: number) => void;
  goToCart: () => void;
  goBack?: () => void;
  onAdminOpen?: () => void;
}

export function ProductScreen({
  cart,
  addToCart,
  updateQty,
  goToCart,
  onAdminOpen,
}: Props) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>(
    "combo",
  );
  const [builder, setBuilder] = useState<BuilderState>({
    cheese: false,
    sauce: false,
  });
  const [suggestion, setSuggestion] = useState<{
    item: Omit<CartItem, "qty">;
    canCombo: boolean;
  } | null>(null);
  const [customizer, setCustomizer] = useState<CustomizerState | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(
    () => readMemberProfile(),
  );
  const [memberError, setMemberError] = useState("");
  const [memberSaving, setMemberSaving] = useState(false);
  const adminTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adminTapCountRef = useRef(0);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const filteredItems = useMemo(
    () => MENU_ITEMS.filter((item) => item.category === category),
    [category],
  );
  const savedDelivery = readSavedDelivery();
  const memberProgress = memberProfile ? memberProfile.orders % 10 : 0;

  const qty = (id: string) => cart.find((item) => item.id === id)?.qty ?? 0;

  const handleAdminTap = () => {
    adminTapCountRef.current += 1;
    if (adminTapTimerRef.current) clearTimeout(adminTapTimerRef.current);

    if (adminTapCountRef.current >= 3) {
      adminTapCountRef.current = 0;
      adminTapTimerRef.current = null;
      onAdminOpen?.();
      return;
    }

    adminTapTimerRef.current = setTimeout(() => {
      adminTapCountRef.current = 0;
      adminTapTimerRef.current = null;
    }, 700);
  };

  const openCustomizer = (item: MenuItem) => {
    setCustomizer({
      item,
      sauces: [],
      drink: "",
      extras: [],
      qty: 1,
      note: "",
    });
  };

  const addMenuItem = (item: MenuItem) => {
    openCustomizer(item);
  };

  const confirmCustomizer = () => {
    if (!customizer) return;
    const requiresSauce =
      customizer.item.category === "burger" || customizer.item.category === "combo";
    const requiresDrink = customizer.item.category === "combo";
    if (
      (requiresSauce && customizer.sauces.length < 1) ||
      (requiresDrink && !customizer.drink)
    ) {
      return;
    }

    for (let i = 0; i < customizer.qty; i += 1) {
      addToCart({
        id: customizer.item.id,
        name: customizer.item.name.toUpperCase(),
        price: customizer.item.price,
      });
      customizer.extras.forEach((extraId) => {
        const extra = EXTRA_OPTIONS.find((option) => option.id === extraId);
        if (extra) {
          addToCart({
            id: extra.id,
            name: extra.label.toUpperCase(),
            price: extra.price,
          });
        }
      });
    }
    setSuggestion(null);
    setCustomizer(null);
  };

  const addComboUpgrade = () => {
    addToCart({
      id: "combo-upgrade",
      name: "TRANSFORMAR EM COMBO (BATATA + COCA-COLA)",
      price: COMBO_UPGRADE_PRICE,
    });
    setSuggestion(null);
  };

  const openMemberAccess = () => {
    if (memberProfile) {
      setProfileOpen(true);
      return;
    }
    setLoginOpen(true);
  };

  const editMember = () => {
    if (memberProfile) {
      setMemberName(memberProfile.name);
      setMemberEmail(memberProfile.email);
      setMemberPhone(memberProfile.phone);
    }
    setProfileOpen(false);
    setLoginOpen(true);
  };

  const saveMember = () => {
    const name = memberName.trim();
    const email = memberEmail.trim().toLowerCase();
    const phone = memberPhone.trim();
    setMemberError("");
    if (!name || !isEmail(email) || phone.replace(/\D/g, "").length < 10) {
      setMemberError("Preencha nome, email válido e WhatsApp para criar seu perfil.");
      return;
    }

    const existing = readMemberProfile();
    if (existing && existing.email.toLowerCase() !== email) {
      setMemberError(
        "Este aparelho já tem um perfil Menfi's. Use o mesmo email para manter seus benefícios.",
      );
      return;
    }

    setMemberSaving(true);
    window.setTimeout(() => {
      const profile: MemberProfile = {
        name,
        email,
        phone,
        freeShipping: true,
        orders: existing?.orders ?? 0,
        rewards: existing?.rewards ?? 0,
        createdAt: existing?.createdAt ?? Date.now(),
      };
      localStorage.setItem(MEMBER_KEY, JSON.stringify(profile));
      setMemberProfile(profile);
      setMemberSaving(false);
      setLoginOpen(false);
    }, 650);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#FFF8F2",
        color: VERDE,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(255,248,242,0.94)",
          backdropFilter: "blur(18px)",
          borderBottom: `1px solid ${VERDE}14`,
        }}
      >
        <div className="flex w-full items-center gap-4 px-4 py-3">
          <button
            onClick={handleAdminTap}
            aria-label="Menfi's Burger"
            className="shrink-0 overflow-hidden rounded-full"
            style={{
              width: 46,
              height: 46,
              background: "#fff",
              border: `2px solid ${ROSA}`,
              boxShadow: "0 10px 24px rgba(31,61,46,0.18)",
            }}
          >
            <img
              src="/logo_M_square.png"
              alt=""
              width={46}
              height={46}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </button>

          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-black uppercase tracking-[0.22em]"
              style={{ color: `${VERDE}80` }}
            >
              Menfi's Burger
            </p>
            <p
              className="truncate text-sm font-black uppercase tracking-wide"
              style={{ color: VERDE }}
            >
              Burger quente e entrega rápida. Feito com amor
            </p>
          </div>

          <button
            onClick={goToCart}
            disabled={cartCount === 0}
            className="flex items-center gap-2 rounded-full px-4 py-3 text-xs font-black uppercase tracking-wider disabled:opacity-35"
            style={{
              background: VERDE,
              color: ROSA,
              border: "none",
              cursor: cartCount > 0 ? "pointer" : "default",
            }}
          >
            <ShoppingBag size={16} strokeWidth={2.3} />
            {cartCount}
          </button>
        </div>
      </header>

      <main className="w-full px-0 pb-36 pt-0">
        <section
          className="mx-0 grid gap-4 overflow-hidden rounded-none p-4 md:grid-cols-[1.05fr_0.95fr] md:p-6"
          style={{
            background: ROSA,
            color: VERDE,
            boxShadow: "0 24px 70px rgba(31,61,46,0.12)",
          }}
        >
          <div className="flex min-h-[290px] flex-col justify-between gap-5">
            <div>
              <div className="flex flex-wrap gap-2">
                {["Burger suculento", "Molho da casa", "Entrega rápida"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider"
                      style={{
                        background: `${VERDE}10`,
                        color: VERDE,
                        border: `1px solid ${VERDE}18`,
                      }}
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>

              <h1
                className="mt-5 max-w-xl uppercase"
                style={{
                  fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                  fontSize: "clamp(3rem, 7vw, 6.8rem)",
                  lineHeight: 0.9,
                  letterSpacing: 0,
                  color: VERDE,
                }}
              >
                Burger no ponto, delivery sem enrolação
              </h1>
              <p
                className="mt-4 max-w-lg text-sm leading-relaxed md:text-base"
                style={{ color: `${VERDE}CC` }}
              >
                Combos generosos, burger suculento e entrega pensada para
                chegar quente na sua mesa.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Entrega", value: "Delivery Menfi's", Icon: Bike },
                { label: "Pedido", value: "Conferido antes da cozinha", Icon: ShieldCheck },
                {
                  label: "Delivery",
                  value: "Chega quentinho no conforto da sua casa",
                  Icon: Flame,
                },
              ].map(({ label, value, Icon }) => (
                <div
                  key={`${label}-${value}`}
                  className="rounded-2xl p-3"
                  style={{ background: "rgba(255,255,255,0.42)" }}
                >
                  <Icon size={16} strokeWidth={2.2} style={{ color: VERDE }} />
                  <p
                    className="mt-2 text-[9px] font-black uppercase tracking-wider"
                    style={{ color: `${VERDE}85` }}
                  >
                    {label}
                  </p>
                  <p className="mt-1 text-xs font-black" style={{ color: VERDE }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative min-h-[280px] overflow-hidden rounded-[24px]"
            style={{ background: "#F9D2C5" }}
          >
            <Image
              src={burgerPhoto}
              alt="Menfi's Burger"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: "cover", objectPosition: "center 42%" }}
            />
            <div
              className="absolute inset-x-0 bottom-0 p-4"
              style={{
                background:
                  "linear-gradient(to top, rgba(31,61,46,0.92), rgba(31,61,46,0))",
              }}
            >
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
                    Destaque
                  </p>
                  <p
                    className="uppercase"
                    style={{
                      fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                      fontSize: "2rem",
                      lineHeight: 1,
                      color: ROSA,
                    }}
                  >
                    Menfi's Burger
                  </p>
                </div>
                <button
                  onClick={() => addMenuItem(MENU_ITEMS[0])}
                  className="flex items-center gap-2 rounded-full px-4 py-3 text-xs font-black uppercase tracking-wider"
                  style={{ background: ROSA, color: VERDE }}
                >
                  Adicionar
                  <Plus size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pt-4">
          <button
            onClick={openMemberAccess}
            className="flex w-full items-center justify-between gap-3 rounded-[24px] p-4 text-left md:p-5"
            style={{
              background: memberProfile ? VERDE : "#fff",
              color: memberProfile ? ROSA : VERDE,
              border: `1px solid ${memberProfile ? VERDE : `${VERDE}12`}`,
              boxShadow: "0 12px 34px rgba(31,61,46,0.08)",
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: memberProfile ? `${ROSA}18` : `${ROSA}80`,
                }}
              >
                {memberProfile ? (
                  <ShieldCheck size={20} strokeWidth={2.4} />
                ) : (
                  <Gift size={20} strokeWidth={2.4} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wider">
                  {memberProfile
                    ? `${memberProfile.name}, seu perfil Menfi's`
                    : "Cadastre-se e ganhe frete grátis"}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ opacity: 0.72 }}>
                  {memberProfile
                    ? `${memberProfile.orders % 10}/10 pedidos para ganhar um burger. Dados de entrega ficam salvos.`
                    : "Entre no clube Menfi's para receber benefício e acompanhar pedidos pelo WhatsApp."}
                </p>
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={2.4} />
          </button>
        </section>

        <section className="mt-5 px-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(({ id, label, Icon }) => {
              const active = category === id;
              return (
                <button
                  key={id}
                  onClick={() => setCategory(id)}
                  className="flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-xs font-black uppercase tracking-wider"
                  style={{
                    background: active ? VERDE : "#fff",
                    color: active ? ROSA : VERDE,
                    border: `1px solid ${active ? VERDE : `${VERDE}14`}`,
                    boxShadow: active
                      ? "0 12px 28px rgba(31,61,46,0.18)"
                      : "none",
                  }}
                >
                  <Icon size={15} strokeWidth={2.2} />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6 px-4">
          <div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  qty={qty(item.id)}
                  builder={item.id === BURGER_ID ? builder : undefined}
                  onAdd={() => addMenuItem(item)}
                  onMinus={() => updateQty(item.id, -1)}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <div
        className="fixed inset-x-0 bottom-0 z-50"
        style={{
          background: "rgba(255,248,242,0.94)",
          borderTop: `1px solid ${VERDE}14`,
          backdropFilter: "blur(18px)",
        }}
      >
        <div className="flex w-full items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-black/40">
              Total do pedido
            </p>
            <p
              style={{
                color: VERDE,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "2rem",
                lineHeight: 1,
              }}
            >
              {cartCount > 0 ? fmt(cartTotal) : "R$ 0,00"}
            </p>
          </div>
          <button
            onClick={goToCart}
            disabled={cartCount === 0}
            className="flex min-h-14 items-center gap-2 rounded-2xl px-5 text-xs font-black uppercase tracking-wider disabled:opacity-35"
            style={{
              background: cartCount > 0 ? VERDE : `${VERDE}20`,
              color: cartCount > 0 ? ROSA : `${VERDE}70`,
              cursor: cartCount > 0 ? "pointer" : "default",
              border: "none",
            }}
          >
            <ShoppingBag size={17} strokeWidth={2.4} />
            Fechar pedido
          </button>
        </div>
      </div>

      <AnimatePresence>
        {loginOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[75] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          >
            <motion.div
              initial={{ y: 24, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 24, scale: 0.98 }}
              className="w-full max-w-md rounded-[28px] p-5"
              style={{ background: "#fff", color: VERDE }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/40">
                    Clube Menfi's
                  </p>
                  <h2
                    className="mt-2 uppercase"
                    style={{
                      fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                      fontSize: "2.4rem",
                      lineHeight: 0.95,
                    }}
                  >
                    Frete grátis no primeiro delivery
                  </h2>
                </div>
                <button
                  onClick={() => setLoginOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${VERDE}08`, color: VERDE }}
                >
                  <X size={18} strokeWidth={2.4} />
                </button>
              </div>

              <div
                className="mt-4 rounded-2xl p-4"
                style={{ background: ROSA, color: VERDE }}
              >
                <div className="flex items-center gap-2">
                  <UserRound size={17} strokeWidth={2.3} />
                  <p className="text-xs font-black uppercase tracking-wider">
                    Identifique-se como no app de delivery
                  </p>
                </div>
                <p className="mt-2 text-xs leading-relaxed" style={{ opacity: 0.68 }}>
                  Guardamos nome, email e WhatsApp para reconhecer você, aplicar
                  benefícios, lembrar a entrega e preparar o programa de pontos.
                  Você confirma a LGPD no checkout.
                </p>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
                    Nome
                  </span>
                  <input
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Seu nome"
                    className="rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
                    Email
                  </span>
                  <input
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="voce@email.com"
                    inputMode="email"
                    className="rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
                    WhatsApp
                  </span>
                  <input
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    inputMode="tel"
                    className="rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
                  />
                </label>
              </div>

              {memberError && (
                <p
                  className="mt-3 rounded-2xl px-3 py-2 text-xs font-bold leading-relaxed"
                  style={{ background: `${ROSA}70`, color: VERDE }}
                >
                  {memberError}
                </p>
              )}

              <button
                onClick={saveMember}
                disabled={memberSaving}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-wider"
                style={{
                  background: VERDE,
                  color: ROSA,
                  opacity: memberSaving ? 0.76 : 1,
                }}
              >
                {memberSaving ? "Criando perfil" : "Liberar frete grátis"}
                {memberSaving ? (
                  <Loader2
                    size={16}
                    strokeWidth={2.4}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <Gift size={16} strokeWidth={2.4} />
                )}
              </button>
              <button
                onClick={() => setLoginOpen(false)}
                className="mt-2 w-full rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
                style={{
                  background: "transparent",
                  color: VERDE,
                  border: `1.5px solid ${VERDE}12`,
                }}
              >
                Agora não
              </button>
            </motion.div>
          </motion.div>
        )}

        {profileOpen && memberProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[75] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          >
            <motion.div
              initial={{ y: 24, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 24, scale: 0.98 }}
              className="w-full max-w-md overflow-hidden rounded-[28px]"
              style={{ background: "#fff", color: VERDE }}
            >
              <div className="p-5" style={{ background: ROSA }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full"
                      style={{
                        background: "#fff",
                        border: `2px solid ${VERDE}`,
                      }}
                    >
                      <img
                        src="/logo_M_square.png"
                        alt=""
                        width={56}
                        height={56}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-55">
                        Perfil Menfi's
                      </p>
                      <h2 className="text-xl font-black leading-tight">
                        {memberProfile.name}
                      </h2>
                      <p className="mt-1 text-xs font-bold opacity-70">
                        Seu pedido chega quentinho no conforto da sua casa.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "#fff", color: VERDE }}
                  >
                    <X size={18} strokeWidth={2.4} />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 p-5">
                {[
                  {
                    icon: Mail,
                    title: memberProfile.email,
                    copy: "Email único deste perfil",
                  },
                  {
                    icon: UserRound,
                    title: memberProfile.phone,
                    copy: "WhatsApp para atualizações do pedido",
                  },
                  {
                    icon: MapPin,
                    title:
                      savedDelivery.street && savedDelivery.number
                        ? `${savedDelivery.street}, ${savedDelivery.number}`
                        : "Endereço salvo no checkout",
                    copy:
                      savedDelivery.cep || savedDelivery.complement
                        ? [savedDelivery.cep, savedDelivery.complement]
                            .filter(Boolean)
                            .join(" · ")
                        : "Preencha uma vez e o próximo pedido já lembra",
                  },
                ].map(({ icon: Icon, title, copy }) => (
                  <div
                    key={`${title}-${copy}`}
                    className="flex items-start gap-3 rounded-2xl p-3"
                    style={{ background: "#FFF8F2", border: `1px solid ${VERDE}10` }}
                  >
                    <Icon size={18} strokeWidth={2.2} className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black">{title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed opacity-58">
                        {copy}
                      </p>
                    </div>
                  </div>
                ))}

                <div
                  className="rounded-2xl p-4"
                  style={{ background: VERDE, color: ROSA }}
                >
                  <div className="flex items-center gap-2">
                    <Trophy size={18} strokeWidth={2.3} />
                    <p className="text-xs font-black uppercase tracking-wider">
                      Bônus Menfi's
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed opacity-75">
                    A cada 10 pedidos no perfil, você ganha 1 burger. Progresso atual:
                  </p>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/18">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(8, memberProgress * 10)}%`,
                        background: ROSA,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-black">
                    {memberProgress}/10 pedidos · {memberProfile.rewards} bônus liberado
                    {memberProfile.rewards === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={editMember}
                    className="rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
                    style={{ background: ROSA, color: VERDE }}
                  >
                    Editar perfil
                  </button>
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
                    style={{
                      background: "transparent",
                      color: VERDE,
                      border: `1.5px solid ${VERDE}12`,
                    }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {customizer && (
          <ProductCustomizer
            state={customizer}
            setState={setCustomizer}
            onConfirm={confirmCustomizer}
          />
        )}

        {suggestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          >
            <motion.div
              initial={{ y: 24, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 24, scale: 0.98 }}
              className="w-full max-w-md rounded-[28px] p-5"
              style={{ background: "#FFF8F2", color: VERDE }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/40">
                Sugestão para seu pedido
              </p>
              <h2
                className="mt-2 uppercase"
                style={{
                  fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                  fontSize: "2.45rem",
                  lineHeight: 0.95,
                }}
              >
                Quer melhorar esse burger?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-black/58">
                {suggestion.item.name} foi adicionado. Você pode completar com
                acompanhamento ou deixar o burger mais forte.
              </p>

              <div className="mt-5 grid gap-2">
                {suggestion.canCombo && (
                  <button
                    onClick={addComboUpgrade}
                    className="flex items-center justify-between rounded-2xl px-4 py-4 text-left"
                    style={{ background: VERDE, color: ROSA }}
                  >
                    <span>
                      <strong className="block text-xs uppercase tracking-wider">
                        Transformar em combo
                      </strong>
                      <span className="text-xs opacity-75">
                        Batata frita + Coca-Cola 350ml
                      </span>
                    </span>
                    <span
                      style={{
                        fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                        fontSize: "1.35rem",
                      }}
                    >
                      + {fmt(COMBO_UPGRADE_PRICE)}
                    </span>
                  </button>
                )}

              </div>

              <button
                onClick={() => setSuggestion(null)}
                className="mt-3 w-full rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-wider"
                style={{
                  background: "transparent",
                  color: VERDE,
                  border: `1.5px solid ${VERDE}16`,
                }}
              >
                Continuar sem upgrade
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function BurgerBuilder({
  builder,
  setBuilder,
}: {
  builder: BuilderState;
  setBuilder: React.Dispatch<React.SetStateAction<BuilderState>>;
}) {
  const options = [
    {
      id: "cheese",
      label: "Extra Queijo",
      copy: "Camada extra de queijo",
      price: CHEESE_PRICE,
    },
    {
      id: "sauce",
      label: "Molho extra",
      copy: "Porção extra do molho Menfi's",
      price: SAUCE_PRICE,
    },
  ] as const;

  return (
    <div
      className="rounded-[24px] p-4"
      style={{
        background: "#fff",
        border: `1px solid ${VERDE}12`,
        boxShadow: "0 14px 34px rgba(31,61,46,0.06)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35">
            Personalize o burger
          </p>
          <p className="mt-1 text-sm font-black uppercase" style={{ color: VERDE }}>
            Queijo e molho ficam dentro do pedido
          </p>
        </div>
        <span
          className="hidden rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider sm:block"
          style={{ background: `${ROSA}80`, color: VERDE }}
        >
          Opcionais
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const active = builder[option.id];
          return (
            <button
              key={option.id}
              onClick={() =>
                setBuilder((prev) => ({
                  ...prev,
                  [option.id]: !prev[option.id],
                }))
              }
              className="rounded-2xl p-3 text-left"
              style={{
                background: active ? VERDE : "#FFF8F2",
                color: active ? ROSA : VERDE,
                border: `1.5px solid ${active ? VERDE : `${VERDE}12`}`,
              }}
            >
              <p className="text-xs font-black uppercase tracking-wider">
                {option.label}
              </p>
              <p className="mt-1 text-[11px]" style={{ opacity: 0.65 }}>
                {option.copy}
              </p>
              <p
                className="mt-2"
                style={{
                  fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                  fontSize: "1.15rem",
                  lineHeight: 1,
                }}
              >
                + {fmt(option.price)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductCustomizer({
  state,
  setState,
  onConfirm,
}: {
  state: CustomizerState;
  setState: React.Dispatch<React.SetStateAction<CustomizerState | null>>;
  onConfirm: () => void;
}) {
  const needsSauce = state.item.category === "burger" || state.item.category === "combo";
  const needsDrink = state.item.category === "combo";
  const extrasTotal = state.extras.reduce((sum, extraId) => {
    const extra = EXTRA_OPTIONS.find((option) => option.id === extraId);
    return sum + (extra?.price ?? 0);
  }, 0);
  const total = (state.item.price + extrasTotal) * state.qty;
  const valid = (!needsSauce || state.sauces.length >= 1) && (!needsDrink || state.drink);

  const toggleSauce = (sauce: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const selected = prev.sauces.includes(sauce)
        ? prev.sauces.filter((item) => item !== sauce)
        : [...prev.sauces, sauce].slice(-2);
      return { ...prev, sauces: selected };
    });
  };

  const toggleExtra = (extraId: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const selected = prev.extras.includes(extraId)
        ? prev.extras.filter((item) => item !== extraId)
        : [...prev.extras, extraId].slice(0, 5);
      return { ...prev, extras: selected };
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 sm:items-center"
    >
      <motion.div
        initial={{ y: 40, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 40, scale: 0.98 }}
        className="max-h-[92dvh] w-full max-w-2xl overflow-hidden rounded-t-[28px] sm:rounded-[28px]"
        style={{ background: "#fff", color: VERDE }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4"
          style={{ background: "#fff", borderBottom: `1px solid ${VERDE}12` }}
        >
          <button
            onClick={() => setState(null)}
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: `${VERDE}08`, color: VERDE }}
            aria-label="Fechar"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
          <p className="text-center text-sm font-black">{state.item.name}</p>
          <div style={{ width: 40 }} />
        </div>

        <div className="max-h-[calc(92dvh-150px)] overflow-y-auto">
          <div className="relative h-48" style={{ background: CREME }}>
            {state.item.image ? (
              <Image
                src={state.item.image}
                alt={state.item.name}
                fill
                sizes="100vw"
                style={{ objectFit: "cover", objectPosition: "center" }}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ChefHat size={54} strokeWidth={1.5} style={{ opacity: 0.35 }} />
              </div>
            )}
          </div>

          <div className="px-5 py-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/35">
              {state.item.eyebrow}
            </p>
            <h2
              className="mt-2 uppercase"
              style={{
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "2.4rem",
                lineHeight: 0.95,
                letterSpacing: 0,
              }}
            >
              {state.item.name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-black/58">
              {state.item.desc}
            </p>
            <p
              className="mt-3"
              style={{
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "1.65rem",
                lineHeight: 1,
              }}
            >
              a partir de {fmt(state.item.price)}
            </p>
          </div>

          {needsSauce && (
            <OptionSection
              title="Molhos para o burger"
              subtitle="Escolha de 1 a 2 opções"
              required
            >
              {SAUCE_OPTIONS.map((sauce) => {
                const active = state.sauces.includes(sauce);
                return (
                  <button
                    key={sauce}
                    onClick={() => toggleSauce(sauce)}
                    className="flex w-full items-center justify-between gap-3 border-t px-5 py-4 text-left"
                    style={{ borderColor: `${VERDE}10`, background: active ? `${ROSA}45` : "#fff" }}
                  >
                    <span className="text-sm font-bold">{sauce}</span>
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-black"
                      style={{ background: active ? VERDE : `${VERDE}08`, color: active ? ROSA : VERDE }}
                    >
                      {active ? "✓" : "+"}
                    </span>
                  </button>
                );
              })}
            </OptionSection>
          )}

          {needsDrink && (
            <OptionSection
              title="Aceita uma bebida?"
              subtitle="Escolha 1 opção"
              required
            >
              {DRINK_OPTIONS.map((drink) => {
                const active = state.drink === drink;
                return (
                  <button
                    key={drink}
                    onClick={() => setState((prev) => (prev ? { ...prev, drink } : prev))}
                    className="flex w-full items-center justify-between gap-3 border-t px-5 py-4 text-left"
                    style={{ borderColor: `${VERDE}10`, background: active ? `${ROSA}45` : "#fff" }}
                  >
                    <span className="text-sm font-bold">{drink}</span>
                    <span
                      className="h-7 w-7 rounded-full"
                      style={{
                        border: `2px solid ${active ? VERDE : `${VERDE}18`}`,
                        background: active ? VERDE : "#fff",
                      }}
                    />
                  </button>
                );
              })}
            </OptionSection>
          )}

          <OptionSection title="Extras" subtitle="Escolha até 5 opções">
            {EXTRA_OPTIONS.map((extra) => {
              const active = state.extras.includes(extra.id);
              return (
                <button
                  key={extra.id}
                  onClick={() => toggleExtra(extra.id)}
                  className="flex w-full items-center justify-between gap-3 border-t px-5 py-4 text-left"
                  style={{ borderColor: `${VERDE}10`, background: active ? `${ROSA}45` : "#fff" }}
                >
                  <span>
                    <span className="block text-sm font-bold">{extra.label}</span>
                    <span className="text-xs text-black/50">+ {fmt(extra.price)}</span>
                  </span>
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-black"
                    style={{ background: active ? VERDE : `${VERDE}08`, color: active ? ROSA : VERDE }}
                  >
                    {active ? "✓" : "+"}
                  </span>
                </button>
              );
            })}
          </OptionSection>

          <div className="px-5 py-5">
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-black/45">
              Alguma observação?
            </p>
            <textarea
              value={state.note}
              onChange={(event) =>
                setState((prev) => (prev ? { ...prev, note: event.target.value.slice(0, 140) } : prev))
              }
              placeholder="Ex: tirar cebola, molho à parte..."
              className="h-24 w-full resize-none rounded-2xl p-4 text-sm outline-none"
              style={{ border: `1.5px solid ${VERDE}12`, color: VERDE }}
            />
          </div>
        </div>

        <div
          className="grid grid-cols-[128px_1fr] gap-3 px-5 py-4"
          style={{ background: "#fff", borderTop: `1px solid ${VERDE}12` }}
        >
          <div
            className="grid h-12 grid-cols-3 overflow-hidden rounded-2xl"
            style={{ border: `1.5px solid ${VERDE}12` }}
          >
            <button
              onClick={() => setState((prev) => (prev ? { ...prev, qty: Math.max(1, prev.qty - 1) } : prev))}
              className="flex items-center justify-center"
              style={{ color: VERDE }}
            >
              <Minus size={16} strokeWidth={2.6} />
            </button>
            <div className="flex items-center justify-center text-sm font-black">
              {state.qty}
            </div>
            <button
              onClick={() => setState((prev) => (prev ? { ...prev, qty: prev.qty + 1 } : prev))}
              className="flex items-center justify-center"
              style={{ color: VERDE }}
            >
              <Plus size={16} strokeWidth={2.6} />
            </button>
          </div>
          <button
            onClick={onConfirm}
            disabled={!valid}
            className="h-12 rounded-2xl text-xs font-black uppercase tracking-wider disabled:opacity-35"
            style={{ background: VERDE, color: ROSA }}
          >
            {valid ? `Adicionar ${fmt(total)}` : "Complete obrigatórios"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function OptionSection({
  title,
  subtitle,
  required,
  children,
}: {
  title: string;
  subtitle: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ background: "#F5F5F5" }}>
        <div>
          <p className="text-lg font-black text-black/62">{title}</p>
          <p className="text-sm text-black/50">{subtitle}</p>
        </div>
        {required && (
          <span className="rounded-lg bg-black px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            Obrigatório
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function MenuCard({
  item,
  qty,
  builder,
  onAdd,
  onMinus,
}: {
  item: MenuItem;
  qty: number;
  builder?: BuilderState;
  onAdd: () => void;
  onMinus: () => void;
}) {
  const displayPrice = builder ? buildBurger(builder).price : item.price;
  return (
    <motion.article
      layout
      whileHover={{ y: -2 }}
      className="overflow-hidden rounded-[24px]"
      style={{
        background: "#fff",
        border: `1px solid ${qty > 0 ? VERDE : `${VERDE}12`}`,
        boxShadow: qty > 0
          ? "0 18px 42px rgba(31,61,46,0.16)"
          : "0 10px 30px rgba(31,61,46,0.07)",
      }}
    >
      <div className="relative h-40 overflow-hidden" style={{ background: CREME }}>
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            style={{
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ChefHat size={56} strokeWidth={1.5} style={{ color: VERDE, opacity: 0.3 }} />
          </div>
        )}
        {item.highlight && (
          <span
            className="absolute left-3 top-3 flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider"
            style={{ background: VERDE, color: ROSA }}
          >
            <Sparkles size={12} strokeWidth={2.4} />
            Destaque
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-black/35">
              {item.eyebrow}
            </p>
            <h2
              className="mt-1 uppercase"
              style={{
                color: VERDE,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "1.75rem",
                lineHeight: 1,
                letterSpacing: 0,
              }}
            >
              {item.name}
            </h2>
          </div>
          <p
            className="shrink-0"
            style={{
              color: VERDE,
              fontFamily: "'Bebas Neue','Arial Black',sans-serif",
              fontSize: "1.45rem",
              lineHeight: 1,
            }}
          >
            {fmt(displayPrice)}
          </p>
        </div>

        <p className="mt-2 min-h-[54px] text-sm leading-relaxed text-black/58">
          {item.desc}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
              style={{ background: `${VERDE}08`, color: `${VERDE}B8` }}
            >
              {tag}
            </span>
          ))}
          {builder?.cheese && (
            <span className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider" style={{ background: `${ROSA}80`, color: VERDE }}>
              Extra queijo
            </span>
          )}
          {builder?.sauce && (
            <span className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider" style={{ background: `${ROSA}80`, color: VERDE }}>
              Molho extra
            </span>
          )}
        </div>

        <div className="mt-4">
          {qty > 0 ? (
            <div
              className="grid h-12 grid-cols-[56px_1fr_56px] overflow-hidden rounded-2xl"
              style={{
                border: `1.5px solid ${VERDE}`,
                background: "#fff",
              }}
            >
              <button
                onClick={onMinus}
                className="flex items-center justify-center"
                style={{ background: VERDE, color: ROSA }}
              >
                <Minus size={17} strokeWidth={2.7} />
              </button>
              <div
                className="flex items-center justify-center"
                style={{
                  color: VERDE,
                  fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                  fontSize: "1.45rem",
                  lineHeight: 1,
                }}
              >
                {qty}
              </div>
              <button
                onClick={onAdd}
                className="flex items-center justify-center"
                style={{ background: VERDE, color: ROSA }}
              >
                <Plus size={17} strokeWidth={2.7} />
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-wider"
              style={{ background: VERDE, color: ROSA }}
            >
              Adicionar
              <Plus size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
