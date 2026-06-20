import { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowLeft, Clock, CreditCard, Landmark, MessageCircle, Star, X } from "lucide-react";
import logoSkull from "@/imports/image-1.png";
import { Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import {
  API_URL,
  STATUS_COPY,
  STATUS_INDEX,
  STEPS,
  SUPPORT_TOPICS,
  SupportTicket,
  WHATSAPP_URL,
  deliveryConfirmationCode,
  scheduledOrderInfo,
} from "./tracking";
import { TrackingSupportSection } from "./tracking/TrackingSupportSection";
import { TrackingTimelineSection } from "./tracking/TrackingTimelineSection";
import { getOperatingHoursBlockMessage } from "./checkout";

const KIOSK_REVIEWS_KEY = "menfis_kiosk_mob_reviews";

type KioskReview = {
  orderId: string;
  rating: number;
  comment: string;
  at: number;
  customerName: string;
};

function isKioskReview(value: unknown): value is KioskReview {
  if (!value || typeof value !== "object") return false;
  const review = value as Partial<KioskReview>;
  return (
    typeof review.orderId === "string" &&
    typeof review.rating === "number" &&
    typeof review.comment === "string" &&
    typeof review.at === "number" &&
    typeof review.customerName === "string"
  );
}

function sortKioskReviews(reviews: KioskReview[]) {
  return [...reviews].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.comment.length !== a.comment.length) return b.comment.length - a.comment.length;
    return b.at - a.at;
  });
}

function reviewAlreadyDone(reviewKey: string) {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(reviewKey);
  if (!stored) return false;
  if (stored === "done") return true;
  try {
    const parsed = JSON.parse(stored) as { mode?: string };
    return parsed.mode === "done";
  } catch {
    return false;
  }
}

interface Props {
  orderPlaced: boolean;
  orderId?: string;
  order?: Order;
  goHome?: () => void;
  autoReturnMs?: number;
}

export function TrackingScreen({
  orderPlaced,
  orderId,
  order,
  goHome,
  autoReturnMs = 0,
}: Props) {
  const [supportOpen, setSupportOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<(typeof SUPPORT_TOPICS)[number] | null>(null);
  const [supportSent, setSupportSent] = useState("");
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [pixCopied, setPixCopied] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [retryPaymentError, setRetryPaymentError] = useState("");
  const [retryChoiceOpen, setRetryChoiceOpen] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(60);
  const [pixModalOpen, setPixModalOpen] = useState(true);
  const [pixSession, setPixSession] = useState(0);
  const [pixFlowActive, setPixFlowActive] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewHandled, setReviewHandled] = useState(false);
  const [idlePromptOpen, setIdlePromptOpen] = useState(false);
  const [reviewActivityTick, setReviewActivityTick] = useState(0);
  const [kioskReviews, setKioskReviews] = useState<KioskReview[]>([]);
  const current = order ? STATUS_INDEX[order.status] : -1;
  const delayed = order
    ? (Date.now() - order.timestamp) / 60000 > 50 &&
      !["DELIVERED", "CANCELLED"].includes(order.status)
    : false;

  useEffect(() => {
    if (!orderPlaced || !order || !goHome || autoReturnMs <= 0 || order.status === "PAYMENT_PENDING") return;

    const timer = window.setTimeout(() => {
      goHome();
    }, autoReturnMs);

    return () => window.clearTimeout(timer);
  }, [autoReturnMs, goHome, order, orderPlaced]);

  useEffect(() => {
    if (!API_URL || !order?.id) return;

    const syncTickets = async () => {
      try {
        const res = await fetch(
          `${API_URL}/support/tickets/order/${encodeURIComponent(order.id)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        setSupportTickets(await res.json());
      } catch {
        // ticket sync is advisory; main tracking keeps running
      }
    };

    syncTickets();
    const timer = window.setInterval(syncTickets, 30000);
    return () => window.clearInterval(timer);
  }, [order?.id]);

  useEffect(() => {
    setRating(0);
    setReviewComment("");
    setReviewHandled(false);
    setIdlePromptOpen(false);
  }, [order?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const parsed = JSON.parse(localStorage.getItem(KIOSK_REVIEWS_KEY) ?? "[]");
      if (Array.isArray(parsed)) {
        setKioskReviews(sortKioskReviews(parsed.filter(isKioskReview)));
      }
    } catch {
      setKioskReviews([]);
    }
  }, []);

  if (!orderPlaced || !order) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-5 p-8 text-center"
        style={{ minHeight: 420, background: "#fff" }}
      >
        <Image
          src={logoSkull}
          alt="Mascote"
          width={80}
          height={80}
          style={{ mixBlendMode: "multiply", opacity: 0.18 }}
        />
        <div>
          <p
            className="font-black uppercase tracking-widest"
            style={{
              color: VERDE,
              fontFamily: "'Bebas Neue','Arial Black',sans-serif",
              fontSize: "1.1rem",
              letterSpacing: "0.15em",
            }}
          >
            Pedido em sincronização
          </p>
          <p className="text-xs mt-1" style={{ color: VERDE, opacity: 0.45 }}>
            {orderId ? `Buscando ${orderId} no backend` : "Faça um pedido pelo cardápio"}
          </p>
        </div>
        {goHome && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={goHome}
            className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider"
            style={{ background: ROSA, color: VERDE, border: "none", cursor: "pointer" }}
          >
            Ver cardápio
          </motion.button>
        )}
      </div>
    );
  }

  const timeStr = new Date(order.timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const scheduledInfo = scheduledOrderInfo(order);
  const baseStatusCopy = STATUS_COPY[order.status] ?? STATUS_COPY.PAYMENT_PENDING;
  const statusCopy =
    scheduledInfo && ["PAYMENT_PENDING", "PAID"].includes(order.status)
      ? scheduledInfo
      : baseStatusCopy;
  const stepTimes = STEPS.map((_, index) => (index <= current ? timeStr : "-"));
  const canRequestChange = order.status === "PAID";
  const whatsappText = encodeURIComponent(
    `Olá, preciso de ajuda com meu pedido.\n\nPedido: ${order.id}\nStatus atual: ${statusCopy.label}\nGostaria de uma atualização.`,
  );
  const delayedWhatsappText = encodeURIComponent(
    `Olá, meu pedido está atrasado.\n\nPedido: ${order.id}\nStatus atual: ${statusCopy.label}\nGostaria de uma atualização.`,
  );
  const staleTicket = supportTickets.find((ticket) => {
    if (ticket.status === "RESOLVED") return false;
    return Date.now() - new Date(ticket.createdAt).getTime() > 5 * 60000;
  });
  const showPixPayment =
    (order.paymentMethod === "pix" || order.paymentMethod === "pix_qrcode") &&
    order.status === "PAYMENT_PENDING" &&
    Boolean(order.pixQrCode || order.pixQrCodeBase64 || order.pixTicketUrl);
  const pixExpired = pixFlowActive && pixTimeLeft <= 0;
  const paymentProofWhatsappText = encodeURIComponent(
    `Olá, estou enviando o comprovante Pix do pedido ${order.id}.\n\nValor: R$ ${order.total.toFixed(2).replace(".", ",")}\nPedido: ${order.id}`,
  );
  const pixAmount = order.total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const reviewKey = `menfis_review_${order.id}`;
  const showDeliveryReview =
    order.status === "DELIVERED" &&
    !reviewHandled &&
    !reviewAlreadyDone(reviewKey);
  const isKioskMobReview =
    String(order.customerName ?? "").trim().toUpperCase().replace(/_/g, "-") === "KIOSK-MOB";
  const operatingHoursMessage =
    order.deliveryType === "delivery" && !isKioskMobReview ? getOperatingHoursBlockMessage() : "";

  const markReviewActivity = useCallback(() => {
    setIdlePromptOpen(false);
    setReviewActivityTick((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!showDeliveryReview || !isKioskMobReview || !goHome) return;

    const promptTimer = window.setTimeout(() => {
      setIdlePromptOpen(true);
    }, 20000);

    return () => window.clearTimeout(promptTimer);
  }, [goHome, isKioskMobReview, reviewActivityTick, showDeliveryReview]);

  useEffect(() => {
    if (!showDeliveryReview || !isKioskMobReview || !idlePromptOpen || !goHome) return;

    const exitTimer = window.setTimeout(() => {
      goHome();
    }, 10000);

    return () => window.clearTimeout(exitTimer);
  }, [goHome, idlePromptOpen, isKioskMobReview, showDeliveryReview]);

  useEffect(() => {
    if (!showPixPayment) return;
    setPixFlowActive(true);
  }, [order.id, showPixPayment]);

  useEffect(() => {
    if (order.status === "PAYMENT_PENDING") return;
    setPixFlowActive(false);
    setPixModalOpen(false);
  }, [order.status]);

  useEffect(() => {
    if (!pixFlowActive) return;
    setPixModalOpen(true);
    const startedAt = Date.now();
    const updateTimeLeft = () =>
      setPixTimeLeft(Math.max(0, Math.ceil((60_000 - (Date.now() - startedAt)) / 1_000)));
    updateTimeLeft();
    const timer = window.setInterval(updateTimeLeft, 1_000);
    return () => window.clearInterval(timer);
  }, [order.id, pixFlowActive, pixSession]);

  const finishReview = (mode: "done" | "later") => {
    const savedReview: KioskReview = {
      orderId: String(order.id),
      rating,
      comment: reviewComment.trim(),
      at: Date.now(),
      customerName:
        String(order.customerName ?? "").trim() &&
        String(order.customerName ?? "").trim().toUpperCase().replace(/_/g, "-") !== "KIOSK-MOB"
          ? String(order.customerName).trim()
          : `Pedido ${order.id}`,
    };

    try {
      localStorage.setItem(
        reviewKey,
        JSON.stringify({
          mode,
          rating,
          comment: reviewComment.trim(),
          at: Date.now(),
        }),
      );
      if (mode === "done" && rating > 0 && isKioskMobReview) {
        const previous = JSON.parse(localStorage.getItem(KIOSK_REVIEWS_KEY) ?? "[]");
        const next = sortKioskReviews([
          ...(Array.isArray(previous) ? previous.filter(isKioskReview) : []).filter(
            (item) => item.orderId !== savedReview.orderId,
          ),
          savedReview,
        ]);
        localStorage.setItem(KIOSK_REVIEWS_KEY, JSON.stringify(next));
        setKioskReviews(next);
      }
    } catch {
      // A avaliacao local nao bloqueia o retorno ao inicio.
    }
    setReviewHandled(true);
    goHome?.();
  };

  const copyPixCode = async () => {
    if (!order.pixQrCode) return;
    try {
      await navigator.clipboard.writeText(order.pixQrCode);
      setPixCopied(true);
      window.setTimeout(() => setPixCopied(false), 1800);
    } catch {
      setPixCopied(false);
    }
  };

  const retryMercadoPago = async () => {
    if (!order?.id || !API_URL || retryingPayment) return;
    setRetryingPayment(true);
    setRetryPaymentError("");
    try {
      const res = await fetch(`${API_URL}/payments/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json().catch(() => ({}));
      const checkoutUrl =
        typeof data.checkoutUrl === "string" && data.checkoutUrl
          ? data.checkoutUrl
          : typeof data.sandboxCheckoutUrl === "string" && data.sandboxCheckoutUrl
            ? data.sandboxCheckoutUrl
            : "";
      if (!res.ok || !checkoutUrl) {
        throw new Error(data?.error || "checkout_creation_failed");
      }
      localStorage.setItem("menfis_pending_order_id", order.id);
      window.location.assign(checkoutUrl);
    } catch {
      setRetryPaymentError("Não foi possível abrir o Mercado Pago. Tente novamente.");
    } finally {
      setRetryingPayment(false);
    }
  };

  const retryPayment = () => {
    setRetryPaymentError("");
    setRetryChoiceOpen(true);
  };

  const restartPixPayment = () => {
    setRetryPaymentError("");
    setRetryChoiceOpen(false);
    setPixTimeLeft(60);
    setPixFlowActive(true);
    setPixModalOpen(true);
    setPixSession((session) => session + 1);
  };

  const sendPaymentProof = async () => {
    if (submittingProof) return;
    setSubmittingProof(true);
    try {
      const response = API_URL
        ? await fetch(`${API_URL}/orders/${encodeURIComponent(order.id)}/payment-proof`, { method: "POST" })
        : await fetch(`/api/orders/${encodeURIComponent(order.id)}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "PAYMENT_PROOF_PENDING" }),
          });
      if (!response.ok) throw new Error("payment_proof_request_failed");
      window.location.assign(`${WHATSAPP_URL}?text=${paymentProofWhatsappText}`);
    } catch {
      setRetryPaymentError("Não foi possível registrar o comprovante. Tente novamente.");
      setSubmittingProof(false);
    }
  };

  if (showDeliveryReview) {
    return (
      <div
        className="flex min-h-full items-center justify-center px-4 py-6"
        style={{ background: "#fff" }}
        onPointerDown={markReviewActivity}
        onKeyDown={markReviewActivity}
      >
        <div className="w-full max-w-md rounded-[24px] bg-white p-5" style={{ color: VERDE, border: `1.5px solid ${VERDE}12` }}>
          {isKioskMobReview && idlePromptOpen && (
            <div
              className="mb-4 rounded-2xl p-4"
              style={{ background: "#FFF2C8", border: "1.5px solid #D89B22", color: "#8A4B00" }}
            >
              <p className="text-sm font-black uppercase">Tem alguém aí?</p>
              <p className="mt-1 text-xs font-bold opacity-75">
                Se ninguém responder, a tela volta ao cardápio em 10 segundos.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={markReviewActivity}
                  className="rounded-xl px-4 py-3 text-xs font-black uppercase"
                  style={{ background: VERDE, color: ROSA }}
                >
                  Continuar
                </button>
                <button
                  type="button"
                  onClick={goHome}
                  className="rounded-xl px-4 py-3 text-xs font-black uppercase"
                  style={{ background: "#fff", color: "#8A4B00", border: "1px solid #D89B22" }}
                >
                  Voltar ao menu
                </button>
              </div>
            </div>
          )}
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-45">Pedido entregue</p>
          <h2 className="mt-2 text-2xl font-black">Como foi sua experiencia?</h2>
          <div className="mt-5 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  markReviewActivity();
                  setRating(value);
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: value <= rating ? VERDE : "#fff", color: value <= rating ? ROSA : VERDE }}
                aria-label={`${value} estrelas`}
              >
                <Star size={22} fill={value <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <textarea
            value={reviewComment}
            onChange={(event) => {
              markReviewActivity();
              setReviewComment(event.target.value.slice(0, 240));
            }}
            className="mt-5 h-28 w-full resize-none rounded-2xl p-4 text-sm outline-none"
            style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => finishReview("later")}
              className="rounded-2xl px-4 py-3 text-xs font-black uppercase"
              style={{ background: "#fff", color: VERDE }}
            >
              Lembrar depois
            </button>
            <button
              type="button"
              onClick={() => finishReview("done")}
              disabled={rating === 0}
              className="rounded-2xl px-4 py-3 text-xs font-black uppercase disabled:opacity-45"
              style={{ background: VERDE, color: ROSA }}
            >
              Avaliar agora
            </button>
          </div>
          {isKioskMobReview && kioskReviews.length > 0 && (
            <div className="mt-5 border-t pt-4" style={{ borderColor: `${VERDE}14` }}>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-45">
                Avaliacoes do balcao
              </p>
              <div className="mt-3 grid gap-2">
                {kioskReviews.slice(0, 8).map((item) => (
                  <div
                    key={`${item.orderId}-${item.at}`}
                    className="rounded-2xl p-3"
                    style={{ background: "#fff", border: `1px solid ${VERDE}10` }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase">{item.customerName}</p>
                      <p className="text-xs font-black">{item.rating}/5</p>
                    </div>
                    {item.comment && (
                      <p className="mt-1 text-xs leading-relaxed opacity-70">{item.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const createSupportTicket = async (type: string, reason: string) => {
    if (type === "ORDER_CHANGE_REQUEST" && !canRequestChange) {
      setSupportSent("Alterações só podem ser solicitadas antes do preparo começar.");
      setSelectedTopic(null);
      return;
    }
    if (type === "TALK_TO_AGENT") {
      window.open(`${WHATSAPP_URL}?text=${whatsappText}`, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      if (API_URL) {
        await fetch(`${API_URL}/support/tickets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            type,
            reason,
            message: reason,
            customerPhone: order.customerPhone,
          }),
        });
      }
      if (API_URL) {
        const res = await fetch(
          `${API_URL}/support/tickets/order/${encodeURIComponent(order.id)}`,
          { cache: "no-store" },
        );
        if (res.ok) setSupportTickets(await res.json());
      }
      setSupportSent("Solicitação registrada. A equipe Menfi's foi avisada.");
      setSelectedTopic(null);
    } catch {
      setSupportSent("Não consegui registrar agora. Fale direto pelo WhatsApp.");
    }
  };

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#fff" }}>
      <div
        className="relative px-5 pt-5 pb-6 overflow-hidden"
        style={{ background: VERDE, boxShadow: "0 16px 42px rgba(31,61,46,0.18)" }}
      >
        {goHome && (
          <button
            type="button"
            onClick={goHome}
            className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-[11px] font-black uppercase tracking-wider"
            style={{ background: `${ROSA}22`, color: ROSA, border: `1px solid ${ROSA}45` }}
          >
            <ArrowLeft size={15} /> Voltar ao menu
          </button>
        )}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full">
            <Image
              src={logoSkull}
              alt="Menfi's"
              width={56}
              height={56}
              style={{
                display: "block",
                height: "100%",
                width: "100%",
                objectFit: "cover",
                objectPosition: "center",
                mixBlendMode: "screen",
              }}
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${ROSA}70` }}>
              Acompanhe seu pedido
            </p>
            <p
              className="font-black"
              style={{
                color: ROSA,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "2.2rem",
                lineHeight: 1,
                letterSpacing: "0.05em",
              }}
            >
              {order.id}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: `${ROSA}55` }}>
              Hoje · {timeStr}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span
              className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider"
              style={{ background: ROSA, color: VERDE }}
            >
              {statusCopy.label}
            </span>
            <span className="text-[10px] flex items-center gap-1" style={{ color: `${ROSA}75` }}>
              <Clock size={12} strokeWidth={2.3} />
              {statusCopy.eta}
            </span>
          </div>
        </div>
        <div
          className="mt-5 grid gap-2"
          style={{ gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))` }}
        >
          {STEPS.map((step, index) => {
            const done = index <= current;
            const active = index === current;
            return (
              <div key={step.label} className="min-w-0">
                <div
                  className="h-1.5 rounded-full"
                  style={{ background: done ? ROSA : `${ROSA}28` }}
                />
                <p
                  className="mt-1 truncate text-[9px] font-black uppercase tracking-wide"
                  style={{ color: active ? ROSA : `${ROSA}70` }}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 gap-4">
        {operatingHoursMessage && (
          <div
            className="rounded-[22px] p-4 text-xs font-bold leading-relaxed whitespace-pre-line"
            style={{ background: `${ROSA}75`, color: VERDE, border: `1.5px solid ${ROSA}` }}
          >
            {operatingHoursMessage}
          </div>
        )}
        <TrackingTimelineSection
          order={order}
          current={current}
          counterServiceMode={isKioskMobReview}
          statusLabel={statusCopy.label}
          statusEta={statusCopy.eta}
          stepTimes={stepTimes}
          showPixPayment={pixFlowActive && pixExpired}
          pixExpired={pixExpired}
          pixTimeLeft={pixTimeLeft}
          pixCopied={pixCopied}
          onCopyPixCode={copyPixCode}
          onSendPaymentProof={sendPaymentProof}
          submittingProof={submittingProof}
          retryingPayment={retryingPayment}
          retryPaymentError={retryPaymentError}
          onRetryPayment={retryPayment}
        />
        {pixFlowActive && !pixExpired && pixModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[rgba(20,10,14,0.78)] p-4">
            <section className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]" style={{ color: VERDE }}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-55">Pagamento Pix</p>
                <button type="button" onClick={() => setPixModalOpen(false)} className="rounded-xl px-3 py-2 text-xs font-black uppercase" style={{ background: `${ROSA}55`, color: VERDE }}>
                  Voltar
                </button>
              </div>
              <div className="mt-1 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black leading-tight">Escaneie o QR Code</h2>
                  <p className="mt-1 text-xs font-bold leading-relaxed opacity-65">Abra o aplicativo do seu banco e use a opção Pix para escanear este código.</p>
                </div>
                <span className="rounded-xl px-3 py-2 text-lg font-black" style={{ background: `${ROSA}55`, color: "#8A0030" }}>
                  {String(Math.floor(pixTimeLeft / 60)).padStart(2, "0")}:{String(pixTimeLeft % 60).padStart(2, "0")}
                </span>
              </div>
              <div className="mt-4 rounded-2xl p-3" style={{ background: `${ROSA}22`, border: `1px solid ${ROSA}` }}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-55">Valor a pagar</p>
                <p className="mt-1 text-3xl font-black" style={{ color: "#8A0030" }}>{pixAmount}</p>
                <ol className="mt-3 space-y-1 text-xs font-bold leading-relaxed opacity-75">
                  <li>1. Abra o app do seu banco e toque em <strong>Pix</strong>.</li>
                  <li>2. Escolha <strong>Ler QR Code</strong> e escaneie o código abaixo.</li>
                  <li>3. Informe <strong>{pixAmount}</strong> e confirme o pagamento.</li>
                </ol>
              </div>
              <div className="mx-auto mt-4 flex w-full max-w-[250px] items-center justify-center rounded-2xl bg-white p-3" style={{ border: `2px solid ${ROSA}` }}>
                <img
                  src={order.pixQrCodeBase64 ? `data:image/png;base64,${order.pixQrCodeBase64}` : "/pix-menfis.png"}
                  alt="QR Code Pix para pagamento"
                  className="aspect-square w-full object-contain"
                />
              </div>
              {order.pixQrCode && (
                <div className="mt-4">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={copyPixCode}
                    className="w-full rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider"
                    style={{ background: VERDE, color: ROSA, border: "none" }}
                  >
                    {pixCopied ? "Código Pix copiado" : "Copiar código Pix"}
                  </motion.button>
                  <p className="mt-2 text-center text-[10px] font-bold leading-relaxed opacity-60">Ao colar no app do banco, informe o valor de {pixAmount}.</p>
                </div>
              )}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={sendPaymentProof} disabled={submittingProof} className="rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider disabled:opacity-55" style={{ background: "#25D366", color: "#fff" }}>
                  {submittingProof ? "Registrando..." : "Enviar comprovante"}
                </button>
                <button type="button" onClick={() => { setPixModalOpen(false); setRetryChoiceOpen(true); }} className="rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider" style={{ background: VERDE, color: ROSA }}>
                  Retornar ao pagamento
                </button>
              </div>
              <p className="mt-4 text-center text-[11px] font-bold leading-relaxed opacity-60">Após o prazo, você poderá escolher outra forma de pagamento ou enviar o comprovante pelo WhatsApp.</p>
            </section>
          </div>
        )}
        {retryChoiceOpen && (
          <div
            className="fixed inset-0 z-[120] flex items-end justify-center bg-[rgba(101,0,31,0.45)] p-3 sm:items-center"
            onClick={() => setRetryChoiceOpen(false)}
          >
            <section
              className="w-full max-w-md rounded-[26px] bg-white p-5 shadow-[0_24px_70px_rgba(101,0,31,0.28)]"
              style={{ color: VERDE }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-55">
                    Pagamento
                  </p>
                  <h3 className="mt-1 text-xl font-black uppercase leading-tight">
                    Como deseja pagar?
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRetryChoiceOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${ROSA}66`, color: VERDE }}
                  aria-label="Fechar opções de pagamento"
                >
                  <X size={19} strokeWidth={2.7} />
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <a
                  href={`${WHATSAPP_URL}?text=${whatsappText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[78px] items-center gap-4 rounded-2xl p-4 text-left"
                  style={{ border: `2px solid ${ROSA}`, color: VERDE, textDecoration: "none" }}
                >
                  <MessageCircle size={25} strokeWidth={2.5} />
                  <span>
                    <span className="block text-sm font-black uppercase">Pagar pelo WhatsApp</span>
                    <span className="mt-1 block text-xs font-bold opacity-65">Escolha a forma de pagamento com um atendente.</span>
                  </span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setRetryChoiceOpen(false);
                    void retryMercadoPago();
                  }}
                  disabled={retryingPayment}
                  className="flex min-h-[78px] items-center gap-4 rounded-2xl p-4 text-left disabled:opacity-55"
                  style={{ border: `2px solid ${ROSA}`, color: VERDE }}
                >
                  <CreditCard size={25} strokeWidth={2.5} />
                  <span>
                    <span className="block text-sm font-black uppercase">Mercado Pago</span>
                    <span className="mt-1 block text-xs font-bold opacity-65">Reabrir pagamento automático.</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    restartPixPayment();
                  }}
                  className="flex min-h-[78px] items-center gap-4 rounded-2xl p-4 text-left"
                  style={{ border: `2px solid ${ROSA}`, color: VERDE }}
                >
                  <Landmark size={25} strokeWidth={2.5} />
                  <span>
                    <span className="block text-sm font-black uppercase">PIX Direto Menfi's</span>
                    <span className="mt-1 block text-xs font-bold opacity-65">Abrir um novo QR Code Pix nesta mesma tela.</span>
                  </span>
                </button>
              </div>
            </section>
          </div>
        )}
        {isKioskMobReview ? (
          <div className="rounded-[22px] p-4" style={{ background: "#fff", border: `1.5px solid ${ROSA}` }}>
            <p className="text-sm font-black" style={{ color: VERDE }}>Controle da fila</p>
            <p className="mt-1 text-[11px] leading-relaxed" style={{ color: VERDE, opacity: 0.62 }}>
              Use este código para chamar a pessoa no balcão quando o pedido ficar pronto.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-3" style={{ background: "#fff", border: `1px solid ${VERDE}12` }}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-45">Pedido</p>
                <p className="mt-1 text-2xl font-black">{order.id}</p>
              </div>
              <div className="rounded-2xl p-3" style={{ background: `${ROSA}55`, border: `1.5px solid ${VERDE}` }}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Código</p>
                <p className="mt-1 text-2xl font-black tracking-widest">{deliveryConfirmationCode(order)}</p>
              </div>
            </div>
          </div>
        ) : (
          <TrackingSupportSection
            order={order}
            delayed={delayed}
            staleTicket={staleTicket}
            whatsappText={whatsappText}
            delayedWhatsappText={delayedWhatsappText}
            supportSent={supportSent}
            supportOpen={supportOpen}
            selectedTopic={selectedTopic}
            canRequestChange={canRequestChange}
            setSupportOpen={setSupportOpen}
            setSelectedTopic={setSelectedTopic}
            setSupportSent={setSupportSent}
            createSupportTicket={createSupportTicket}
          />
        )}
      </div>
    </div>
  );
}
