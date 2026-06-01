import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import { CartItem, VERDE, ROSA, CREME } from "./types";
import logoSkull from "@/imports/image-1.png";
import burgerPhoto from "@/imports/image-9.png";

type Pickup = "balcao" | "delivery";

const ITEMS = [
  {
    id: "burger",
    name: "MENFI'S BURGER",
    desc: "Pão brioche · Carne smashburger 150g · Queijo suíço · Alface · Molho especial",
    price: 19.9,
    badge: "O ÚNICO",
  },
  {
    id: "combo",
    name: "COMBO MENFI'S",
    desc: "Menfi's Burger + Coca-Cola 350ml + Batata Rústica 250g",
    price: 34.9,
    badge: "MAIS PEDIDO",
  },
];

interface Props {
  addToCart: (item: Omit<CartItem, "qty">) => void;
  updateQty: (id: string, delta: number) => void;
  cart: CartItem[];
  goToCart: () => void;
}

const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

export function MenuScreen({ addToCart, updateQty, cart, goToCart }: Props) {
  const [pickup, setPickup] = useState<Pickup>("balcao");

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const qty = (id: string) => cart.find((c) => c.id === id)?.qty ?? 0;

  return (
    <div
      className="flex flex-col"
      style={{
        height: "100%",
        background: "#F5F0EA",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ══ HEADER ══════════════════════════════════════ */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: VERDE }}
      >
        <button style={{ color: ROSA, display: "flex", alignItems: "center" }}>
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>

        <p
          className="font-bold tracking-widest uppercase text-sm"
          style={{ color: ROSA, letterSpacing: "0.2em" }}
        >
          TOTEM DE VENDA
        </p>

        <img
          src={logoSkull.src}
          alt="Menfi's"
          style={{
            width: 38,
            height: 38,
            objectFit: "contain",
            mixBlendMode: "screen",
          }}
        />
      </div>

      {/* ══ SCROLLABLE BODY ═════════════════════════════ */}
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col px-4 pt-5 pb-4 gap-4">

          {/* Section label */}
          <p
            className="font-black uppercase tracking-widest text-xs"
            style={{ color: VERDE, letterSpacing: "0.16em" }}
          >
            Escolha seu pedido
          </p>

          {/* ── Product cards ── */}
          {ITEMS.map((item) => {
            const q = qty(item.id);
            const active = q > 0;

            return (
              <motion.div
                key={item.id}
                layout
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "white",
                  border: active
                    ? `2.5px solid ${VERDE}`
                    : "2px solid #E8E0D8",
                  boxShadow: active
                    ? `0 0 0 5px ${ROSA}55, 0 4px 20px rgba(31,61,46,0.12)`
                    : "0 2px 14px rgba(0,0,0,0.07)",
                }}
              >
                {/* ── Photo strip ── */}
                <div
                  className="relative overflow-hidden"
                  style={{ height: 148 }}
                >
                  <img
                    src={burgerPhoto.src}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: "center 38%" }}
                  />
                  {/* Bottom gradient */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(255,255,255,0.95), transparent)",
                    }}
                  />
                  {/* Badge */}
                  <span
                    className="absolute top-3 left-3 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider"
                    style={{ background: VERDE, color: ROSA }}
                  >
                    {item.badge}
                  </span>
                  {/* Price on photo */}
                  <p
                    className="absolute bottom-2 left-4 font-black"
                    style={{
                      color: VERDE,
                      fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
                      fontSize: "1.8rem",
                      lineHeight: 1,
                    }}
                  >
                    {fmt(item.price)}
                  </p>
                </div>

                {/* ── Card body ── */}
                <div className="px-4 py-3 flex items-center gap-4">
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-black text-sm uppercase tracking-wide"
                      style={{ color: VERDE }}
                    >
                      {item.name}
                    </p>
                    <p
                      className="text-xs mt-1 leading-relaxed"
                      style={{
                        color: "#999",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>

                  {/* Quantity controls — large touch targets */}
                  <div
                    className="flex items-center shrink-0 rounded-xl overflow-hidden"
                    style={{ border: `2px solid ${VERDE}18` }}
                  >
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => q > 0 && updateQty(item.id, -1)}
                      disabled={q === 0}
                      className="flex items-center justify-center"
                      style={{
                        width: 44,
                        height: 44,
                        background: q > 0 ? `${VERDE}12` : "#F7F7F7",
                        color: q > 0 ? VERDE : "#CCC",
                        border: "none",
                        cursor: q > 0 ? "pointer" : "default",
                      }}
                    >
                      <Minus size={16} strokeWidth={2.5} />
                    </motion.button>

                    <div
                      className="flex items-center justify-center font-black text-lg"
                      style={{
                        width: 40,
                        height: 44,
                        color: VERDE,
                        background: "white",
                        borderLeft: `1.5px solid ${VERDE}15`,
                        borderRight: `1.5px solid ${VERDE}15`,
                      }}
                    >
                      {q}
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() =>
                        addToCart({
                          id: item.id,
                          name: item.name,
                          price: item.price,
                        })
                      }
                      className="flex items-center justify-center"
                      style={{
                        width: 44,
                        height: 44,
                        background: VERDE,
                        color: ROSA,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* ── Pickup type ── */}
          <div>
            <p
              className="text-[10px] font-black uppercase tracking-widest mb-3"
              style={{ color: VERDE, opacity: 0.5 }}
            >
              Forma de retirada
            </p>
            <div className="flex gap-3">
              {(
                [
                  { id: "balcao",   icon: "🏪", line1: "Retirada",  line2: "no balcão" },
                  { id: "delivery", icon: "🛵", line1: "Delivery",  line2: "Motoboy"   },
                ] as { id: Pickup; icon: string; line1: string; line2: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPickup(opt.id)}
                  className="flex-1 flex flex-col items-center justify-center gap-1.5 rounded-2xl py-5 font-bold uppercase tracking-wide transition-all"
                  style={
                    pickup === opt.id
                      ? {
                          background: VERDE,
                          color: "white",
                          border: "2.5px solid transparent",
                          boxShadow: `0 4px 16px rgba(31,61,46,0.25)`,
                        }
                      : {
                          background: "white",
                          color: VERDE,
                          border: `2px solid ${VERDE}20`,
                        }
                  }
                >
                  <span style={{ fontSize: 28 }}>{opt.icon}</span>
                  <span style={{ fontSize: "0.68rem", lineHeight: 1.3, textAlign: "center" }}>
                    {opt.line1}
                    <br />
                    {opt.line2}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ STICKY BOTTOM BAR ═══════════════════════════ */}
      <div
        className="shrink-0 px-4 py-3 flex items-center gap-4"
        style={{
          background: VERDE,
          borderTop: `2px solid ${ROSA}22`,
        }}
      >
        {/* Total */}
        <div className="flex-1">
          <p
            className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: `${ROSA}65`, letterSpacing: "0.2em" }}
          >
            TOTAL DO PEDIDO
          </p>
          <p
            className="font-black"
            style={{
              color: cartCount > 0 ? ROSA : `${ROSA}45`,
              fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
              fontSize: "1.9rem",
              lineHeight: 1,
            }}
          >
            {cartCount > 0 ? fmt(cartTotal) : "—"}
          </p>
        </div>

        {/* AVANÇAR */}
        <motion.button
          whileTap={{ scale: 0.96, transition: { duration: 0.12 } }}
          onClick={cartCount > 0 ? goToCart : undefined}
          disabled={cartCount === 0}
          className="flex items-center gap-2 rounded-xl font-black uppercase tracking-widest disabled:opacity-25"
          style={{
            background: ROSA,
            color: VERDE,
            padding: "14px 28px",
            fontSize: "0.85rem",
            letterSpacing: "0.18em",
            boxShadow: cartCount > 0 ? "0 4px 16px rgba(255,214,227,0.4)" : "none",
            border: "none",
            cursor: cartCount > 0 ? "pointer" : "default",
          }}
        >
          AVANÇAR
          <span style={{ fontSize: "1.1rem" }}>→</span>
        </motion.button>
      </div>
    </div>
  );
}
