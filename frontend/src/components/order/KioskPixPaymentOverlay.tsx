import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, Loader2, QrCode, X } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import { API_URL, KIOSK_MP_PIX_TIMEOUT_SECONDS, KioskPixCharge, KioskPixResult, fmt } from "./checkout";

const POLL_INTERVAL_MS = 3000;
const APPROVED_SCREEN_MS = 2500;
const PAID_STATUSES = new Set([
  "PAYMENT_APPROVED",
  "PAID",
  "ACCEPTED",
  "IN_PREPARATION",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
]);

type Phase = "waiting" | "approved" | "expired" | "failed";

/**
 * Exibe o QR Code Pix gerado pelo Mercado Pago no totem e consulta o status do
 * pedido até o webhook confirmar o pagamento.
 */
export function KioskPixPaymentOverlay({
  charge,
  onFinish,
}: {
  charge: KioskPixCharge | null;
  onFinish: (result: KioskPixResult) => void;
}) {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [secondsLeft, setSecondsLeft] = useState(KIOSK_MP_PIX_TIMEOUT_SECONDS);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    setPhase("waiting");
    setSecondsLeft(KIOSK_MP_PIX_TIMEOUT_SECONDS);
  }, [charge?.orderId]);

  useEffect(() => {
    if (!charge || phase !== "waiting") return;
    let stopped = false;
    const poll = async () => {
      try {
        const res = await fetch(
          `${API_URL}/orders/${encodeURIComponent(charge.orderId)}/status`,
          {
            cache: "no-store",
            headers: charge.trackingToken ? { "X-Order-Token": charge.trackingToken } : {},
          },
        );
        if (!res.ok || stopped) return;
        const data = await res.json().catch(() => ({}));
        const status = String(data?.status ?? "").toUpperCase();
        if (data?.paidAt || PAID_STATUSES.has(status)) {
          setPhase("approved");
        } else if (status === "CANCELLED") {
          setPhase("failed");
        }
      } catch {
        // Rede instável: tenta de novo no próximo ciclo.
      }
    };
    void poll();
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [charge, phase]);

  useEffect(() => {
    if (!charge || phase !== "waiting") return;
    if (secondsLeft <= 0) {
      setPhase("expired");
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [charge, phase, secondsLeft]);

  useEffect(() => {
    if (phase !== "approved") return;
    const timer = window.setTimeout(() => finishRef.current("approved"), APPROVED_SCREEN_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <AnimatePresence>
      {charge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[85] flex items-center justify-center bg-white px-6"
          style={{ color: VERDE }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            className="relative w-full max-w-md rounded-[32px] border-2 bg-white p-6 text-center shadow-2xl"
            style={{ borderColor: ROSA }}
          >
            {phase === "waiting" && (
              <>
                <button
                  type="button"
                  onClick={() => onFinish("cancelled")}
                  aria-label="Cancelar pedido"
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ color: VERDE, background: `${ROSA}55` }}
                >
                  <X size={18} strokeWidth={3} />
                </button>
                <div
                  className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: ROSA }}
                >
                  <QrCode size={26} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-wide">Pague com Pix</h2>
                <p className="mt-1 text-sm font-bold opacity-65">
                  Escaneie o QR Code com o app do seu banco.
                </p>
                <div className="mt-4 rounded-3xl p-4" style={{ border: `1px solid ${ROSA}` }}>
                  {charge.qrCodeBase64 ? (
                    <img
                      src={`data:image/png;base64,${charge.qrCodeBase64}`}
                      alt="QR Code Pix do pedido"
                      className="mx-auto h-64 w-64 object-contain"
                    />
                  ) : (
                    <QrCode size={96} className="mx-auto opacity-30" />
                  )}
                  <p className="mt-3 text-[10px] font-black uppercase tracking-widest opacity-55">
                    Valor a pagar
                  </p>
                  <p className="text-4xl font-black" style={{ color: "#8A0030" }}>
                    {fmt(charge.total)}
                  </p>
                  {charge.qrCode && (
                    <p
                      className="mt-3 break-all rounded-2xl px-3 py-2 text-[10px] font-bold leading-relaxed"
                      style={{ background: `${ROSA}40` }}
                    >
                      {charge.qrCode}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm font-black">
                  <Loader2 size={18} className="animate-spin" />
                  Aguardando confirmação do pagamento
                </div>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest opacity-50">
                  Expira em {minutes}:{seconds}
                </p>
                <button
                  type="button"
                  onClick={() => onFinish("cancelled")}
                  className="mt-4 h-12 w-full rounded-2xl text-xs font-black uppercase"
                  style={{ color: VERDE, border: `1px solid ${ROSA}` }}
                >
                  Cancelar pedido
                </button>
              </>
            )}

            {phase === "approved" && (
              <div className="py-4">
                <motion.div
                  initial={{ scale: 0.55, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 14 }}
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-full"
                  style={{ background: ROSA }}
                >
                  <CheckCircle2 size={56} strokeWidth={2.8} />
                </motion.div>
                <h2 className="mt-6 text-4xl font-black uppercase">Pagamento aprovado</h2>
                <p className="mt-3 text-sm font-bold opacity-70">
                  Seu pedido foi enviado para a cozinha.
                </p>
              </div>
            )}

            {(phase === "expired" || phase === "failed") && (
              <div className="py-4">
                <div
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ background: ROSA }}
                >
                  <Clock size={42} strokeWidth={2.6} />
                </div>
                <h2 className="mt-5 text-3xl font-black uppercase">
                  {phase === "expired" ? "Tempo esgotado" : "Pagamento não aprovado"}
                </h2>
                <p className="mt-2 text-sm font-bold opacity-65">
                  Não recebemos a confirmação do Pix. Se você já pagou, procure o atendente.
                </p>
                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={() => onFinish("expired")}
                    className="min-h-14 rounded-2xl text-sm font-black uppercase text-white"
                    style={{ background: VERDE }}
                  >
                    Tentar novamente
                  </button>
                  <button
                    type="button"
                    onClick={() => onFinish("cancelled")}
                    className="h-12 rounded-2xl text-xs font-black uppercase"
                    style={{ color: VERDE, border: `1px solid ${ROSA}` }}
                  >
                    Cancelar pedido
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
