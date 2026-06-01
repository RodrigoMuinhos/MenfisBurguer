import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  MessageSquare,
  X,
  ShoppingBag,
  Plus,
  Utensils,
  Package,
  Flame,
  Coffee,
  Star,
} from "lucide-react";
import { CartItem, VERDE, ROSA } from "./types";
import burgerPhoto from "@/imports/image-9.png";
import colaPhoto from "@/imports/image-19.png";
import friesPhoto from "@/imports/image-20.png";
import logoSkull from "@/imports/image-1.png";

const BURGER_PRICE = 19.9;
const SUPER_COMBO_PRICE = 59.9;
const SUPER_COMBO_HERO_SRC = "/SC.png";
const COMBO_PRICE = 32.8;
const COMBO_EXTRA = COMBO_PRICE - BURGER_PRICE;

/* ─── Cartoon SVG illustrations ─────────────────────── */
const CartoonBurger = ({ color }: { color: string }) => (
  <svg width="48" height="38" viewBox="0 0 48 38" fill="none">
    <ellipse cx="24" cy="9" rx="18" ry="9" fill={color} opacity={0.95} />
    <ellipse
      cx="17"
      cy="5"
      rx="2.5"
      ry="1.5"
      fill={color}
      opacity={0.4}
      transform="rotate(-20 17 5)"
    />
    <ellipse cx="25" cy="3.5" rx="2" ry="1.5" fill={color} opacity={0.4} />
    <ellipse
      cx="32"
      cy="6"
      rx="2.5"
      ry="1.5"
      fill={color}
      opacity={0.4}
      transform="rotate(15 32 6)"
    />
    <rect
      x="6"
      y="16"
      width="36"
      height="6"
      rx="3"
      fill={color}
      opacity={0.8}
    />
    <path d="M4 21 L44 21 L41 26 L7 26 Z" fill={color} opacity={0.45} />
    <rect
      x="6"
      y="24"
      width="36"
      height="6"
      rx="3"
      fill={color}
      opacity={0.8}
    />
    <ellipse cx="24" cy="34" rx="20" ry="5.5" fill={color} />
  </svg>
);

const CartoonCheese = ({ color }: { color: string }) => (
  <svg width="46" height="40" viewBox="0 0 46 40" fill="none">
    <path d="M2 36 L23 5 L44 36 Z" fill={color} opacity={0.9} />
    <rect x="2" y="33" width="42" height="8" rx="4" fill={color} />
    <circle cx="16" cy="25" r="3.5" fill="white" opacity={0.3} />
    <circle cx="28" cy="29" r="2.5" fill="white" opacity={0.25} />
    <circle cx="23" cy="18" r="2" fill="white" opacity={0.2} />
  </svg>
);

const CartoonEgg = ({ color }: { color: string }) => (
  <svg width="46" height="40" viewBox="0 0 46 40" fill="none">
    <path
      d="M8 26 Q3 36 23 39 Q43 36 38 26 Q40 12 31 9 Q23 7 15 11 Q8 15 8 26 Z"
      fill={color}
      opacity={0.55}
    />
    <circle cx="23" cy="22" r="10" fill={color} opacity={0.95} />
    <circle cx="20" cy="19" r="3.5" fill="white" opacity={0.22} />
  </svg>
);

const CartoonCup = ({ color }: { color: string }) => (
  <svg width="40" height="46" viewBox="0 0 40 46" fill="none">
    <rect
      x="28"
      y="2"
      width="3.5"
      height="22"
      rx="1.75"
      fill={color}
      opacity={0.7}
    />
    <path d="M6 16 L10 42 L30 42 L34 16 Z" fill={color} opacity={0.85} />
    <rect x="4" y="11" width="32" height="7" rx="3.5" fill={color} />
    <circle cx="15" cy="27" r="2.5" fill="white" opacity={0.18} />
    <circle cx="22" cy="33" r="1.8" fill="white" opacity={0.14} />
  </svg>
);

const CartoonSauce = ({ color }: { color: string }) => (
  <svg width="34" height="48" viewBox="0 0 34 48" fill="none">
    <rect
      x="13"
      y="2"
      width="8"
      height="9"
      rx="3.5"
      fill={color}
      opacity={0.75}
    />
    <rect
      x="7"
      y="9"
      width="20"
      height="27"
      rx="9"
      fill={color}
      opacity={0.9}
    />
    <rect
      x="7"
      y="20"
      width="20"
      height="6"
      rx="0"
      fill="white"
      opacity={0.16}
    />
    <path
      d="M15 36 Q17 44 17 47 Q17 44 19 36"
      fill={color}
      opacity={0.9}
      strokeLinecap="round"
    />
  </svg>
);

const CartoonCrown = ({ color }: { color: string }) => (
  <svg width="50" height="42" viewBox="0 0 50 42" fill="none">
    <path
      d="M4 36 L4 20 L15 29 L25 8 L35 29 L46 20 L46 36 Z"
      fill={color}
      opacity={0.9}
    />
    <rect x="4" y="34" width="42" height="8" rx="4" fill={color} />
    <circle cx="25" cy="11" r="4.5" fill="white" opacity={0.3} />
    <circle cx="9" cy="23" r="3" fill="white" opacity={0.22} />
    <circle cx="41" cy="23" r="3" fill="white" opacity={0.22} />
    <circle cx="25" cy="38" r="2.5" fill="white" opacity={0.2} />
  </svg>
);

/* ─── Extras com ilustrações cartoon ────────────────── */
const EXTRAS = [
  {
    id: "extra-carne",
    label: "Double Burger",
    copy: "Adiciona 1 burger extra",
    price: 6.9,
    cardBg: ROSA,
    fg: VERDE,
    Cartoon: CartoonBurger,
  },
  {
    id: "extra-queijo",
    label: "Mais Queijo",
    copy: "Adiciona mais queijo",
    price: 2.0,
    cardBg: ROSA,
    fg: VERDE,
    Cartoon: CartoonCheese,
  },
  {
    id: "extra-ovo",
    label: "Com Ovo",
    copy: "Adiciona 1 ovo ao burger",
    price: 2.5,
    cardBg: ROSA,
    fg: VERDE,
    Cartoon: CartoonEgg,
  },
  {
    id: "extra-bebida",
    label: "Mais Refri",
    copy: "Adiciona 1 refrigerante",
    price: 6.9,
    cardBg: ROSA,
    fg: VERDE,
    Cartoon: CartoonCup,
  },
  {
    id: "extra-molho",
    label: "Molho Extra",
    copy: "Adiciona mais molho",
    price: 2.9,
    cardBg: ROSA,
    fg: VERDE,
    Cartoon: CartoonSauce,
  },
  {
    id: "combo2",
    label: "Super Combo",
    copy: "2 burgers + 2 refri + batata",
    price: 59.9,
    cardBg: ROSA,
    fg: VERDE,
    Cartoon: CartoonCrown,
    action: "combo2" as const,
  },
];

/* ─── Menu lateral ───────────────────────────────────── */
const SIDE_ITEMS = [
  {
    id: "burger",
    label: "Menfi's Burger",
    desc: "Pão brioche, burger 100g, queijo e molho",
    price: 19.9,
  },
  {
    id: "combo",
    label: "Combo Menfi's",
    desc: "Burger + Coca-Cola 350ml + Batata Frita 250g",
    price: 32.8,
  },
  {
    id: "combo2",
    label: "Super Combo",
    desc: "2 burgers + 2 Coca-Cola + batata frita",
    price: 59.9,
    badge: "NOVO",
  },
  {
    id: "batata",
    label: "Batata Frita",
    desc: "250g crocante e temperada",
    price: 8.9,
  },
  {
    id: "cola",
    label: "Coca-Cola 350ml",
    desc: "Gelada e pronta para acompanhar",
    price: 6.9,
  },
];

const SIDEBAR_TABS = [
  { id: "burger", label: "Burger", Icon: Utensils },
  { id: "combo", label: "Combo", Icon: Package },
  { id: "batata", label: "Batata", Icon: Flame },
  { id: "cola", label: "Cola", Icon: Coffee },
  { id: "extras", label: "Extras", Icon: Star },
] as const;

const TAGS = ["Blend da Casa", "Queijo Derretido", "Molho Menfi's Exclusivo"];
const SUPER_COMBO_TAGS = ["2 Burgers", "2 Refri", "Batata Frita"];

const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const SIDE_PANEL_WIDTH = "min(340px, 38vw)";

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
  goBack,
  onAdminOpen,
}: Props) {
  const [productMode, setProductMode] = useState<"burger" | "superCombo">(
    "burger",
  );
  const [withCombo, setWithCombo] = useState(false);
  const [selExtras, setSelExtras] = useState<Set<string>>(new Set());
  const [obsOpen, setObsOpen] = useState(false);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [upsellTitle, setUpsellTitle] = useState("");
  const [infoItem, setInfoItem] = useState<(typeof EXTRAS)[number] | null>(
    null,
  );

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const isSuperCombo = productMode === "superCombo";
  const visibleExtras = isSuperCombo
    ? EXTRAS.filter((ex) => !("action" in ex))
    : EXTRAS;
  const drawerExtras = EXTRAS.filter(
    (ex) => !("action" in ex) && ex.id !== "extra-bebida",
  );

  const toggleExtra = (id: string) =>
    setSelExtras((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const toggleRemove = (opt: string) =>
    setRemoved((prev) => {
      const s = new Set(prev);
      s.has(opt) ? s.delete(opt) : s.add(opt);
      return s;
    });

  const extrasTotal = EXTRAS.filter(
    (e) => selExtras.has(e.id) && !("action" in e),
  ).reduce((s, e) => s + e.price, 0);
  const total =
    (isSuperCombo
      ? SUPER_COMBO_PRICE
      : BURGER_PRICE + (withCombo ? COMBO_EXTRA : 0)) + extrasTotal;
  const itemId = isSuperCombo ? "combo2" : withCombo ? "combo" : "burger";
  const itemName = isSuperCombo
    ? "SUPER COMBO"
    : withCombo
      ? "COMBO MENFI'S"
      : "MENFI'S BURGER";

  const handleAdd = () => {
    addToCart({ id: itemId, name: itemName, price: total });
    EXTRAS.filter((e) => selExtras.has(e.id) && !("action" in e)).forEach((e) =>
      addToCart({ id: e.id, name: e.label, price: e.price }),
    );
    setSideOpen(true);
    setInfoItem(null);
    setAdded(true);
    setSelExtras(new Set());
    setWithCombo(false);
    setRemoved(new Set());
    setObsOpen(false);
    setTimeout(() => setAdded(false), 1800);
  };

  const addSideItem = (item: (typeof SIDE_ITEMS)[number]) => {
    addToCart({ id: item.id, name: item.label, price: item.price });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const addSideExtra = (ex: (typeof EXTRAS)[number]) => {
    addToCart({ id: ex.id, name: ex.label, price: ex.price });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const QtyControl = ({
    id,
    onAdd,
    size = 36,
  }: {
    id: string;
    onAdd: () => void;
    size?: number;
  }) => {
    const qty = cart.find((item) => item.id === id)?.qty ?? 0;
    if (qty === 0) {
      return (
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onAdd}
          style={{
            width: size,
            height: size,
            background: VERDE,
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Plus
            size={size >= 34 ? 18 : 13}
            strokeWidth={2.5}
            style={{ color: ROSA }}
          />
        </motion.button>
      );
    }

    return (
      <div
        style={{
          height: size,
          background: VERDE,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          padding: "0 4px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => updateQty(id, -1)}
          style={{
            width: size - 10,
            height: size - 10,
            background: "transparent",
            border: "none",
            color: ROSA,
            cursor: "pointer",
            fontSize: 17,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          -
        </button>
        <span
          style={{
            minWidth: 16,
            textAlign: "center",
            color: ROSA,
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          {qty}
        </span>
        <button
          onClick={onAdd}
          style={{
            width: size - 10,
            height: size - 10,
            background: "transparent",
            border: "none",
            color: ROSA,
            cursor: "pointer",
            fontSize: 17,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>
    );
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        fontFamily: "'Inter', system-ui, sans-serif",
        position: "relative",
        minHeight: "100%",
        overflowX: "hidden",
      }}
    >
      {/* ══ RETRACTABLE SIDEBAR STRIP ═══════════════════ */}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 35,
        }}
      >
        <AnimatePresence>
          {!sideOpen && !upsellOpen && (
            <motion.div
              initial={{ x: -64 }}
              animate={{ x: 0 }}
              exit={{ x: -64 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              style={{
                background: VERDE,
                borderRadius: "0 14px 14px 0",
                paddingTop: 10,
                paddingBottom: 10,
                display: "flex",
                flexDirection: "column",
                boxShadow: "4px 0 24px rgba(31,61,46,0.28)",
              }}
            >
              {SIDEBAR_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSideOpen(true)}
                  style={{
                    width: 56,
                    height: 54,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    padding: 0,
                  }}
                >
                  <tab.Icon size={19} strokeWidth={1.7} color={ROSA} />
                  <span
                    style={{
                      fontSize: 7,
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: ROSA,
                      opacity: 0.8,
                      lineHeight: 1,
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              ))}
              {cartCount > 0 && (
                <button
                  onClick={goToCart}
                  style={{
                    width: 56,
                    height: 54,
                    background: `${ROSA}18`,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    borderTop: `1px solid ${ROSA}25`,
                    marginTop: 4,
                    padding: 0,
                  }}
                >
                  <ShoppingBag size={19} strokeWidth={1.7} color={ROSA} />
                  <span
                    style={{
                      background: ROSA,
                      color: VERDE,
                      borderRadius: 999,
                      fontSize: 9,
                      fontWeight: 900,
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {cartCount}
                  </span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══ SIDE DRAWER ══════════════════════════════════ */}
      <AnimatePresence>
        {sideOpen && (
          <>
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: SIDE_PANEL_WIDTH,
                background: "#fff",
                zIndex: 22,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                boxShadow: "18px 0 40px rgba(31,61,46,0.14)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 20px 14px",
                  background: VERDE,
                }}
              >
                <p
                  style={{
                    color: ROSA,
                    fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                    fontSize: "1.2rem",
                    letterSpacing: "0.15em",
                    lineHeight: 1,
                  }}
                >
                  Adicionar Itens
                </p>
                <button
                  onClick={() => setSideOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    background: ROSA,
                    border: "none",
                    borderRadius: "50%",
                    color: VERDE,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  padding: "18px 14px 16px",
                  flex: 1,
                }}
              >
                {/* Lanches */}
                <div>
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: VERDE,
                      opacity: 0.4,
                      marginBottom: 10,
                    }}
                  >
                    Lanches e Combos
                  </p>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {SIDE_ITEMS.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 14px",
                          borderRadius: 16,
                          border: `1.5px solid ${ROSA}`,
                          background: "#fff",
                          position: "relative",
                        }}
                      >
                        {"badge" in item && item.badge && (
                          <span
                            style={{
                              position: "absolute",
                              top: -9,
                              left: 12,
                              background: VERDE,
                              color: ROSA,
                              fontSize: 7,
                              fontWeight: 900,
                              padding: "2px 8px",
                              borderRadius: 999,
                              letterSpacing: "0.08em",
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 11,
                              fontWeight: 900,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              color: VERDE,
                              lineHeight: 1,
                            }}
                          >
                            {item.label}
                          </p>
                          <p
                            style={{
                              fontSize: 9,
                              marginTop: 3,
                              color: VERDE,
                              opacity: 0.4,
                              lineHeight: 1.3,
                            }}
                          >
                            {item.desc}
                          </p>
                          <p
                            style={{
                              color: VERDE,
                              fontFamily:
                                "'Bebas Neue','Arial Black',sans-serif",
                              fontSize: "0.95rem",
                              marginTop: 4,
                            }}
                          >
                            {fmt(item.price)}
                          </p>
                        </div>
                        <QtyControl
                          id={item.id}
                          onAdd={() => addSideItem(item)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extras no drawer */}
                <div>
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: VERDE,
                      opacity: 0.4,
                      marginBottom: 10,
                    }}
                  >
                    Extras avulsos
                  </p>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {drawerExtras.map((ex) => (
                      <div
                        key={ex.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 14px",
                          borderRadius: 12,
                          border: `1.5px solid ${ROSA}50`,
                          background: "#fff",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: ROSA,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            overflow: "hidden",
                          }}
                        >
                          <ex.Cartoon color={VERDE} />
                        </div>
                        <p
                          style={{
                            flex: 1,
                            fontSize: 11,
                            fontWeight: 700,
                            color: VERDE,
                          }}
                        >
                          {ex.label}
                        </p>
                        <p
                          style={{
                            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                            fontSize: "0.9rem",
                            color: VERDE,
                            marginRight: 6,
                          }}
                        >
                          {fmt(ex.price)}
                        </p>
                        <QtyControl
                          id={ex.id}
                          onAdd={() => addSideExtra(ex)}
                          size={30}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => setObsOpen((v) => !v)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "11px 12px",
                      borderRadius: 12,
                      background: obsOpen ? `${VERDE}10` : "#fff",
                      border: `1.5px solid ${ROSA}`,
                      cursor: "pointer",
                    }}
                  >
                    <MessageSquare
                      size={13}
                      strokeWidth={2.2}
                      style={{ color: VERDE }}
                    />
                    <span
                      style={{
                        flex: 1,
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: VERDE,
                      }}
                    >
                      Observações
                    </span>
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 900,
                        color: VERDE,
                        opacity: 0.45,
                      }}
                    >
                      {removed.size > 0
                        ? `${removed.size} remov.`
                        : "remover itens"}
                    </span>
                  </button>
                  <AnimatePresence>
                    {obsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ paddingTop: 8 }}>
                          {[
                            "Alface Crocante",
                            "Queijo",
                            "Carne",
                            "Cebola Caramelizada",
                            "Molho",
                          ].map((opt) => {
                            const active = removed.has(opt);
                            return (
                              <button
                                key={opt}
                                onClick={() => toggleRemove(opt)}
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 10px",
                                  background: active ? `${ROSA}55` : "#fff",
                                  border: "none",
                                  borderBottom: `1px solid ${VERDE}08`,
                                  cursor: "pointer",
                                }}
                              >
                                <span
                                  style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: 5,
                                    border: `1.5px solid ${active ? VERDE : `${VERDE}35`}`,
                                    background: active ? VERDE : "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  {active && (
                                    <Check
                                      size={10}
                                      strokeWidth={3}
                                      style={{ color: ROSA }}
                                    />
                                  )}
                                </span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    color: VERDE,
                                    opacity: active ? 1 : 0.65,
                                  }}
                                >
                                  Sem {opt}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div
                  style={{
                    flex: 1,
                    minHeight: 220,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: VERDE,
                      opacity: 0.42,
                      marginBottom: 8,
                    }}
                  >
                    Pedido atual
                  </p>
                  {cartCount > 0 ? (
                    <div
                      style={{
                        flex: 1,
                        minHeight: 180,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                        paddingRight: 4,
                      }}
                    >
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            background: `${VERDE}06`,
                            border: `1px solid ${VERDE}10`,
                            borderRadius: 10,
                            padding: "8px 9px",
                          }}
                        >
                          <span
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 999,
                              background: ROSA,
                              color: VERDE,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                              fontWeight: 900,
                              flexShrink: 0,
                            }}
                          >
                            {item.qty}
                          </span>
                          <span
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: 10,
                              fontWeight: 800,
                              color: VERDE,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.name}
                          </span>
                          <span
                            style={{
                              fontFamily:
                                "'Bebas Neue','Arial Black',sans-serif",
                              fontSize: "0.82rem",
                              color: VERDE,
                            }}
                          >
                            {fmt(item.price * item.qty)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        flex: 1,
                        minHeight: 180,
                        border: `1.5px dashed ${VERDE}18`,
                        borderRadius: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: VERDE,
                          opacity: 0.35,
                          textAlign: "center",
                        }}
                      >
                        Seu pedido aparece aqui conforme você adiciona itens.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  position: "sticky",
                  bottom: 0,
                  padding: "12px 14px 14px",
                  background: "#fff",
                  borderTop: `1.5px solid ${ROSA}`,
                }}
              >
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (cartCount > 0) {
                      setSideOpen(false);
                      goToCart();
                    }
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 20px",
                    borderRadius: 16,
                    background: cartCount > 0 ? VERDE : `${VERDE}35`,
                    color: ROSA,
                    border: "none",
                    cursor: cartCount > 0 ? "pointer" : "default",
                    fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                    fontSize: "1rem",
                    letterSpacing: "0.15em",
                  }}
                >
                  <span>Finalizar pedido</span>
                  <span
                    style={{
                      background: ROSA,
                      color: VERDE,
                      borderRadius: 999,
                      minWidth: 28,
                      height: 24,
                      padding: "0 8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    {cartCount > 0 ? fmt(cartSubtotal) : "0"}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ UPSELL MODAL ════════════════════════════════ */}
      <AnimatePresence>
        {upsellOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setUpsellOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "#000",
                zIndex: 60,
              }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 61,
                background: "#fff",
                borderRadius: "24px 24px 0 0",
                paddingBottom: 32,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  background: `${VERDE}18`,
                  borderRadius: 99,
                  margin: "12px auto 0",
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: "16px 18px 12px",
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                      fontSize: "1.4rem",
                      color: VERDE,
                      lineHeight: 1,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {upsellTitle}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: VERDE,
                      opacity: 0.4,
                      marginTop: 3,
                    }}
                  >
                    Adicione ao seu pedido com um toque
                  </p>
                </div>
                <button
                  onClick={() => setUpsellOpen(false)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: `${VERDE}10`,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={14} strokeWidth={2.5} style={{ color: VERDE }} />
                </button>
              </div>

              {/* 3×2 cartoon grid */}
              <div
                style={{
                  padding: "0 14px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                }}
              >
                {EXTRAS.filter((ex) => !("action" in ex)).map((ex) => (
                  <motion.button
                    key={ex.id}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => {
                      addToCart({ id: ex.id, name: ex.label, price: ex.price });
                      setUpsellOpen(false);
                    }}
                    style={{
                      background: "#fff",
                      border: `1.5px solid ${VERDE}18`,
                      borderRadius: 16,
                      overflow: "hidden",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        height: 80,
                        background: ROSA,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ex.Cartoon color={VERDE} />
                    </div>
                    <div style={{ padding: "8px 8px 10px", textAlign: "left" }}>
                      <p
                        style={{
                          fontSize: 9,
                          fontWeight: 900,
                          color: VERDE,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          lineHeight: 1.2,
                        }}
                      >
                        {ex.label}
                      </p>
                      <p
                        style={{
                          fontSize: 7.5,
                          color: VERDE,
                          opacity: 0.4,
                          lineHeight: 1.3,
                          marginTop: 2,
                        }}
                      >
                        {ex.copy}
                      </p>
                      <p
                        style={{
                          fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                          fontSize: "0.85rem",
                          color: VERDE,
                          marginTop: 5,
                          lineHeight: 1,
                        }}
                      >
                        + {fmt(ex.price)}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setUpsellOpen(false)}
                style={{
                  display: "block",
                  margin: "16px auto 0",
                  background: "none",
                  border: `1.5px solid ${VERDE}18`,
                  borderRadius: 12,
                  padding: "10px 32px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  color: VERDE,
                  opacity: 0.45,
                }}
              >
                Não, já está ótimo!
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          marginLeft: sideOpen ? SIDE_PANEL_WIDTH : 0,
          width: sideOpen ? `calc(100% - ${SIDE_PANEL_WIDTH})` : "100%",
        }}
        transition={{ type: "spring", damping: 30, stiffness: 260 }}
        style={{
          minHeight: "100%",
          position: "relative",
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        {/* ══ HERO ════════════════════════════════════════ */}
        <motion.div
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{
            height: "min(62vh, 620px)",
            minHeight: 430,
            overflow: "hidden",
            background: "#f7f4ef",
          }}
        >
          <motion.img
            src={isSuperCombo ? SUPER_COMBO_HERO_SRC : burgerPhoto.src}
            alt={isSuperCombo ? "Super Combo Menfi's" : "Menfi's Burger"}
            className="w-full h-full object-cover"
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{
              objectPosition: isSuperCombo ? "center 74%" : "center 66%",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: "44%",
              background:
                "linear-gradient(to top, #fff 0%, rgba(255,255,255,0.88) 26%, rgba(255,255,255,0.16) 68%, transparent 100%)",
            }}
          />
          <motion.button
            onClick={() => setSideOpen(true)}
            whileTap={{ scale: 0.92 }}
            className="absolute top-4 left-4 flex items-center justify-center rounded-full"
            style={{
              width: 44,
              height: 44,
              background: ROSA,
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.65)",
              color: VERDE,
              cursor: "pointer",
              boxShadow: "0 10px 28px rgba(31,61,46,0.16)",
            }}
          >
            <Plus size={22} strokeWidth={2.7} />
          </motion.button>
          <motion.button
            onClick={onAdminOpen}
            whileTap={{ scale: 0.92 }}
            className="absolute top-3 right-3"
            style={{
              width: 52,
              height: 52,
              background: "rgba(255,255,255,0.22)",
              border: "none",
              cursor: "pointer",
              padding: 0,
              borderRadius: "50%",
              backdropFilter: "blur(4px)",
            }}
          >
            <img
              src={logoSkull.src}
              alt="Admin"
              style={{
                width: 52,
                height: 52,
                objectFit: "contain",
                mixBlendMode: "multiply",
              }}
            />
          </motion.button>
          <span
            className="absolute top-4 left-1/2 -translate-x-1/2 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider"
            style={{
              background: VERDE,
              color: ROSA,
              whiteSpace: "nowrap",
              boxShadow: "0 10px 24px rgba(31,61,46,0.16)",
            }}
          >
            O ÚNICO
          </span>
        </motion.div>

        {/* ══ BODY ════════════════════════════════════════ */}
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08, delayChildren: 0.08 }}
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "18px 20px 172px 82px",
            gap: 25,
            background: "#fff",
            maxWidth: 1180,
            margin: "0 auto",
            width: "100%",
          }}
        >
          <motion.div
            variants={sectionVariants}
            transition={{ duration: 0.28, ease: "easeOut" }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.09em",
                color: VERDE,
                opacity: 0.35,
              }}
            >
              Passe para o lado e escolha
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                background: `${VERDE}08`,
                borderRadius: 999,
                padding: 4,
              }}
            >
              <button
                onClick={() => setProductMode("burger")}
                style={{
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  background: !isSuperCombo ? VERDE : "transparent",
                  color: !isSuperCombo ? ROSA : VERDE,
                }}
              >
                Burger
              </button>
              <button
                onClick={() => {
                  setProductMode("superCombo");
                  setWithCombo(false);
                  setInfoItem(null);
                }}
                style={{
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  background: isSuperCombo ? VERDE : "transparent",
                  color: isSuperCombo ? ROSA : VERDE,
                }}
              >
                Super Combo
              </button>
            </div>
          </motion.div>

          {/* Nome + preço */}
          <motion.div
            variants={sectionVariants}
            transition={{ duration: 0.36, ease: "easeOut" }}
          >
            <h1
              style={{
                color: VERDE,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "clamp(2.55rem, 9vw, 3.25rem)",
                lineHeight: 0.95,
                margin: 0,
                letterSpacing: "0.015em",
              }}
            >
              {isSuperCombo ? "SUPER COMBO" : "MENFI'S BURGER"}
            </h1>
            <p
              style={{
                color: VERDE,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "1.5rem",
                lineHeight: 1,
                marginTop: 4,
                opacity: 0.55,
              }}
            >
              {fmt(isSuperCombo ? SUPER_COMBO_PRICE : BURGER_PRICE)}
            </p>
          </motion.div>

          {/* Descrição */}
          <motion.div
            variants={sectionVariants}
            transition={{ duration: 0.36, ease: "easeOut" }}
          >
            <p
              style={{
                fontSize: 9,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: VERDE,
                opacity: 0.4,
                marginBottom: 6,
              }}
            >
              Descrição
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: "#2f3d38" }}>
              {isSuperCombo
                ? "Combo completo para dividir (ou encarar sozinho): 2 burgers, 2 refris e batata frita. Mais volume, mais sabor e melhor custo-benefício."
                : "Pão brioche na manteiga, burger de 100g do blend da casa, queijo derretido, alface crocante, cebola caramelizada e o irresistível Molho Menfi's. Suculento, cheio de sabor e feito para matar aquela vontade de comer algo realmente bom."}
            </p>
            <p
              style={{
                fontSize: 12,
                lineHeight: 1.65,
                color: "#2f3d38",
                marginTop: 8,
              }}
            >
              {isSuperCombo
                ? "Perfeito para quem quer sair no lucro: acompanha bebida e batata em uma escolha só, sem complicação."
                : "Aquele tipo que faz o molho escorrer, o queijo puxar e você já pensar na próxima mordida antes de terminar a primeira."}
            </p>
            <p
              style={{
                fontSize: 11,
                marginTop: 8,
                fontStyle: "italic",
                color: VERDE,
                opacity: 0.4,
              }}
            >
              {isSuperCombo
                ? "Mais pedido para dividir com estilo."
                : 'Simplesmente impossível comer sem soltar um "hmm..."'}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 12,
              }}
            >
              {(isSuperCombo ? SUPER_COMBO_TAGS : TAGS).map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 9,
                    fontWeight: 900,
                    padding: "5px 11px",
                    borderRadius: 999,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    background: `${ROSA}76`,
                    color: VERDE,
                    boxShadow: "inset 0 0 0 1px rgba(31,61,46,0.03)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Combo toggle */}
          {!isSuperCombo && (
            <motion.div
              variants={sectionVariants}
              transition={{ duration: 0.36, ease: "easeOut" }}
            >
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: VERDE,
                  opacity: 0.4,
                  marginBottom: 10,
                }}
              >
                Quero acrescentar
              </p>
              <motion.button
                onClick={() => setWithCombo((v) => !v)}
                whileTap={{ scale: 0.985 }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  borderRadius: 20,
                  padding: 15,
                  background: withCombo ? VERDE : "white",
                  border: withCombo
                    ? `2.5px solid ${VERDE}`
                    : `1.5px solid ${VERDE}16`,
                  boxShadow: withCombo
                    ? `0 0 0 5px ${ROSA}55, 0 16px 34px rgba(31,61,46,0.16)`
                    : "0 12px 30px rgba(31,61,46,0.09)",
                  cursor: "pointer",
                  transition:
                    "background 0.2s, box-shadow 0.2s, border-color 0.2s",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: withCombo ? ROSA : `${VERDE}10`,
                    border: withCombo ? "none" : `2px solid ${VERDE}25`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <AnimatePresence>
                    {withCombo && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check
                          size={14}
                          strokeWidth={3}
                          style={{ color: VERDE }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: withCombo ? ROSA : VERDE,
                    }}
                  >
                    Combo Menfi's
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      marginTop: 2,
                      color: withCombo ? `${ROSA}80` : "#999",
                    }}
                  >
                    Coca-Cola 350ml + Batata Frita 250g
                  </p>
                </div>
                <div
                  style={{
                    borderRadius: 10,
                    padding: "6px 12px",
                    background: withCombo ? `${ROSA}20` : `${VERDE}08`,
                    flexShrink: 0,
                  }}
                >
                  <p
                    style={{
                      color: withCombo ? ROSA : VERDE,
                      fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                      fontSize: "1rem",
                      lineHeight: 1,
                    }}
                  >
                    + {fmt(COMBO_EXTRA)}
                  </p>
                </div>
              </motion.button>

              <AnimatePresence>
                {withCombo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 140, marginTop: 10 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.28 }}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        borderRadius: 16,
                        overflow: "hidden",
                        padding: "10px 10px",
                        background: "#FFF5F5",
                        border: `1.5px solid ${ROSA}40`,
                      }}
                    >
                      <img
                        src={colaPhoto.src}
                        alt="Coca-Cola"
                        style={{
                          height: 80,
                          width: "auto",
                          objectFit: "contain",
                        }}
                      />
                      <p
                        style={{
                          fontSize: 9,
                          fontWeight: 900,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: VERDE,
                          opacity: 0.6,
                        }}
                      >
                        Coca-Cola 350ml
                      </p>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        borderRadius: 16,
                        overflow: "hidden",
                        padding: "10px 10px",
                        background: "#FFFBF0",
                        border: `1.5px solid ${VERDE}10`,
                      }}
                    >
                      <img
                        src={friesPhoto.src}
                        alt="Batata Frita"
                        style={{
                          height: 80,
                          width: "auto",
                          objectFit: "contain",
                        }}
                      />
                      <p
                        style={{
                          fontSize: 9,
                          fontWeight: 900,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: VERDE,
                          opacity: 0.6,
                        }}
                      >
                        Batata Frita 250g
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ══ EXTRAS — cartoon avatar grid ══════════════ */}
          <motion.div
            variants={sectionVariants}
            transition={{ duration: 0.36, ease: "easeOut" }}
          >
            <p
              style={{
                fontSize: 9,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: VERDE,
                opacity: 0.4,
                marginBottom: 2,
              }}
            >
              Extras
            </p>
            <p
              style={{
                fontSize: 11,
                color: VERDE,
                opacity: 0.45,
                marginBottom: 14,
              }}
            >
              Toque no item para ver exatamente o que ele adiciona
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
                gap: 14,
              }}
            >
              {visibleExtras.map((ex) => {
                const isAction = "action" in ex;
                const on = !isAction && selExtras.has(ex.id);
                return (
                  <motion.button
                    key={ex.id}
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ y: -2 }}
                    onClick={() => {
                      if (isAction) {
                        setProductMode("superCombo");
                        setWithCombo(false);
                        setInfoItem(null);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      } else {
                        toggleExtra(ex.id);
                      }
                    }}
                    style={{
                      background: "#fff",
                      border: `2px solid ${on ? VERDE : VERDE + "16"}`,
                      borderRadius: 18,
                      overflow: "hidden",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: on
                        ? `0 0 0 4px ${VERDE}18, 0 14px 28px rgba(31,61,46,0.14)`
                        : "0 10px 22px rgba(31,61,46,0.09)",
                      transition:
                        "box-shadow 0.2s, border-color 0.2s, transform 0.2s",
                    }}
                  >
                    {/* Visual area */}
                    <div
                      style={{
                        height: 76,
                        background: ex.cardBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                      onClick={(e) => {
                        if (isAction) return;
                        e.stopPropagation();
                        setInfoItem(ex);
                      }}
                    >
                      <ex.Cartoon color={ex.fg} />
                      <AnimatePresence>
                        {on && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            style={{
                              position: "absolute",
                              top: 7,
                              right: 7,
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                            }}
                          >
                            <Check
                              size={11}
                              strokeWidth={3.5}
                              style={{ color: VERDE }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {isAction && (
                        <div
                          style={{
                            position: "absolute",
                            top: 6,
                            left: 6,
                            background: VERDE,
                            borderRadius: 999,
                            padding: "2px 6px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 6.5,
                              fontWeight: 900,
                              color: ROSA,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                            }}
                          >
                            NOVO
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ padding: "8px 9px 11px", textAlign: "left" }}>
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 900,
                          color: VERDE,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          lineHeight: 1.2,
                        }}
                      >
                        {ex.label}
                      </p>
                      <p
                        style={{
                          fontSize: 8.5,
                          color: VERDE,
                          opacity: 0.55,
                          lineHeight: 1.35,
                          marginTop: 3,
                        }}
                      >
                        {ex.copy}
                      </p>
                      <p
                        style={{
                          fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                          fontSize: "0.85rem",
                          color: on ? VERDE : `${VERDE}70`,
                          marginTop: 5,
                          lineHeight: 1,
                        }}
                      >
                        + {fmt(ex.price)}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <AnimatePresence>
            {infoItem && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                style={{
                  position: "fixed",
                  left: 16,
                  right: 16,
                  bottom: 92,
                  zIndex: 80,
                  background: "#fff",
                  border: `2px solid ${VERDE}`,
                  borderRadius: 18,
                  padding: "14px 16px",
                  boxShadow: "0 16px 36px rgba(31,61,46,0.18)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: VERDE,
                        opacity: 0.4,
                      }}
                    >
                      O que é isso?
                    </p>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        color: VERDE,
                        lineHeight: 1.1,
                      }}
                    >
                      {infoItem.label}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: VERDE,
                        opacity: 0.72,
                        marginTop: 4,
                        lineHeight: 1.35,
                      }}
                    >
                      {infoItem.copy}
                    </p>
                  </div>
                  <button
                    onClick={() => setInfoItem(null)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      border: "none",
                      background: ROSA,
                      color: VERDE,
                      fontWeight: 900,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Observação */}
          <motion.div
            variants={sectionVariants}
            transition={{ duration: 0.36, ease: "easeOut" }}
          >
            <button
              onClick={() => setObsOpen((v) => !v)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 15px",
                borderRadius: 18,
                background: obsOpen ? ROSA : "#fff",
                border: `1.5px solid ${ROSA}`,
                cursor: "pointer",
                transition: "background 0.2s, box-shadow 0.2s",
                boxShadow: "0 8px 20px rgba(31,61,46,0.04)",
              }}
            >
              <MessageSquare
                size={14}
                strokeWidth={2}
                style={{ color: VERDE, opacity: 0.65 }}
              />
              <span
                style={{
                  flex: 1,
                  textAlign: "left",
                  fontSize: 11,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: VERDE,
                  opacity: 0.7,
                }}
              >
                {obsOpen ? "Fechar observação" : "Adicionar observação"}
              </span>
              {removed.size > 0 && !obsOpen && (
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 900,
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: ROSA,
                    color: VERDE,
                  }}
                >
                  {removed.size} remoção{removed.size > 1 ? "ões" : ""}
                </span>
              )}
            </button>
            <AnimatePresence>
              {obsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    style={{ paddingTop: 10, paddingLeft: 4, paddingRight: 4 }}
                  >
                    <p
                      style={{
                        fontSize: 8,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: VERDE,
                        opacity: 0.35,
                        marginBottom: 8,
                      }}
                    >
                      Quero remover:
                    </p>
                    <div
                      style={{
                        border: `1.5px solid ${ROSA}`,
                        borderRadius: 12,
                        overflow: "hidden",
                      }}
                    >
                      {[
                        "Alface Crocante",
                        "Queijo",
                        "Carne",
                        "Cebola Caramelizada",
                        "Molho",
                      ].map((opt, i) => {
                        const active = removed.has(opt);
                        return (
                          <motion.button
                            key={opt}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => toggleRemove(opt)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "11px 14px",
                              width: "100%",
                              textAlign: "left",
                              background: active ? `${ROSA}40` : "#fff",
                              border: "none",
                              cursor: "pointer",
                              borderTop: i > 0 ? `1px solid ${ROSA}` : "none",
                              transition: "background 0.15s",
                            }}
                          >
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 6,
                                background: active ? ROSA : "#fff",
                                border: `1.5px solid ${ROSA}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s",
                                flexShrink: 0,
                              }}
                            >
                              {active && (
                                <X
                                  size={10}
                                  strokeWidth={3}
                                  style={{ color: VERDE }}
                                />
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: VERDE,
                                opacity: active ? 1 : 0.6,
                                textDecoration: active
                                  ? "line-through"
                                  : "none",
                              }}
                            >
                              Sem {opt}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* ══ CTA sticky ══════════════════════════════════ */}
        <div
          style={{
            position: "fixed",
            left: sideOpen ? SIDE_PANEL_WIDTH : 0,
            right: 0,
            bottom: 0,
            zIndex: 30,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(14px)",
            borderTop: `1.5px solid ${VERDE}10`,
            boxShadow: "0 -12px 34px rgba(31,61,46,0.09)",
            padding: "12px 20px 14px",
            transition: "left 0.32s cubic-bezier(.22,1,.36,1)",
          }}
        >
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSideOpen(true)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 16,
                  padding: "12px 18px",
                  marginBottom: 8,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  background: "#fff",
                  color: VERDE,
                  border: `2px solid ${VERDE}`,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShoppingBag size={16} strokeWidth={2} />
                  <span>Ver Pedido</span>
                </div>
                <span
                  style={{
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 900,
                    background: ROSA,
                    color: VERDE,
                  }}
                >
                  {cartCount}
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAdd}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 18,
              padding: "17px 22px",
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              background: added ? ROSA : VERDE,
              color: added ? VERDE : ROSA,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 10px 28px rgba(31,61,46,0.32)",
              transition: "background 0.3s, box-shadow 0.2s",
            }}
          >
            <span>{added ? "Adicionado ✓" : "ADICIONAR"}</span>
            {!added && (
              <motion.span
                key={total}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                  fontSize: "1.3rem",
                  lineHeight: 1,
                  color: ROSA,
                }}
              >
                {fmt(total)}
              </motion.span>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
