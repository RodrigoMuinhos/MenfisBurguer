import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Clock, CreditCard, QrCode } from "lucide-react";
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
  paymentInfo,
} from "./tracking";
import { TrackingOrderDetails } from "./tracking/TrackingOrderDetails";
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
  const pay = paymentInfo(order);
  const PayIcon = order.paymentMethod === "pix" ? QrCode : CreditCard;
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
        <TrackingOrderDetails
          order={order}
          pay={pay}
          PayIcon={PayIcon}
          goHome={goHome}
        />
      </div>
    </div>
  );
}
