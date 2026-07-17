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
import { ROSA, VERDE } from "@/utils/theme";
import { MenuItem } from "@/features/catalog/types";
import {
  BuilderState,
  CHEESE_PRICE,
  COMBO_DRINK_SURCHARGE_PRODUCT_ID,
  CustomizerState,
  DRINK_OPTIONS,
  MEAT_POINT_OPTIONS,
  SAUCE_OPTIONS,
  SAUCE_PRICE,
  fmt,
  imageSrc,
  isChickenProduct,
  isSuperProduct,
  isSweetBoxProduct,
  requiredCustomizerCount,
  sweetCardPriceLabel,
} from "./shared";

export { ProductDetailModal } from "./ProductDetailModal";
import { visibleProductTags } from "./ProductDetailModal";

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
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: `${VERDE}59` }}>
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
                background: active ? VERDE : "#fff",
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

export function SuperLaunchCard({
  item,
  onAdd,
  onOpenDetails,
}: {
  item: MenuItem;
  onAdd: () => void;
  onOpenDetails: () => void;
}) {
  const tropical = item.id === "tropikal-menfis";
  const accent = tropical ? "#9CDD22" : "#FF315C";
  const glow = tropical ? "rgba(120,190,20,0.34)" : "rgba(255,35,70,0.34)";
  const panelTone = tropical ? "rgba(4, 47, 34, 0.46)" : "rgba(69, 8, 20, 0.46)";
  const features = tropical
    ? ["Pão brioche 65g", "Blend bovino 130g", "Abacaxi temperado e grelhado", "Queijo coalho grelhado 50g", "Alface e cebola roxa", "Cebolinha picada"]
    : ["Pão brioche 65g", "Blend bovino 130g", "Geleia de bacon", "Queijo cheddar", "Farofa crocante de Doritos", "Barbecue com alho frito", "Maionese Grill", "Pimenta graduável de 0 a 5"];
  return (
    <motion.article
      whileHover={{ scale: 1.025, y: -8 }}
      whileTap={{ scale: 1.012 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[36px] border border-white/15 text-white hover:z-20"
      style={{
        background: tropical
          ? "radial-gradient(circle at 30% 15%, rgba(28,91,57,.46) 0%, rgba(4,47,34,.46) 48%, rgba(2,29,22,.46) 100%)"
          : "radial-gradient(circle at 70% 15%, rgba(115,18,36,.46) 0%, rgba(69,8,20,.46) 52%, rgba(38,4,12,.46) 100%)",
        boxShadow: `0 24px 70px ${glow}`,
        borderColor: accent,
        backdropFilter: "blur(2px)",
      }}
    >
      <div className="px-5 pt-5 text-center">
        <span className="inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]" style={{ borderColor: accent, color: accent }}>
          {tropical ? "Tropical" : "Chilli"}
        </span>
        <h2 className="mt-3 uppercase" style={{ color: accent, fontFamily: "var(--menfis-font-display)", fontSize: "clamp(2.6rem,6vw,4.8rem)", lineHeight: 0.85 }}>
          {item.name}
        </h2>
      </div>
      <button
        type="button"
        onClick={onOpenDetails}
        className="relative mt-1 block h-52 w-full flex-none overflow-hidden rounded-b-[28px] sm:h-[32%] sm:min-h-0"
        style={{ background: panelTone, boxShadow: `inset 0 0 0 1px ${accent}22` }}
        aria-label={`Ver detalhes de ${item.name}`}
      >
        {item.image && (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover", objectPosition: "center center", filter: "saturate(1.04) contrast(1.04) brightness(.94)" }}
          />
        )}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-16" style={{ background: `linear-gradient(to bottom, ${panelTone} 0%, transparent 100%)` }} />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-28" style={{ background: `linear-gradient(to bottom, transparent 0%, ${panelTone} 100%)` }} />
        <span className="pointer-events-none absolute inset-y-0 left-0 w-8" style={{ background: `linear-gradient(to right, ${panelTone}99 0%, transparent 100%)` }} />
        <span className="pointer-events-none absolute inset-y-0 right-0 w-8" style={{ background: `linear-gradient(to left, ${panelTone}99 0%, transparent 100%)` }} />
      </button>
      <div className="relative -mt-5 flex flex-1 flex-col px-5 pb-5 pt-1" style={{ background: `linear-gradient(to bottom, transparent 0%, ${panelTone} 22px)` }}>
        <div className="flex flex-1 flex-col justify-center py-5">
          <p className="line-clamp-3 text-sm font-bold leading-relaxed text-white/80">{item.desc}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {features.map((tag, index) => (
              <motion.div
                key={tag}
                whileHover={{ scale: 1.02 }}
                className={`flex min-h-12 items-center gap-2.5 rounded-xl border bg-black/55 px-3 py-2 text-left text-[11px] font-black uppercase leading-tight text-white ${features.length % 2 !== 0 && index === features.length - 1 ? "col-span-2" : ""}`}
                style={{ borderColor: `${accent}55`, textShadow: "0 1px 3px #000" }}
              >
                <CheckCircle2 size={16} strokeWidth={2.8} className="shrink-0" style={{ color: accent }} />
                <span>{tag}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: `${accent}66`, background: `${accent}12` }}>
            <ChefHat size={21} strokeWidth={2.4} className="shrink-0" style={{ color: accent }} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: accent }}>Personalize do seu jeito</p>
              <p className="mt-0.5 text-xs font-bold text-white/70">{tropical ? "Escolha o ponto da carne e os adicionais." : "Escolha o ponto, a pimenta de 0 a 5 e os adicionais."}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center pt-4">
          <strong className="min-w-[70%] rounded-2xl border px-6 py-3 text-center" style={{ color: accent, background: `${accent}18`, borderColor: `${accent}88`, boxShadow: `0 0 36px ${glow}`, fontFamily: "var(--menfis-font-display)", fontSize: "clamp(3.7rem,6vw,5.4rem)", lineHeight: 0.82, textShadow: `0 0 22px ${glow}` }}>{fmt(item.price)}</strong>
        </div>
        <button type="button" onClick={onAdd} className="mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl text-sm font-black uppercase tracking-wider text-black" style={{ background: accent }}>
          Adicionar <Plus size={21} strokeWidth={2.8} />
        </button>
      </div>
    </motion.article>
  );
}

export function MenuCard({
  item,
  qty,
  builder,
  onAdd,
  onMinus,
  onOpenDetails,
}: {
  item: MenuItem;
  qty: number;
  builder?: BuilderState;
  onAdd: () => void;
  onMinus: () => void;
  onOpenDetails: () => void;
}) {
  const isSmoore = item.id === "smash-nutella-marshmallow";
  const displayPrice = builder
    ? item.price + (builder.cheese ? CHEESE_PRICE : 0) + (builder.sauce ? SAUCE_PRICE : 0)
    : item.price;
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
      <button
        type="button"
        onClick={onOpenDetails}
        className="relative block h-40 w-full overflow-hidden text-left"
        style={{ background: "#fff" }}
        aria-label={`Ver detalhes de ${item.name}`}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            style={{
              objectFit: "cover",
              objectPosition: isSmoore ? "center 48%" : "center",
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
      </button>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${VERDE}59` }}>
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
                <span className="text-[10px] font-bold line-through" style={{ color: `${VERDE}59` }}>
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
              {isSweetBoxProduct(item) ? sweetCardPriceLabel(item) : fmt(displayPrice)}
            </p>
          </div>
        </div>

        <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5" style={{ color: `${VERDE}94` }}>
          {item.desc}
        </p>

        {isSmoore && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {["Brioche amanteigado", "Nutella", "Marshmallow maçaricado", "Pedaços de chocolate"].map((feature) => (
              <div
                key={feature}
                className="flex min-h-10 items-center gap-2 rounded-xl px-2.5 py-2 text-[10px] font-black leading-tight"
                style={{ background: `${VERDE}08`, color: `${VERDE}CC`, border: `1px solid ${VERDE}10` }}
              >
                <CheckCircle2 size={14} strokeWidth={2.7} className="shrink-0" style={{ color: "#16A34A" }} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {visibleProductTags(item).map((tag) => (
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
