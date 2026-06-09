import { Dispatch, SetStateAction } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MessageSquare, Minus, Plus, Trash2, UtensilsCrossed, X } from "lucide-react";
import { CartItem } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { CheckoutStep, ITEM_DESC, REMOVE_OPTIONS, fmt } from "./checkout";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-2 text-[10px] font-black uppercase tracking-widest"
      style={{ color: VERDE, opacity: 0.55 }}
    >
      {children}
    </p>
  );
}

export function CartItemsSection({
  checkoutStep,
  cart,
  removed,
  obsOpen,
  setObsOpen,
  updateQty,
  toggleRemove,
  goToMenu,
}: {
  checkoutStep: CheckoutStep;
  cart: CartItem[];
  removed: Record<string, Set<string>>;
  obsOpen: string | null;
  setObsOpen: Dispatch<SetStateAction<string | null>>;
  updateQty: (id: string, delta: number) => void;
  toggleRemove: (itemId: string, opt: string) => void;
  goToMenu: () => void;
}) {
  return (
    <>
              {/* ── Itens ── */}
              {(checkoutStep === "bag" || checkoutStep === "review") && (
                <div>
                  <SectionLabel>
                    {checkoutStep === "bag"
                      ? "Itens adicionados"
                      : "Revise seu pedido"}
                  </SectionLabel>
                  <div className="flex flex-col gap-3">
                    <AnimatePresence>
                      {cart.map((item) => {
                        const itemRemoved = removed[item.id] ?? new Set();
                        const isObsOpen = obsOpen === item.id;
      
                        return (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-2xl overflow-hidden"
                            style={{
                              border: `1.5px solid ${ROSA}`,
                              background: "#fff",
                            }}
                          >
                            {/* Item info */}
                            <div className="flex items-start gap-3 px-4 pt-4 pb-2">
                              <div
                                className="relative flex items-center justify-center rounded-2xl shrink-0"
                                style={{
                                  width: 58,
                                  height: 58,
                                  background: `${ROSA}80`,
                                }}
                              >
                                <UtensilsCrossed
                                  size={22}
                                  strokeWidth={2}
                                  style={{ color: VERDE }}
                                />
                                <button
                                  onClick={() =>
                                    setObsOpen(isObsOpen ? null : item.id)
                                  }
                                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full"
                                  style={{
                                    background: "#fff",
                                    color: VERDE,
                                    border: `1px solid ${VERDE}10`,
                                    boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
                                  }}
                                  aria-label="Editar item"
                                >
                                  <MessageSquare size={13} strokeWidth={2.5} />
                                </button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-xs font-black uppercase tracking-wide"
                                  style={{ color: VERDE }}
                                >
                                  {item.name}
                                </p>
                                <p
                                  className="text-[10px] mt-1 leading-relaxed"
                                  style={{ color: VERDE, opacity: 0.4 }}
                                >
                                  {ITEM_DESC[item.id] ?? ""}
                                </p>
                                {itemRemoved.size > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {[...itemRemoved].map((opt) => (
                                      <span
                                        key={opt}
                                        className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide"
                                        style={{ background: ROSA, color: VERDE }}
                                      >
                                        Sem {opt}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
      
                            {/* Qty + price */}
                            <div className="flex items-center gap-3 px-4 pb-3">
                              <div
                                className="flex items-center gap-0 rounded-xl overflow-hidden"
                                style={{ border: `1.5px solid ${ROSA}` }}
                              >
                                <button
                                  onClick={() => updateQty(item.id, -1)}
                                  className="flex items-center justify-center"
                                  style={{
                                    width: 36,
                                    height: 36,
                                    background: ROSA,
                                    border: "none",
                                    color: VERDE,
                                    cursor: "pointer",
                                  }}
                                >
                                  {item.qty === 1 ? (
                                    <Trash2 size={13} strokeWidth={2.5} />
                                  ) : (
                                    <Minus size={13} strokeWidth={2.5} />
                                  )}
                                </button>
                                <span
                                  className="w-8 text-center font-black text-sm"
                                  style={{ color: VERDE }}
                                >
                                  {item.qty}
                                </span>
                                <button
                                  onClick={() => updateQty(item.id, 1)}
                                  className="flex items-center justify-center"
                                  style={{
                                    width: 36,
                                    height: 36,
                                    background: ROSA,
                                    border: "none",
                                    color: VERDE,
                                    cursor: "pointer",
                                  }}
                                >
                                  <Plus size={13} strokeWidth={2.5} />
                                </button>
                              </div>
                              <span
                                className="flex-1 font-black text-right"
                                style={{
                                  color: VERDE,
                                  fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                                  fontSize: "1.1rem",
                                }}
                              >
                                {fmt(item.price * item.qty)}
                              </span>
                            </div>
      
                            {/* Observação trigger */}
                            <button
                              onClick={() => setObsOpen(isObsOpen ? null : item.id)}
                              className="w-full flex items-center gap-2 px-4 py-2.5"
                              style={{
                                background: VERDE,
                                borderTop: `1px solid ${VERDE}`,
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                              }}
                            >
                              <MessageSquare
                                size={12}
                                strokeWidth={2}
                                style={{ color: ROSA, opacity: 0.85 }}
                              />
                              <span
                                className="text-[10px] font-black uppercase tracking-wider flex-1 text-left"
                                style={{ color: ROSA, opacity: 0.9 }}
                              >
                                {isObsOpen ? "Fechar" : "Adicionar observação"}
                              </span>
                              {itemRemoved.size > 0 && !isObsOpen && (
                                <span
                                  className="text-[9px] font-black px-2 py-0.5 rounded-full"
                                  style={{ background: VERDE, color: ROSA }}
                                >
                                  {itemRemoved.size} remoção
                                  {itemRemoved.size > 1 ? "ões" : ""}
                                </span>
                              )}
                            </button>
      
                            <AnimatePresence>
                              {isObsOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div
                                    className="px-4 py-3"
                                    style={{ borderTop: `1px solid ${ROSA}` }}
                                  >
                                    <p
                                      className="text-[9px] font-black uppercase tracking-widest mb-2"
                                      style={{ color: VERDE, opacity: 0.4 }}
                                    >
                                      Quero remover:
                                    </p>
                                    <div className="flex flex-col">
                                      {REMOVE_OPTIONS.map((opt, i) => {
                                        const active = itemRemoved.has(opt);
                                        return (
                                          <motion.button
                                            key={opt}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => toggleRemove(item.id, opt)}
                                            className="flex items-center gap-3 py-2.5 w-full text-left"
                                            style={{
                                              background: "none",
                                              border: "none",
                                              cursor: "pointer",
                                              borderTop:
                                                i > 0
                                                  ? `1px solid ${ROSA}50`
                                                  : "none",
                                            }}
                                          >
                                            <div
                                              className="flex items-center justify-center rounded-md shrink-0"
                                              style={{
                                                width: 20,
                                                height: 20,
                                                background: active ? ROSA : "#fff",
                                                border: `1.5px solid ${ROSA}`,
                                                transition: "all 0.15s",
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
                                              className="text-xs font-bold"
                                              style={{
                                                color: VERDE,
                                                opacity: active ? 1 : 0.55,
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
                        );
                      })}
                    </AnimatePresence>
                  </div>
                  {checkoutStep === "bag" && (
                    <button
                      onClick={goToMenu}
                      className="mt-5 w-full text-center text-base font-black"
                      style={{ color: VERDE, background: "transparent", border: 0 }}
                    >
                      Adicionar mais itens
                    </button>
                  )}
                </div>
              )}
    </>
  );
}
