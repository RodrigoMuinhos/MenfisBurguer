import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { ROSA, VERDE } from "@/utils/theme";
import { CheckoutStep, PaymentMethod, fmt } from "./checkout";

export function CartStickyCta({
  checkoutStep,
  kioskMode,
  missingDelivery,
  payment,
  total,
  paying,
  nextActionLabel,
  onFinalize,
}: {
  checkoutStep: CheckoutStep;
  kioskMode: boolean;
  missingDelivery: string[];
  payment: PaymentMethod;
  total: number;
  paying: boolean;
  nextActionLabel: string;
  onFinalize: () => void | Promise<void>;
}) {
  return (
    <>
      
            {/* ══ CTA sticky ════════════════════════════════════ */}
            <div
              className="px-4 py-4"
              style={{
                position: "sticky",
                bottom: 0,
                zIndex: 45,
                background: "#fff",
                borderTop: `1.5px solid ${ROSA}`,
                boxShadow: "0 -8px 24px rgba(0,0,0,0.06)",
                transition: "bottom 0.18s ease",
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: VERDE, opacity: 0.42 }}
                  >
                    Próxima etapa
                  </p>
                  <p className="text-xs font-bold" style={{ color: VERDE }}>
                    {checkoutStep === "bag"
                      ? kioskMode
                        ? "Inserir dados"
                        : "Ir para entrega"
                      : checkoutStep === "delivery"
                        ? missingDelivery.length > 0
                          ? "Conferir dados de entrega"
                          : "Escolher pagamento"
                        : checkoutStep === "customer"
                          ? "Revisar pedido"
                        : checkoutStep === "payment"
                          ? kioskMode
                            ? "Finalizar pagamento"
                            : "Conferir antes de pagar"
                          : kioskMode
                            ? "Ir para pagamento"
                            : payment === "pagar_na_entrega"
                              ? "Enviar pedido"
                              : payment === "whatsapp"
                                ? "Enviar ao atendimento"
                                : "Fazer pagamento"}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: VERDE, opacity: 0.42 }}
                  >
                    Total
                  </p>
                  <p
                    className="font-black"
                    style={{
                      color: VERDE,
                      fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                      fontSize: "1.45rem",
                      lineHeight: 1,
                    }}
                  >
                    {fmt(total)}
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => void onFinalize()}
                disabled={paying}
                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest disabled:opacity-55"
                style={{
                  background: VERDE,
                  color: ROSA,
                  fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                  fontSize: "1.1rem",
                  letterSpacing: "0.2em",
                  border: "none",
                  cursor: paying ? "default" : "pointer",
                }}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {paying && (
                    <Loader2
                      size={18}
                      strokeWidth={2.6}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  )}
                  {paying
                    ? kioskMode
                      ? "ENVIANDO PEDIDO"
                      : payment === "whatsapp"
                        ? "ENVIANDO AO ATENDIMENTO"
                        : "INICIANDO PAGAMENTO"
                    : nextActionLabel}{" "}
                  - {fmt(total)}
                </span>
              </motion.button>
            </div>
      
    </>
  );
}
