import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { ROSA, VERDE } from "@/utils/theme";
import {
  CheckoutStep,
  PaymentMethod,
  fmt,
} from "./checkout";

export function CartStickyCta({
  checkoutStep,
  kioskMode,
  counterServiceMode = false,
  missingDelivery,
  payment,
  subtotal,
  fee,
  serviceFee,
  discount,
  total,
  paying,
  nextActionLabel,
  hideTotalInButton = false,
  onFinalize,
}: {
  checkoutStep: CheckoutStep;
  kioskMode: boolean;
  counterServiceMode?: boolean;
  missingDelivery: string[];
  payment: PaymentMethod;
  subtotal: number;
  fee: number;
  serviceFee: number;
  discount: number;
  total: number;
  paying: boolean;
  nextActionLabel: string;
  hideTotalInButton?: boolean;
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
                      ? counterServiceMode
                        ? "Pagar no balcão"
                        : kioskMode
                        ? "Inserir dados"
                        : "Ir para entrega"
                      : checkoutStep === "delivery"
                        ? missingDelivery.length > 0
                          ? "Conferir dados de entrega"
                          : "Escolher pagamento"
                        : checkoutStep === "customer"
                          ? "Revisar pedido"
                        : checkoutStep === "payment"
                          ? kioskMode || counterServiceMode
                            ? "Finalizar pagamento"
                            : payment === "whatsapp"
                              ? "Abrir WhatsApp"
                              : payment === "mercadopago"
                                ? "Finalizar com Mercado Pago"
                                : payment === "pix_qrcode"
                                  ? "Finalizar com Mercado Pago"
                                  : payment === "pix"
                                    ? "Gerar Pix Menfi's"
                                  : "Finalizar pagamento"
                          : kioskMode || counterServiceMode
                            ? "Ir para pagamento"
                            : "Escolher forma de pagamento"}
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
              <div
                className="mb-3 grid gap-1 rounded-xl px-3 py-2 text-[11px] font-bold"
                style={{ background: `${ROSA}22`, color: VERDE }}
              >
                <div className="flex justify-between gap-3">
                  <span>Itens</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Taxa de entrega</span>
                  <span>{fee > 0 ? fmt(fee) : "Sem frete"}</span>
                </div>
                {serviceFee > 0 && (
                  <div className="flex justify-between gap-3">
                    <span>Taxa de serviço</span>
                    <span>{fmt(serviceFee)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between gap-3">
                    <span>Desconto</span>
                    <span>- {fmt(discount)}</span>
                  </div>
                )}
              </div>
              <motion.button
                data-checkout-submit
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
                    ? kioskMode || counterServiceMode
                      ? "ENVIANDO PEDIDO"
                        : payment === "whatsapp"
                        ? "ENVIANDO AO ATENDIMENTO"
                        : payment === "mercadopago"
                          ? "ABRINDO MERCADO PAGO"
                          : payment === "pix_qrcode"
                            ? "ABRINDO MERCADO PAGO"
                            : payment === "pix"
                              ? "GERANDO PIX MENFI'S"
                        : "INICIANDO PAGAMENTO"
                    : nextActionLabel}{" "}
                  {!hideTotalInButton && <>- {fmt(total)}</>}
                </span>
              </motion.button>
            </div>
      
    </>
  );
}
