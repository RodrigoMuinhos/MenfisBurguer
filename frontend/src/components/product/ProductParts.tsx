import Image from "next/image";
import { motion } from "motion/react";
import {
  ChefHat,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { CartItem } from "@/types/order";
import { CREME, ROSA, VERDE } from "@/utils/theme";
import { MenuItem } from "@/features/catalog/types";
import {
  BuilderState,
  CHEESE_PRICE,
  COMBO_DRINK_SURCHARGE_PRODUCT_ID,
  COMBO_UPGRADE_PRICE,
  CustomizerState,
  DRINK_OPTIONS,
  EXTRA_OPTIONS,
  MEAT_POINT_OPTIONS,
  SAUCE_OPTIONS,
  SAUCE_PRICE,
  buildBurger,
  fmt,
  imageSrc,
  isChickenProduct,
  requiredCustomizerCount,
} from "./shared";

export function BurgerBuilder({
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

export { ProductCustomizer } from "./ProductCustomizer";

export function MenuCard({
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
  const discountPercent = item.originalPrice
    ? Math.round((1 - item.price / item.originalPrice) * 100)
    : 0;
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
          <div className="shrink-0 text-right">
            {item.originalPrice && !builder && (
              <div className="mb-1 flex items-center justify-end gap-1.5">
                <span className="text-[10px] font-bold text-black/35 line-through">
                  {fmt(item.originalPrice)}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-black"
                  style={{ background: "#DCFCE7", color: "#166534" }}
                >
                  -{discountPercent}%
                </span>
              </div>
            )}
            <p
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
        </div>

        <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-black/58">
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
