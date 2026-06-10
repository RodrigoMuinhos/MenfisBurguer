import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Clock, Star } from "lucide-react";
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
} from "./tracking";
import { TrackingSupportSection } from "./tracking/TrackingSupportSection";
import { TrackingTimelineSection } from "./tracking/TrackingTimelineSection";

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
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewHandled, setReviewHandled] = useState(false);
  const current = order ? STATUS_INDEX[order.status] : -1;
  const delayed = order
    ? (Date.now() - order.timestamp) / 60000 > 50 &&
      !["DELIVERED", "CANCELLED"].includes(order.status)
    : false;

  useEffect(() => {
    if (!orderPlaced || !order || !goHome || autoReturnMs <= 0) return;

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
  }, [order?.id]);

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
  const statusCopy = STATUS_COPY[order.status] ?? STATUS_COPY.PAYMENT_PENDING;
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
    order.paymentMethod === "pix" &&
    order.status === "PAYMENT_PENDING" &&
    Boolean(order.pixQrCode || order.pixQrCodeBase64 || order.pixTicketUrl);
  const reviewKey = `menfis_review_${order.id}`;
  const showDeliveryReview =
    order.status === "DELIVERED" &&
    !reviewHandled &&
    typeof window !== "undefined" &&
    localStorage.getItem(reviewKey) !== "done";

  const finishReview = (mode: "done" | "later") => {
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

  const retryPayment = async () => {
    if (!order?.id || !API_URL || retryingPayment) return;
    setRetryingPayment(true);
    setRetryPaymentError("");
    try {
      const res = await fetch(`${API_URL}/payments/pix`, {
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

  if (showDeliveryReview) {
    return (
      <div className="flex min-h-full items-center justify-center px-4 py-6" style={{ background: "#FFF8F2" }}>
        <div className="w-full max-w-md rounded-[24px] bg-white p-5" style={{ color: VERDE, border: `1.5px solid ${VERDE}12` }}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-45">Pedido entregue</p>
          <h2 className="mt-2 text-2xl font-black">Como foi sua experiencia?</h2>
          <div className="mt-5 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: value <= rating ? VERDE : "#FFF8F2", color: value <= rating ? ROSA : VERDE }}
                aria-label={`${value} estrelas`}
              >
                <Star size={22} fill={value <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          <textarea
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value.slice(0, 240))}
            className="mt-5 h-28 w-full resize-none rounded-2xl p-4 text-sm outline-none"
            style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => finishReview("later")}
              className="rounded-2xl px-4 py-3 text-xs font-black uppercase"
              style={{ background: "#FFF8F2", color: VERDE }}
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
    <div className="flex flex-col min-h-full" style={{ background: "#FFF8F2" }}>
      <div
        className="relative px-5 pt-5 pb-6 overflow-hidden"
        style={{ background: VERDE, boxShadow: "0 16px 42px rgba(31,61,46,0.18)" }}
      >
        <div className="flex items-center gap-4">
          <Image
            src={logoSkull}
            alt="Menfi's"
            width={56}
            height={56}
            style={{ mixBlendMode: "screen" }}
          />
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
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 gap-4">
        <TrackingTimelineSection
          order={order}
          current={current}
          statusLabel={statusCopy.label}
          statusEta={statusCopy.eta}
          stepTimes={stepTimes}
          showPixPayment={showPixPayment}
          pixCopied={pixCopied}
          onCopyPixCode={copyPixCode}
          retryingPayment={retryingPayment}
          retryPaymentError={retryPaymentError}
          onRetryPayment={retryPayment}
        />
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
      </div>
    </div>
  );
}
