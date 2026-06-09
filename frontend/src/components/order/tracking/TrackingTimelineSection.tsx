import Image from "next/image";
import { motion } from "motion/react";
import { Clock, CreditCard, QrCode } from "lucide-react";
import logoSkull from "@/imports/image-1.png";
import { Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { STEPS } from "../tracking";

export function TrackingTimelineSection({
  order,
  current,
  statusLabel,
  statusEta,
  stepTimes,
  showPixPayment,
  pixCopied,
  onCopyPixCode,
}: {
  order: Order;
  current: number;
  statusLabel: string;
  statusEta: string;
  stepTimes: string[];
  showPixPayment: boolean;
  pixCopied: boolean;
  onCopyPixCode: () => void;
}) {
  return (
    <>
      {showPixPayment && (
        <div
          className="rounded-[24px] p-4 md:p-5"
          style={{
            background: "#fff",
            border: `1.5px solid ${ROSA}`,
            boxShadow: "0 18px 48px rgba(101,0,31,0.08)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-black leading-tight" style={{ color: VERDE }}>
                Aguardando pagamento Pix
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: VERDE, opacity: 0.62 }}>
                Escaneie o QR Code ou copie o código. Assim que o Mercado Pago aprovar, o pedido entra na fila.
              </p>
            </div>
            <QrCode size={28} strokeWidth={2.2} style={{ color: VERDE }} />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr] md:items-center">
            {order.pixQrCodeBase64 && (
              <div
                className="mx-auto flex h-44 w-44 items-center justify-center rounded-2xl p-3"
                style={{ background: "#fff", border: `1px solid ${ROSA}` }}
              >
                <img
                  src={`data:image/png;base64,${order.pixQrCodeBase64}`}
                  alt="QR Code Pix"
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            <div className="min-w-0">
              {order.pixQrCode && (
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: VERDE, opacity: 0.42 }}>
                    Pix copia e cola
                  </p>
                  <div
                    className="mt-2 rounded-2xl p-3 text-xs leading-relaxed"
                    style={{
                      color: VERDE,
                      background: `${ROSA}22`,
                      border: `1px solid ${ROSA}`,
                      wordBreak: "break-all",
                    }}
                  >
                    {order.pixQrCode}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onCopyPixCode}
                    className="mt-3 w-full rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
                    style={{ background: VERDE, color: ROSA, border: "none", cursor: "pointer" }}
                  >
                    {pixCopied ? "Código copiado" : "Copiar código Pix"}
                  </motion.button>
                </>
              )}
              {order.pixTicketUrl && (
                <a
                  href={order.pixTicketUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block rounded-2xl px-4 py-3 text-center text-xs font-black uppercase tracking-wider"
                  style={{ color: VERDE, border: `1.5px solid ${ROSA}`, textDecoration: "none" }}
                >
                  Abrir Pix no Mercado Pago
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        className="rounded-[24px] p-4 md:p-5"
        style={{
          background: "#fff",
          border: `1.5px solid ${ROSA}`,
          boxShadow: "0 18px 48px rgba(101,0,31,0.08)",
        }}
      >
        <div className="flex items-start gap-3">
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full sm:flex" style={{ background: `${ROSA}55` }}>
            <Image src={logoSkull} alt="" width={36} height={36} style={{ mixBlendMode: "multiply" }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-black leading-tight" style={{ color: VERDE }}>
              {statusLabel.includes("preparado") ? "Seu pedido está em preparo!" : statusLabel}
            </p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: VERDE, opacity: 0.62 }}>
              Primeiro confirmamos o pagamento. O pedido só aparece como recebido
              quando a cozinha aceitar no KDS.
            </p>
            <div className="mt-5 flex items-start gap-2">
              <Clock size={17} strokeWidth={2.1} style={{ color: VERDE, opacity: 0.45 }} />
              <div>
                <p className="text-xs" style={{ color: VERDE, opacity: 0.55 }}>Entrega estimada</p>
                <p className="text-2xl font-black leading-none" style={{ color: "#EF4C86" }}>
                  {statusEta}
                </p>
              </div>
            </div>
          </div>
          <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-full md:flex" style={{ background: `${ROSA}35` }}>
            <Image src={logoSkull} alt="Menfi's" width={78} height={78} style={{ mixBlendMode: "multiply" }} />
          </div>
        </div>

        <div className="relative mt-8 grid grid-cols-5 gap-1">
          <div className="absolute left-[10%] right-[10%] top-[30px] h-0.5" style={{ background: "#D9D9D9" }} />
          <motion.div
            initial={false}
            animate={{ width: `${Math.min(100, Math.max(0, (current / (STEPS.length - 1)) * 100))}%` }}
            className="absolute left-[10%] top-[30px] h-0.5"
            style={{ background: "#EF4C86", maxWidth: "80%" }}
          />
          {STEPS.map((step, index) => {
            const done = index <= current;
            const active = index === current;
            const Icon = step.icon;
            return (
              <div key={step.label} className="relative z-10 flex flex-col items-center text-center">
                {active ? (
                  <span className="mb-1 rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: `${ROSA}80`, color: "#EF4C86" }}>
                    Atual
                  </span>
                ) : (
                  <span className="mb-1 h-[18px]" />
                )}
                <motion.div
                  animate={{ scale: active ? 1.12 : 1 }}
                  className="flex h-[58px] w-[58px] items-center justify-center rounded-full"
                  style={{
                    background: active ? `${ROSA}90` : done ? "#EF4C86" : "#fff",
                    border: `2px solid ${done || active ? "#EF4C86" : "#D9D9D9"}`,
                    boxShadow: active ? "0 0 0 8px rgba(239,76,134,0.12)" : "none",
                  }}
                >
                  <Icon
                    size={active ? 25 : 24}
                    strokeWidth={2.4}
                    style={{ color: done && !active ? "#fff" : active ? VERDE : "#4B5563" }}
                  />
                </motion.div>
                <p className="mt-2 text-[10px] font-black leading-tight" style={{ color: "#111" }}>
                  {step.label}
                </p>
                <p className="mt-1 text-[10px]" style={{ color: "#666" }}>
                  {stepTimes[index]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
