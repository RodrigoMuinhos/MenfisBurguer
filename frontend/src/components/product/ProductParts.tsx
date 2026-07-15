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

function comboPotatoLabel(item: MenuItem) {
  return requiredCustomizerCount(item) > 1 ? "batata 200g" : "batata 100g";
}

function productStory(item: MenuItem) {
  if (isSuperProduct(item)) return item.desc;
  const name = item.name.toLowerCase();
  const isBig = item.id.includes("double");
  const isMenfis130 =
    item.id === "burger" ||
    item.id === "combo" ||
    item.id === "combo2";
  const isBacon130 =
    item.id === "menfis-bacon" ||
    item.id === "bacon-combo" ||
    item.id === "bacon-super-combo";
  if (name.includes("chicken")) {
    return `${item.desc} Frango crocante, queijo derretido, alface fresca e molho especial no pão macio, com molho extra para acompanhar cada mordida.`;
  }
  if (name.includes("bacon")) {
    const quantity = isBig || item.id.includes("super") ? "cada carne" : "o burger";
    const grams = isBacon130 ? "130g" : "100g";
    return `${item.desc} Aqui ${quantity} vem com ${grams} de carne suculenta, 40g de bacon crocante, duas fatias de queijo cheddar, cebola caramelizada no ponto, alface crocante e molho especial da casa. Vai com molho extra para acompanhar: uma explosão de sabor do começo ao fim.`;
  }
  if (item.category === "burger" || item.category === "combo") {
    const quantity = isBig || item.id.includes("super") ? "cada carne" : "o burger";
    const grams = isMenfis130 ? "130g" : "100g";
    return `${item.desc} Aqui ${quantity} vem com ${grams} de carne suculenta, duas fatias de queijo cheddar, cebola caramelizada no ponto, alface crocante e molho especial da casa. Vai com molho extra para acompanhar: uma explosão de sabor do começo ao fim.`;
  }
  return item.desc;
}

function productIngredients(item: MenuItem) {
  if (isSuperProduct(item)) return item.desc;
  const name = item.name.toLowerCase();
  const isBig = item.id.includes("double");
  if (name.includes("chicken")) {
    return isBig
      ? "Pão brioche, 2 filés de frango de 120g, queijo cheddar, alface, tomate e molho especial."
      : "Pão brioche, chicken 120g, queijo cheddar, alface, tomate e molho especial.";
  }
  if (name.includes("bacon")) {
    if (item.id === "bacon-super-combo") {
      return "Pão brioche, 2 burgers com carne bovina de 130g, 40g de bacon cada, cheddar, cebola caramelizada, alface e molho Menfi's.";
    }
    if (item.id === "menfis-bacon" || item.id === "bacon-combo") {
      return "Pão brioche, carne 130g, 40g de bacon, cheddar, cebola caramelizada, alface e molho Menfi's.";
    }
    return isBig
      ? "Pão brioche, 2 carnes bovinas de 100g, 40g de bacon, cheddar, cebola caramelizada, alface e molho Menfi's."
      : "Pão brioche, carne 100g, 40g de bacon, cheddar, cebola caramelizada, alface e molho Menfi's.";
  }
  if (item.category === "combo") {
    const burger = item.id === "combo2"
      ? "2 Menfi's Burger com carnes bovinas de 130g"
      : item.id === "triple-combo"
        ? "Combo Triple com 3 carnes bovinas de 100g"
      : isBig
        ? "BIG Menfi's com 2 carnes bovinas de 100g"
        : item.id === "combo"
          ? "Burger Menfi's 130g"
          : "Burger Menfi's";
    return `${burger}, ${comboPotatoLabel(item)}, bebida gelada e molho extra para acompanhar.`;
  }
  if (item.category === "bebida") {
    return "Bebida gelada selecionada.";
  }
  if (item.category === "sweet") {
    if (!isSweetBoxProduct(item)) return item.desc;
    return item.id.includes("plus")
      ? "Caixinha com 4 doces premium escolhidos pelo cliente. Cada unidade premium soma acréscimo."
      : "Caixinha com 4 doces clássicos escolhidos pelo cliente, sem adicional.";
  }
  if (item.category === "extra" || item.category === "fries") {
    return item.desc;
  }
  return item.id === "burger"
    ? "Pão brioche, carne 130g, cheddar, cebola caramelizada, alface e molho Menfi's."
    : "Pão brioche, carne 100g, cheddar, cebola caramelizada, alface e molho Menfi's.";
}

function productWeight(item: MenuItem) {
  const name = item.name.toLowerCase();
  const isBig = item.id.includes("double");
  const isSuper = name.includes("super");
  if (isSuperProduct(item)) return "1 carne bovina de 130g.";
  if (name.includes("chicken")) {
    const chicken = isBig || isSuper ? "2 filés de 120g (240g no total)" : "1 filé de 120g";
    return item.category === "combo"
      ? `${chicken}, ${comboPotatoLabel(item)}.`
      : chicken;
  }
  if (name.includes("bacon")) {
    const burger = isBig || isSuper ? "2 carnes de 100g (200g no total)" : "1 carne de 100g";
    return `${burger}, 40g de bacon${item.category === "combo" ? ` e ${comboPotatoLabel(item)}` : ""}.`;
  }
  if (item.category === "combo") {
    if (item.id === "combo") return `1 carne de 130g e ${comboPotatoLabel(item)}.`;
    if (item.id === "combo2") return `2 carnes de 130g (260g no total) e ${comboPotatoLabel(item)}.`;
    if (item.id === "triple-combo") return `3 carnes de 100g (300g no total) e ${comboPotatoLabel(item)}.`;
    return `${isBig || isSuper ? "2 carnes de 100g (200g no total)" : "1 carne de 100g"} e ${comboPotatoLabel(item)}.`;
  }
  if (item.category === "burger") {
    if (item.id === "burger") return "1 carne de 130g.";
    return isBig ? "2 carnes de 100g (200g no total)." : "1 carne de 100g.";
  }
  if (item.category === "sweet") return isSweetBoxProduct(item) ? "4 doces por caixinha." : "1 unidade.";
  return "Porção conforme seleção.";
}

function productAllergens(item: MenuItem) {
  if (item.category === "bebida") return "Consulte o rótulo da bebida.";
  if (item.category === "sweet") return "Contém leite e derivados. Pode conter amendoim, castanhas, ovo e glúten.";
  return "Contém glúten, leite e derivados. Pode conter ovo e soja.";
}

function visibleProductTags(item: MenuItem) {
  if (item.category !== "sweet") return item.tags;
  return item.tags.filter((tag) => {
    const normalized = tag.toLowerCase();
    return !normalized.includes("sem adicional") && !normalized.includes("2,90");
  });
}

function DetailInfo({ title, copy, dark = false, surface = "#0A2520", accent = "#E8FFF4" }: { title: string; copy: string; dark?: boolean; surface?: string; accent?: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ border: `1px solid ${dark ? `${accent}3D` : `${VERDE}12`}`, background: dark ? surface : "#fff" }}>
      <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: dark ? accent : `${VERDE}59` }}>
        {title}
      </p>
      <p className="mt-1 text-xs font-bold leading-relaxed" style={{ color: dark ? `${accent}DD` : `${VERDE}AD` }}>{copy}</p>
    </div>
  );
}

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

export function ProductDetailModal({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItem;
  onClose: () => void;
  onAdd: () => void;
}) {
  const dark = isSuperProduct(item);
  const chilli = item.id === "tropikal-barbecue";
  const accent = chilli ? "#FF315C" : "#A2E61B";
  const modalBg = chilli ? "#21090F" : "#061C18";
  const surface = chilli ? "#351018" : "#0A2520";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 28, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 18, scale: 0.98 }}
        className="max-h-[92dvh] w-full overflow-auto rounded-t-[28px] sm:max-w-2xl sm:rounded-[28px]"
        style={{ background: dark ? modalBg : "#fff", color: dark ? "#F4FFF8" : VERDE, border: dark ? `1px solid ${accent}66` : undefined }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative h-72 overflow-hidden" style={{ background: dark ? modalBg : "#fff" }}>
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ChefHat size={72} strokeWidth={1.5} style={{ color: VERDE, opacity: 0.28 }} />
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: dark ? surface : "#fff", color: dark ? accent : VERDE, border: `1px solid ${dark ? `${accent}66` : `${VERDE}18`}` }}
            aria-label="Fechar detalhes"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: dark ? accent : `${VERDE}59` }}>
            {item.eyebrow}
          </p>
          <div className="mt-1 flex items-start justify-between gap-4">
            <h2
              className="uppercase"
              style={{
                color: dark ? accent : VERDE,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "2.5rem",
                lineHeight: 0.95,
                letterSpacing: 0,
              }}
            >
              {item.name}
            </h2>
            <p
              className="shrink-0"
              style={{
                color: dark ? accent : VERDE,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "2rem",
                lineHeight: 1,
              }}
            >
              {isSweetBoxProduct(item) ? sweetCardPriceLabel(item) : fmt(item.price)}
            </p>
          </div>
          <p className="mt-3 text-sm leading-6" style={{ color: dark ? "#E8FFF4B8" : `${VERDE}AD` }}>{productStory(item)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleProductTags(item).map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider"
                style={{ background: dark ? `${accent}18` : `${VERDE}08`, color: dark ? accent : `${VERDE}B8` }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-5 grid gap-3">
            <DetailInfo title="Ingredientes" copy={productIngredients(item)} dark={dark} surface={surface} accent={accent} />
            <div className="grid grid-cols-2 gap-3">
              <DetailInfo title="Peso" copy={productWeight(item)} dark={dark} surface={surface} accent={accent} />
              <DetailInfo title="Alérgenos" copy={productAllergens(item)} dark={dark} surface={surface} accent={accent} />
            </div>
            <DetailInfo
              title="Observações"
              copy={item.id === "smash-nutella-marshmallow"
                ? "Produto individual. Informe observações antes de adicionar ao carrinho."
                : "Ponto da carne, molhos, bebidas, adicionais e quantidade são escolhidos antes de adicionar ao carrinho."}
              dark={dark}
              surface={surface}
              accent={accent}
            />
          </div>
          {item.id !== "smash-nutella-marshmallow" && <div className="mt-5 rounded-2xl p-4" style={{ background: dark ? surface : "#fff", color: dark ? accent : VERDE, border: `1px solid ${dark ? `${accent}3D` : `${VERDE}10`}` }}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-45">
              Opções disponíveis
            </p>
            <p className="mt-1 text-xs font-bold leading-relaxed opacity-70">
              {item.category === "combo"
                ? "Escolha ponto, molho, bebida e adicionais antes de adicionar ao pedido."
                : item.category === "burger"
                  ? isSuperProduct(item)
                    ? item.id === "tropikal-barbecue"
                      ? "Escolha o ponto da carne, o nível de pimenta e os adicionais antes de adicionar ao pedido."
                      : "Escolha o ponto da carne e os adicionais antes de adicionar ao pedido."
                    : "Escolha ponto, molho e adicionais antes de adicionar ao pedido."
                  : item.category === "sweet"
                    ? "Escolha 4 doces para montar a caixinha antes de adicionar ao pedido."
                  : "Adicione diretamente ao pedido ou personalize na próxima etapa quando disponível."}
            </p>
          </div>}
          <button
            type="button"
            onClick={onAdd}
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-wider"
            style={{ background: dark ? accent : VERDE, color: dark ? "#07110D" : ROSA }}
          >
            Adicionar ao pedido
            <Plus size={16} strokeWidth={2.6} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
