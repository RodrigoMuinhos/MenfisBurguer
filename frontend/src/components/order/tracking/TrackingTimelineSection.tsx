import Image from "next/image";
import { motion } from "motion/react";
import { AlertCircle, Clock, MessageCircle, QrCode } from "lucide-react";
import logoSkull from "@/imports/image-1.png";
import { Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { STEPS, WHATSAPP_URL } from "../tracking";

export function TrackingTimelineSection({
  order,
  current,
  counterServiceMode = false,
  statusLabel,
  statusEta,
  stepTimes,
  showPixPayment,
  pixExpired,
  pixTimeLeft,
  pixCopied,
  onCopyPixCode,
  onSendPaymentProof,
  submittingProof,
  retryingPayment,
  retryPaymentError,
  onRetryPayment,
}: {
  order: Order;
  current: number;
  counterServiceMode?: boolean;
  statusLabel: string;
  statusEta: string;
  stepTimes: string[];
  showPixPayment: boolean;
  pixExpired: boolean;
  pixTimeLeft: number;
  pixCopied: boolean;
  onCopyPixCode: () => void;
  onSendPaymentProof: () => void;
  submittingProof: boolean;
  retryingPayment: boolean;
  retryPaymentError: string;
  onRetryPayment: () => void;
}) {
  const paymentStatus = String(order.paymentStatus ?? "").toLowerCase();
  const paymentFailed =
    [
      "rejected",
      "failed",
      "cancelled",
      "canceled",
      "expired",
      "refunded",
      "charged_back",
    ].includes(paymentStatus) || order.status === "CANCELLED";
  const paymentApproved = paymentStatus === "approved";
  const waitingPayment = order.status === "PAYMENT_PENDING" && !paymentApproved && !paymentFailed;
  const whatsappPayment = order.paymentMethod === "whatsapp";
  const directPixPayment = order.paymentProvider === "menfis_pix";
  const paymentLabel = paymentApproved
    ? "Pagamento aprovado"
    : paymentFailed
      ? "Pagamento não aprovado"
      : "Aguardando pagamento";
  const paymentStatusLabel = paymentApproved
    ? "Pago"
    : ["refunded", "charged_back"].includes(paymentStatus)
      ? "Estornado"
      : paymentFailed
        ? "Cancelado"
        : "Aguardando Pagamento";
  const method = String(order.paymentMethod ?? "").toLowerCase();
  const paymentMethodLabel =
    method === "pix_qrcode" || method === "pix"
      ? "QR Code Pix"
      : method === "mercadopago"
        ? "Mercado Pago"
      : method === "credit_card" || method === "credito"
        ? "Cartão de Crédito Mercado Pago"
        : method === "debit_card" || method === "debito"
          ? "Cartão de Débito Mercado Pago"
          : method === "cartao"
            ? "Cartão Mercado Pago"
        : method === "whatsapp"
          ? "Pagamento pelo WhatsApp"
          : "Pagamento Presencial com Atendente";
  const steps = counterServiceMode ? STEPS.slice(0, 4) : STEPS;
  const displayCurrent = Math.min(current, steps.length - 1);
  const timelineCopy =
    counterServiceMode
      ? order.status === "READY"
        ? "Pedido pronto para servir no balcão."
        : order.status === "DELIVERED"
          ? "Pedido servido no balcão."
          : "Acompanhe a fila do balcão e aguarde o pedido ficar pronto."
      : waitingPayment
      ? whatsappPayment
        ? "Seu pedido foi enviado ao atendimento. A equipe vai chamar no WhatsApp, receber o pagamento e liberar para a cozinha."
        : showPixPayment
          ? "Pague pelo QR Code Pix abaixo. Depois do pagamento, retorne para esta tela para acompanhar a confirmação."
          : "Finalize o pagamento pela forma escolhida. Depois, retorne para esta tela para acompanhar a confirmação."
      : paymentFailed
        ? "Esse pagamento não foi aprovado. Tente novamente para enviar o pedido para a cozinha."
        : order.status === "PAID"
          ? "Pagamento confirmado. Aguardando a cozinha aceitar o pedido no KDS."
          : order.status === "ACCEPTED"
            ? "A cozinha aceitou seu pedido e vai iniciar o preparo."
            : order.status === "IN_PREPARATION"
              ? "Seu pedido está em preparo na cozinha."
              : order.status === "READY"
                ? "Seu pedido está pronto. A equipe vai liberar a entrega."
                : order.status === "OUT_FOR_DELIVERY"
                  ? "Seu pedido saiu para entrega e está a caminho."
                  : order.status === "DELIVERED"
                    ? "Entrega confirmada com segurança. Obrigado por comprar na Menfi's."
                    : order.status === "CANCELLED"
                      ? "Este pedido foi cancelado. Fale com a equipe se precisar."
                      : "Acompanhe aqui a confirmação do pedido.";
  const progressInset = 100 / (steps.length * 2);
  const progressWidth =
    displayCurrent <= 0 ? 0 : (displayCurrent / (steps.length - 1)) * (100 - progressInset * 2);
  const paymentHelpText = encodeURIComponent(
    `Olá, preciso de ajuda com o pagamento do pedido ${order.id}.`,
  );

  return (
    <>
      {(waitingPayment || paymentFailed) && (
        <div
          className="rounded-[24px] p-4 md:p-5"
          style={{
            background: paymentFailed ? "#FEF2F2" : "#FFFBEB",
            border: `1.5px solid ${paymentFailed ? "#FECACA" : "#FDE68A"}`,
            color: paymentFailed ? "#991B1B" : "#92400E",
          }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={22} strokeWidth={2.4} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black uppercase tracking-wide">
                {paymentFailed ? "Pagamento não confirmado" : "Pagamento pendente"}
              </p>
              <p className="mt-1 text-xs font-bold leading-relaxed opacity-75">
                {paymentFailed
                  ? "O pagamento não foi aprovado. Você pode tentar novamente ou escolher outra forma de pagamento."
                  : whatsappPayment
                    ? "O pedido foi criado e está com o atendimento. A equipe vai chamar no WhatsApp para receber e liberar para a cozinha."
                    : "O pedido foi criado, mas ainda não foi pago. Para enviar para a cozinha, finalize o pagamento pela forma que preferir."}
              </p>
              {retryPaymentError && (
                <p className="mt-2 rounded-xl px-3 py-2 text-xs font-black" style={{ background: "#fff" }}>
                  {retryPaymentError}
                </p>
              )}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {!whatsappPayment && !showPixPayment && (
                  <button
                    onClick={onRetryPayment}
                    disabled={retryingPayment}
                    className="rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider disabled:opacity-55"
                    style={{ background: VERDE, color: ROSA }}
                  >
                    {retryingPayment ? "Abrindo pagamento" : "Escolher forma de pagamento"}
                  </button>
                )}
                <a
                  href={`${WHATSAPP_URL}?text=${paymentHelpText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider"
                  style={{ background: "#25D366", color: "#fff", textDecoration: "none" }}
                >
                  <MessageCircle size={16} strokeWidth={2.4} />
                  Falar com atendente
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPixPayment && !pixExpired && (
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
                Aguardando pagamento Pix · {String(Math.floor(pixTimeLeft / 60)).padStart(2, "0")}:{String(pixTimeLeft % 60).padStart(2, "0")}
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: VERDE, opacity: 0.62 }}>
                {directPixPayment
                  ? "Escaneie o QR Code da Menfi's, pague pelo app do banco e envie o comprovante para validação."
                  : "Escaneie o QR Code ou copie o código. Assim que o Mercado Pago aprovar, o pedido entra na fila."}
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
            {directPixPayment && !order.pixQrCodeBase64 && (
              <div
                className="mx-auto flex h-44 w-44 items-center justify-center rounded-2xl p-3"
                style={{ background: "#fff", border: `1px solid ${ROSA}` }}
              >
                <img
                  src="/pix-menfis.png"
                  alt="QR Code Pix Direto Menfi's"
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

      {showPixPayment && pixExpired && (
        <div className="rounded-[24px] p-4 md:p-5" style={{ background: "#FFF1F2", border: `1.5px solid ${ROSA}` }}>
          <p className="text-lg font-black" style={{ color: VERDE }}>Tempo do QR Code encerrado</p>
          <p className="mt-1 text-xs font-bold leading-relaxed" style={{ color: VERDE, opacity: 0.7 }}>
            Escolha outra forma de pagamento ou envie o comprovante Pix para aprovação manual. O pedido só seguirá para produção depois da validação.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button onClick={onRetryPayment} className="rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider" style={{ background: VERDE, color: ROSA }}>
              Escolher outra forma de pagamento
            </button>
            <button onClick={onSendPaymentProof} disabled={submittingProof} className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider disabled:opacity-55" style={{ background: "#25D366", color: "#fff" }}>
              <MessageCircle size={16} strokeWidth={2.4} />
              {submittingProof ? "Registrando..." : "Enviar comprovante pelo WhatsApp"}
            </button>
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
          <div className="hidden h-12 w-12 shrink-0 overflow-hidden rounded-full sm:flex" style={{ background: `${ROSA}55` }}>
            <Image
              src={logoSkull}
              alt=""
              width={48}
              height={48}
              style={{
                display: "block",
                height: "100%",
                width: "100%",
                objectFit: "cover",
                objectPosition: "center",
                mixBlendMode: "multiply",
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-black leading-tight" style={{ color: VERDE }}>
              {statusLabel.includes("preparado") ? "Seu pedido está em preparo!" : statusLabel}
            </p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: VERDE, opacity: 0.62 }}>
              {timelineCopy}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase" style={{ background: "#fff", color: VERDE }}>
                {paymentMethodLabel}
              </span>
              <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase" style={{ background: "#fff", color: VERDE }}>
                {paymentStatusLabel}
              </span>
            </div>
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
          <div className="hidden h-24 w-24 shrink-0 overflow-hidden rounded-full md:flex" style={{ background: `${ROSA}35` }}>
            <Image
              src={logoSkull}
              alt="Menfi's"
              width={96}
              height={96}
              style={{
                display: "block",
                height: "100%",
                width: "100%",
                objectFit: "cover",
                objectPosition: "center",
                mixBlendMode: "multiply",
              }}
            />
          </div>
        </div>

        <div
          className="relative mt-8 grid gap-1"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          <div
            className="absolute top-[30px] h-0.5"
            style={{
              background: "#D9D9D9",
              left: `${progressInset}%`,
              right: `${progressInset}%`,
            }}
          />
          <motion.div
            initial={false}
            animate={{ width: `${Math.max(0, progressWidth)}%` }}
            className="absolute top-[30px] h-0.5"
            style={{ background: "#EF4C86", left: `${progressInset}%` }}
          />
          {steps.map((step, index) => {
            const done = index <= displayCurrent;
            const active = index === displayCurrent;
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
                  {index === 0 ? paymentLabel : step.label}
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
