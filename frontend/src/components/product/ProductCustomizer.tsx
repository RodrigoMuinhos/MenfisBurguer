import Image from "next/image";
import { motion } from "motion/react";
import {
  ChefHat,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";
import { CartItem } from "@/types/order";
import { CREME, ROSA, VERDE } from "@/utils/theme";
import { MenuItem } from "@/features/catalog/types";
import {
  COMBO_DRINK_SURCHARGE_PRODUCT_ID,
  CustomizerState,
  DRINK_OPTIONS,
  MEAT_POINT_OPTIONS,
  SAUCE_OPTIONS,
  fmt,
  getExtraOptionsForItem,
  imageSrc,
  isChickenProduct,
  requiredCustomizerCount,
} from "./shared";

export function ProductCustomizer({
  state,
  setState,
  onConfirm,
}: {
  state: CustomizerState;
  setState: React.Dispatch<React.SetStateAction<CustomizerState | null>>;
  onConfirm: () => void;
}) {
  const needsMeatPoint =
    !isChickenProduct(state.item) &&
    (state.item.category === "burger" || state.item.category === "combo");
  const requiredCount = requiredCustomizerCount(state.item);
  const needsSauce = state.item.category === "burger" || state.item.category === "combo";
  const needsDrink = state.item.category === "combo";
  const extraOptions = getExtraOptionsForItem(state.item);
  const extrasTotal = Object.entries(state.extras).reduce((sum, [extraId, quantity]) => {
    const extra = extraOptions.find((option) => option.id === extraId);
    return sum + (extra?.price ?? 0) * quantity;
  }, 0);
  const drinkSurchargeTotal = state.drinks.reduce((sum, drinkId) => {
    const drink = DRINK_OPTIONS.find((option) => option.id === drinkId);
    const hasSurchargeProduct = Boolean(COMBO_DRINK_SURCHARGE_PRODUCT_ID[drinkId]);
    return sum + (hasSurchargeProduct ? drink?.comboPrice ?? 0 : 0);
  }, 0);
  const total = (state.item.price + drinkSurchargeTotal + extrasTotal) * state.qty;
  const valid =
    (!needsMeatPoint || state.meatPoints.length === requiredCount) &&
    (!needsSauce || state.sauces.length === requiredCount) &&
    (!needsDrink || state.drinks.length === requiredCount);

  const toggleLimited = (
    field: "meatPoints" | "sauces" | "drinks",
    value: string,
    max: number,
  ) => {
    setState((prev) => {
      if (!prev) return prev;
      const current = prev[field];
      if (max === 1) {
        return { ...prev, [field]: current[0] === value ? [] : [value] };
      }
      const selectedCount = current.filter((item) => item === value).length;
      if (selectedCount >= max) {
        return { ...prev, [field]: current.filter((item) => item !== value) };
      }
      if (current.length < max) {
        return { ...prev, [field]: [...current, value] };
      }
      if (selectedCount === 0) {
        return { ...prev, [field]: [...current.slice(0, max - 1), value] };
      }
      return { ...prev, [field]: Array.from({ length: max }, () => value) };
    });
  };

  const countSelected = (
    field: "meatPoints" | "sauces" | "drinks",
    value: string,
  ) => state[field].filter((item) => item === value).length;

  const updateExtraQty = (extraId: string, delta: number) => {
    setState((prev) => {
      if (!prev) return prev;
      const current = prev.extras[extraId] ?? 0;
      const nextQty = Math.min(3, Math.max(0, current + delta));
      const nextExtras = { ...prev.extras };
      if (nextQty === 0) {
        delete nextExtras[extraId];
      } else {
        nextExtras[extraId] = nextQty;
      }
      return { ...prev, extras: nextExtras };
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
      className="max-h-[92dvh] w-full max-w-2xl overflow-hidden rounded-t-[22px] sm:rounded-[22px]"
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
          <div className="relative h-48 overflow-hidden" style={{ background: CREME }}>
            {state.item.image ? (
              <img
                src={imageSrc(state.item.image)}
                alt={state.item.name}
                style={{
                  display: "block",
                  height: "100%",
                  width: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                }}
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

          {needsMeatPoint && (
            <OptionSection
              title="Ponto da carne"
              subtitle={`Escolha ${requiredCount} ${requiredCount === 1 ? "opção" : "opções"}`}
              count={state.meatPoints.length}
              total={requiredCount}
              required
            >
              {MEAT_POINT_OPTIONS.map((point) => {
                const selectedCount = countSelected("meatPoints", point.label);
                const active = selectedCount > 0;
                return (
                  <button
                    key={point.label}
                    onClick={() =>
                      toggleLimited("meatPoints", point.label, requiredCount)
                    }
                    className="flex w-full items-center justify-between gap-3 border-t px-5 py-4 text-left"
                    style={{ borderColor: `${VERDE}10`, background: "#fff" }}
                  >
                    <span>
                      <span className="block text-sm font-bold">{point.label}</span>
                      <span className="text-xs text-black/50">{point.copy}</span>
                    </span>
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black"
                      style={{
                        background: active ? VERDE : "#fff",
                        border: `2px solid ${active ? VERDE : "#E9D9DF"}`,
                        color: active ? ROSA : "transparent",
                      }}
                    >
                      {selectedCount > 0 ? selectedCount : "✓"}
                    </span>
                  </button>
                );
              })}
            </OptionSection>
          )}

          {needsSauce && (
            <OptionSection
              title="Molhos para o burger"
              subtitle={`Escolha ${requiredCount} ${requiredCount === 1 ? "opção" : "opções"}`}
              count={state.sauces.length}
              total={requiredCount}
              required
            >
              {SAUCE_OPTIONS.map((sauce) => {
                const selectedCount = countSelected("sauces", sauce.label);
                const active = selectedCount > 0;
                return (
                  <button
                    key={sauce.label}
                    onClick={() =>
                      toggleLimited("sauces", sauce.label, requiredCount)
                    }
                    className="flex w-full items-center justify-between gap-3 border-t px-5 py-4 text-left"
                    style={{ borderColor: `${VERDE}10`, background: "#fff" }}
                  >
                    <span className="flex items-center gap-3">
                      <OptionThumb src={sauce.image} alt={sauce.label} />
                      <span className="text-sm font-bold">{sauce.label}</span>
                    </span>
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black"
                      style={{
                        background: active ? VERDE : "#fff",
                        border: `2px solid ${active ? VERDE : "#E9D9DF"}`,
                        color: active ? ROSA : "transparent",
                      }}
                    >
                      {selectedCount > 0 ? selectedCount : "✓"}
                    </span>
                  </button>
                );
              })}
            </OptionSection>
          )}

          {needsDrink && (
            <OptionSection
              title="Aceita uma bebida?"
              subtitle={`Escolha ${requiredCount} ${requiredCount === 1 ? "opção" : "opções"}`}
              count={state.drinks.length}
              total={requiredCount}
              required
            >
              {DRINK_OPTIONS.map((drink) => {
                const selectedCount = countSelected("drinks", drink.id);
                const active = selectedCount > 0;
                return (
                  <button
                    key={drink.id}
                    onClick={() =>
                      toggleLimited("drinks", drink.id, requiredCount)
                    }
                    className="flex w-full items-center justify-between gap-3 border-t px-5 py-4 text-left"
                    style={{ borderColor: `${VERDE}10`, background: "#fff" }}
                  >
                    <span className="flex items-center gap-3">
                      <OptionThumb src={drink.image} alt={drink.label} />
                      <span>
                        <span className="block text-sm font-bold">{drink.label}</span>
                        <span className="block text-xs font-bold opacity-60">
                          {drink.comboPrice > 0
                            ? `+ ${fmt(drink.comboPrice)}`
                            : "grátis"}
                        </span>
                      </span>
                    </span>
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black"
                      style={{
                        border: `2px solid ${active ? VERDE : "#E9D9DF"}`,
                        background: active ? VERDE : "#fff",
                        color: active ? ROSA : "transparent",
                      }}
                    >
                      {selectedCount > 0 ? selectedCount : "✓"}
                    </span>
                  </button>
                );
              })}
            </OptionSection>
          )}

          <OptionSection title="Extras" subtitle="Escolha até 3 de cada opção">
            {extraOptions.map((extra) => {
              const quantity = state.extras[extra.id] ?? 0;
              const active = quantity > 0;
              return (
                <div
                  key={extra.id}
                  className="flex w-full items-center justify-between gap-3 border-t px-5 py-4 text-left"
                  style={{ borderColor: `${VERDE}10`, background: "#fff" }}
                >
                  <span className="flex items-center gap-3">
                    <OptionThumb src={extra.image} alt={extra.label} />
                    <span>
                      <span className="block text-sm font-bold">{extra.label}</span>
                      <span className="text-xs text-black/50">+ {fmt(extra.price)}</span>
                    </span>
                  </span>
                  {active ? (
                    <span
                      className="grid h-10 w-32 grid-cols-3 overflow-hidden rounded-2xl"
                      style={{ border: `1.5px solid ${VERDE}18` }}
                    >
                      <button
                        type="button"
                        onClick={() => updateExtraQty(extra.id, -1)}
                        className="flex items-center justify-center"
                        style={{ color: VERDE }}
                        aria-label={`Remover ${extra.label}`}
                      >
                        <Minus size={15} strokeWidth={2.6} />
                      </button>
                      <span
                        className="flex items-center justify-center text-sm font-black"
                        style={{ background: VERDE, color: ROSA }}
                      >
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateExtraQty(extra.id, 1)}
                        disabled={quantity >= 3}
                        className="flex items-center justify-center disabled:opacity-35"
                        style={{ color: VERDE }}
                        aria-label={`Adicionar ${extra.label}`}
                      >
                        <Plus size={15} strokeWidth={2.6} />
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateExtraQty(extra.id, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-black"
                      style={{ background: "#F8F4F5", color: VERDE }}
                      aria-label={`Adicionar ${extra.label}`}
                    >
                      +
                    </button>
                  )}
                </div>
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
            {valid
              ? `Adicionar ${fmt(total)}`
              : `Complete obrigatórios (${[
                  needsMeatPoint ? Math.min(state.meatPoints.length, requiredCount) : requiredCount,
                  needsSauce ? Math.min(state.sauces.length, requiredCount) : requiredCount,
                  needsDrink ? Math.min(state.drinks.length, requiredCount) : requiredCount,
                ].filter((value) => value < requiredCount).length} falta)`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function OptionSection({
  title,
  subtitle,
  count,
  total,
  required,
  children,
}: {
  title: string;
  subtitle: string;
  count?: number;
  total?: number;
  required?: boolean;
  children: React.ReactNode;
}) {
  const showCounter = typeof count === "number" && typeof total === "number";
  return (
    <section>
      <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ background: "#F5F5F5" }}>
        <div>
          <p className="text-lg font-black text-black/62">{title}</p>
          <p className="text-sm text-black/50">{subtitle}</p>
        </div>
        {required && (
          <div className="flex items-center gap-2">
            {showCounter && (
              <span
                className="rounded-full px-3 py-1 text-[11px] font-black"
                style={{
                  background: count >= total ? VERDE : ROSA,
                  color: count >= total ? ROSA : VERDE,
                }}
              >
                {count}/{total}
              </span>
            )}
            <span className="rounded-lg bg-black px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
              Obrigatório
            </span>
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

function OptionThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{ background: "#F4F4F4" }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{
          display: "block",
          height: "100%",
          width: "100%",
          objectFit: "cover",
        }}
      />
    </span>
  );
}

