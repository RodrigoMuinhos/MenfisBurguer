import Image from "next/image";
import { motion } from "motion/react";
import { ChefHat, CheckCircle2, Minus, Plus, X } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import {
  CustomizerState,
  DRINK_OPTIONS,
  MEAT_POINT_OPTIONS,
  SAUCE_OPTIONS,
  SWEET_BOX_REQUIRED_COUNT,
  fmt,
  imageSrc,
} from "./shared";
import { useProductCustomizerModel } from "./customizer/useProductCustomizerModel";
import { OptionSection, OptionThumb } from "./customizer/CustomizerOptionSection";

export function ProductCustomizer({
  state,
  setState,
  onConfirm,
}: {
  state: CustomizerState;
  setState: React.Dispatch<React.SetStateAction<CustomizerState | null>>;
  onConfirm: () => void;
}) {
  const { needsMeatPoint, requiredCount, needsSauce, needsFreeMayo, needsDrink, isSweetBox,
    isSweetPlus, needsSpiceLevel, superTheme, chilliTheme, superBackground, superSurface, superAccent,
    sweetOptions, sauceRequiredCount, extraOptions, sweetCount, total, valid, spiceValid,
    toggleLimited, countSelected, updateExtraQty, updateSweetQty } = useProductCustomizerModel(state, setState);

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
      className={`max-h-[92dvh] w-full max-w-2xl overflow-hidden rounded-t-[22px] sm:rounded-[22px] ${superTheme ? `super-customizer ${chilliTheme ? "chilli-theme" : "tropical-theme"}` : ""}`}
      style={{ background: superTheme ? superBackground : "#fff", color: superTheme ? "#F4FFF8" : VERDE, border: superTheme ? `1px solid ${superAccent}66` : undefined }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4"
          style={{ background: superTheme ? superSurface : "#fff", borderBottom: `1px solid ${superTheme ? `${superAccent}3D` : `${VERDE}12`}` }}
        >
          <button
            onClick={() => setState(null)}
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: superTheme ? `${superAccent}18` : `${VERDE}08`, color: superTheme ? superAccent : VERDE }}
            aria-label="Fechar"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-black uppercase">{state.item.name}</p>
            <p className={`mt-0.5 text-[10px] font-black uppercase tracking-wider ${superTheme ? "text-white/55" : "text-black/40"}`}>
              Personalizar pedido · {fmt(total)}
            </p>
          </div>
          <span className="flex h-10 min-w-10 items-center justify-center rounded-full px-2 text-[10px] font-black" style={{ background: superTheme ? `${superAccent}18` : `${VERDE}08`, color: superTheme ? superAccent : VERDE }}>
            {valid && spiceValid ? "OK" : "PENDENTE"}
          </span>
        </div>

        <div className="max-h-[calc(92dvh-150px)] overflow-y-auto">
          <div className="relative h-48 overflow-hidden" style={{ background: superTheme ? superBackground : "#fff" }}>
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
            <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${superTheme ? "text-white/45" : "text-black/35"}`}>
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
            <p className={`mt-2 text-sm leading-relaxed ${superTheme ? "text-white/65" : "text-black/58"}`}>
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
              {fmt(state.item.price)}
            </p>
          </div>

          {isSweetBox && (
            <OptionSection
              title={isSweetPlus ? "Sweet Menfi's Plus" : "Sweet Menfi's Classic"}
              subtitle={
                isSweetPlus
                  ? "Escolha exatamente 4 doces premium."
                  : "Escolha exatamente 4 doces clássicos. Sem adicional."
              }
              count={sweetCount}
              total={SWEET_BOX_REQUIRED_COUNT}
              required
            >
              {sweetOptions.map((sweet) => {
                const quantity = state.extras[sweet.id] ?? 0;
                const active = quantity > 0;
                return (
                  <div
                    key={sweet.id}
                    className="flex w-full items-center justify-between gap-3 border-t px-5 py-4 text-left"
                    style={{ borderColor: `${VERDE}10`, background: "#fff" }}
                  >
                    <span>
                      <span className="block text-sm font-bold">{sweet.label}</span>
                      <span className="text-xs text-black/50">
                        {sweet.premium ? "Premium" : "Incluso"}
                      </span>
                    </span>
                    {active ? (
                      <span
                        className="grid h-10 w-32 grid-cols-3 overflow-hidden rounded-2xl"
                        style={{ border: `1.5px solid ${VERDE}18` }}
                      >
                        <button
                          type="button"
                          onClick={() => updateSweetQty(sweet.id, -1)}
                          className="flex items-center justify-center"
                          style={{ color: VERDE }}
                          aria-label={`Remover ${sweet.label}`}
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
                          onClick={() => updateSweetQty(sweet.id, 1)}
                          disabled={sweetCount >= SWEET_BOX_REQUIRED_COUNT}
                          className="flex items-center justify-center disabled:opacity-35"
                          style={{ color: VERDE }}
                          aria-label={`Adicionar ${sweet.label}`}
                        >
                          <Plus size={15} strokeWidth={2.6} />
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateSweetQty(sweet.id, 1)}
                        disabled={sweetCount >= SWEET_BOX_REQUIRED_COUNT}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-black disabled:opacity-35"
                        style={{ background: "#F8F4F5", color: VERDE }}
                        aria-label={`Adicionar ${sweet.label}`}
                      >
                        +
                      </button>
                    )}
                  </div>
                );
              })}
            </OptionSection>
          )}

          {!isSweetBox && needsMeatPoint && (
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

          {needsSpiceLevel && (
            <div className="border-t px-5 py-5" style={{ borderColor: superTheme ? `${superAccent}3D` : `${VERDE}10`, background: superTheme ? superSurface : "#fff" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black">Nível de pimenta</p>
                  <p className={`mt-1 text-xs ${superTheme ? "text-white/55" : "text-black/50"}`}>Toque nas pimentas para graduar a ardência.</p>
                </div>
                <button type="button" onClick={() => setState((prev) => prev ? { ...prev, spiceLevel: 0 } : prev)} className="rounded-full px-3 py-2 text-[10px] font-black uppercase" style={{ background: state.spiceLevel === 0 ? ROSA : superTheme ? "#FFFFFF12" : `${VERDE}0D`, color: state.spiceLevel === 0 ? VERDE : superTheme ? "#fff" : VERDE }}>
                  Sem pimenta
                </button>
              </div>
              <div className="mt-5 grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((level) => {
                  const selected = (state.spiceLevel ?? 0) >= level;
                  return (
                    <button key={level} type="button" onClick={() => setState((prev) => prev ? { ...prev, spiceLevel: level } : prev)} className="flex aspect-square items-center justify-center rounded-2xl text-2xl transition-transform active:scale-95" style={{ background: selected ? "#7D0029" : superTheme ? "#FFFFFF0D" : "#F8F4F5", border: `1px solid ${selected ? ROSA : superTheme ? "#FFFFFF1F" : `${VERDE}12`}`, filter: selected ? "none" : "grayscale(1)", opacity: selected ? 1 : 0.45 }} aria-label={`Nível ${level} de pimenta`}>
                      🌶️
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-center text-xs font-black uppercase tracking-wider" style={{ color: superTheme ? "#E8FFF4" : VERDE }}>
                {state.spiceLevel === undefined ? "Selecione o nível" : `${state.spiceLevel} de 5 · ${["Sem pimenta", "Muito suave", "Suave", "Média", "Forte", "Muito forte"][state.spiceLevel]}`}
              </p>
            </div>
          )}

          {!isSweetBox && (needsSauce || needsFreeMayo) && (
            <OptionSection
              title={needsFreeMayo ? "Maionese grátis" : "Molhos para o burger"}
              subtitle={
                needsFreeMayo
                  ? "Escolha 1 opção. Uma maionese acompanha sem custo."
                  : `Escolha ${requiredCount} ${requiredCount === 1 ? "opção" : "opções"}`
              }
              count={state.sauces.length}
              total={sauceRequiredCount}
              required
            >
              {SAUCE_OPTIONS.map((sauce) => {
                const selectedCount = countSelected("sauces", sauce.label);
                const active = selectedCount > 0;
                return (
                  <button
                    key={sauce.label}
                    onClick={() =>
                      toggleLimited("sauces", sauce.label, sauceRequiredCount)
                    }
                    className="flex w-full items-center justify-between gap-3 border-t px-5 py-4 text-left"
                    style={{ borderColor: `${VERDE}10`, background: "#fff" }}
                  >
                    <span className="flex items-center gap-3">
                      <OptionThumb src={sauce.image} alt={sauce.label} />
                      <span>
                        <span className="block text-sm font-bold">{sauce.label}</span>
                        {needsFreeMayo && (
                          <span className="block text-xs font-bold opacity-60">grátis</span>
                        )}
                      </span>
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

          {!isSweetBox && needsDrink && (
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

          {!isSweetBox && (
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
          )}

          <div className="px-5 py-5">
            <p className={`mb-2 text-xs font-black uppercase tracking-wider ${superTheme ? "text-white/45" : "text-black/45"}`}>
              Alguma observação?
            </p>
            <textarea
              value={state.note}
              onChange={(event) =>
                setState((prev) => (prev ? { ...prev, note: event.target.value.slice(0, 140) } : prev))
              }
              placeholder="Ex: tirar cebola, molho à parte..."
              className="h-24 w-full resize-none rounded-2xl p-4 text-sm outline-none"
              style={{ border: `1.5px solid ${superTheme ? `${superAccent}3D` : `${VERDE}12`}`, color: superTheme ? "#fff" : VERDE, background: superTheme ? superSurface : "#fff" }}
            />
          </div>
        </div>

        <div
          className="sticky bottom-0 z-20 grid grid-cols-[128px_1fr] gap-3 px-5 py-4 shadow-[0_-14px_30px_rgba(0,0,0,.22)]"
          style={{ background: superTheme ? superSurface : "#fff", borderTop: `1px solid ${superTheme ? `${superAccent}3D` : `${VERDE}12`}` }}
        >
          <div
            className="grid h-12 grid-cols-3 overflow-hidden rounded-2xl"
            style={{ border: `1.5px solid ${superTheme ? `${superAccent}66` : `${VERDE}12`}` }}
          >
            <button
              onClick={() => setState((prev) => (prev ? { ...prev, qty: Math.max(1, prev.qty - 1) } : prev))}
              className="flex items-center justify-center"
              style={{ color: superTheme ? superAccent : VERDE }}
            >
              <Minus size={16} strokeWidth={2.6} />
            </button>
            <div className="flex items-center justify-center text-sm font-black">
              {state.qty}
            </div>
            <button
              onClick={() => setState((prev) => (prev ? { ...prev, qty: prev.qty + 1 } : prev))}
              className="flex items-center justify-center"
              style={{ color: superTheme ? superAccent : VERDE }}
            >
              <Plus size={16} strokeWidth={2.6} />
            </button>
          </div>
          <button
            onClick={onConfirm}
                disabled={!valid || !spiceValid}
            className="h-12 rounded-2xl text-xs font-black uppercase tracking-wider disabled:opacity-35"
            style={{ background: superTheme ? superAccent : VERDE, color: superTheme ? "#07110D" : ROSA }}
          >
            {valid && spiceValid
              ? `Adicionar — ${fmt(total)}`
              : needsSpiceLevel && state.spiceLevel === undefined
                ? "Selecione o nível de pimenta"
              : isSweetBox
                ? `Escolha ${SWEET_BOX_REQUIRED_COUNT - sweetCount} doce${SWEET_BOX_REQUIRED_COUNT - sweetCount === 1 ? "" : "s"}`
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
