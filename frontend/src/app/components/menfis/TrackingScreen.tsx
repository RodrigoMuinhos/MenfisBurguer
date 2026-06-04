import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  Bike,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  Clock,
  CreditCard,
  Home,
  MessageCircle,
  QrCode,
  X,
} from "lucide-react";
import logoSkull from "@/imports/image-1.png";
import { VERDE, ROSA, Order, OrderStatus } from "./types";

const WHATSAPP_URL = "https://wa.me/5585997254989";
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

const STEPS = [
  { icon: CheckCircle2, label: "Pedido recebido" },
  { icon: CreditCard, label: "Pagamento aprovado" },
  { icon: ChefHat, label: "Em preparo" },
  { icon: Bike, label: "Saiu para entrega" },
  { icon: Home, label: "Entregue" },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  aguardando_pagamento: 0,
  pagamento_recusado: 0,
  recebido: 1,
  preparo: 2,
  pronto: 2,
  saiu_entrega: 3,
  entregue: 4,
  cancelado: 0,
};

const STATUS_COPY: Record<
  OrderStatus,
  { label: string; copy: string; eta: string }
> = {
  aguardando_pagamento: {
    label: "Aguardando pagamento",
    copy: "Confirme o pagamento no Mercado Pago. Assim que aprovar, o pedido entra na fila.",
    eta: "25-45 min após aprovação",
  },
  pagamento_recusado: {
    label: "Pagamento não aprovado",
    copy: "O Mercado Pago não confirmou este pagamento. Fale com o atendimento para refazer.",
    eta: "Aguardando atendimento",
  },
  recebido: {
    label: "Pagamento aprovado",
    copy: "Recebemos seu pedido e ele já entrou na fila da Menfi's.",
    eta: "25-45 min",
  },
  preparo: {
    label: "Seu pedido está sendo preparado",
    copy: "O burger está na chapa e o pedido está em andamento.",
    eta: "20-35 min",
  },
  pronto: {
    label: "Pedido pronto para sair",
    copy: "Estamos organizando a saída para entrega.",
    eta: "15-25 min",
  },
  saiu_entrega: {
    label: "Seu pedido saiu para entrega",
    copy: "O entregador está a caminho do seu endereço.",
    eta: "10-20 min",
  },
  entregue: {
    label: "Pedido entregue",
    copy: "Obrigado pelo pedido. Bom apetite!",
    eta: "Entregue",
  },
  cancelado: {
    label: "Pedido cancelado",
    copy: "Este pedido foi cancelado. Fale com o atendimento se precisar.",
    eta: "Cancelado",
  },
};

const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

const SUPPORT_TOPICS = [
  {
    type: "SUPPORT_PAYMENT",
    label: "Problema com pagamento",
    icon: "💳",
    reasons: [
      "Meu PIX foi pago mas não confirmou",
      "Meu cartão foi cobrado",
      "Pagamento recusado",
      "Outro problema de pagamento",
    ],
  },
  {
    type: "SUPPORT_DELIVERY",
    label: "Problema na entrega",
    icon: "🚴",
    reasons: [
      "Entregador não chegou",
      "Endereço incorreto",
      "Não consigo localizar o entregador",
      "Outro problema na entrega",
    ],
  },
  {
    type: "ORDER_DELAYED",
    label: "Pedido atrasado",
    icon: "⏰",
    reasons: ["Meu pedido passou do prazo estimado"],
  },
  {
    type: "ORDER_CHANGE_REQUEST",
    label: "Alterar pedido",
    icon: "✏️",
    reasons: ["Remover ingrediente", "Adicionar observação", "Trocar bebida", "Outra alteração"],
  },
  {
    type: "CANCEL_REQUEST",
    label: "Cancelar pedido",
    icon: "❌",
    reasons: ["Quero cancelar meu pedido"],
  },
  {
    type: "TALK_TO_AGENT",
    label: "Falar com atendente",
    icon: "📞",
    reasons: ["Quero falar com a equipe"],
  },
] as const;

type SupportTicket = {
  id: string;
  orderId: string;
  type: string;
  reason: string;
  status: string;
  createdAt: string;
};

function paymentInfo(order: Order) {
  const status = (order.paymentStatus ?? "not_required").toLowerCase();
  const rejected = ["rejected", "cancelled", "refunded", "charged_back"].includes(status);
  const approved =
    status === "approved" ||
    !["aguardando_pagamento", "pagamento_recusado", "cancelado"].includes(order.status);
  const pending = order.paymentProvider === "mercado_pago" && !approved && !rejected;

  if (approved) {
    return {
      label: "Pagamento aprovado",
      copy: "Mercado Pago confirmou o pagamento automaticamente.",
      color: "#065F46",
      bg: "#ECFDF5",
      border: "#6EE7B7",
    };
  }

  if (rejected || order.status === "pagamento_recusado") {
    return {
      label: "Pagamento não aprovado",
      copy: "O Mercado Pago não liberou este pagamento.",
      color: "#991B1B",
      bg: "#FEF2F2",
      border: "#FECACA",
    };
  }

  if (pending) {
    return {
      label: "Pagamento pendente",
      copy: "Aguardando confirmação do Mercado Pago. A tela atualiza sozinha.",
      color: "#92400E",
      bg: "#FFFBEB",
      border: "#FDE68A",
    };
  }

  return {
    label: "Pagamento no atendimento",
    copy: "Pedido criado sem cobrança online vinculada.",
    color: VERDE,
    bg: `${VERDE}08`,
    border: `${VERDE}18`,
  };
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
  const current = order ? STATUS_INDEX[order.status] : -1;

  useEffect(() => {
    if (!orderPlaced || !order || !goHome || autoReturnMs <= 0) return;

    const timer = window.setTimeout(() => {
      goHome();
    }, autoReturnMs);

    return () => window.clearTimeout(timer);
  }, [autoReturnMs, goHome, order, orderPlaced]);

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
  const statusCopy = STATUS_COPY[order.status];
  const stepTimes = STEPS.map((_, index) => (index <= current ? timeStr : "-"));
  const canRequestChange = order.status === "recebido";
  const delayed = useMemo(() => {
    const elapsedMinutes = (Date.now() - order.timestamp) / 60000;
    return elapsedMinutes > 50 && !["entregue", "cancelado"].includes(order.status);
  }, [order.status, order.timestamp]);
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

  useEffect(() => {
    if (!API_URL || !order.id) return;

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
  }, [order.id]);

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
        <div
          className="rounded-[24px] p-4 md:p-5"
          style={{
            background: "#fff",
            border: `1.5px solid ${ROSA}`,
            boxShadow: "0 18px 48px rgba(101,0,31,0.08)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full sm:flex"
              style={{ background: `${ROSA}55` }}
            >
              <Image src={logoSkull} alt="" width={36} height={36} style={{ mixBlendMode: "multiply" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-black leading-tight" style={{ color: VERDE }}>
                {statusCopy.label.includes("preparado")
                  ? "Seu pedido está em preparo!"
                  : statusCopy.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: VERDE, opacity: 0.62 }}>
                Estamos caprichando no seu pedido. Assim que sair para entrega, você acompanha tudo por aqui.
              </p>
              <div className="mt-5 flex items-start gap-2">
                <Clock size={17} strokeWidth={2.1} style={{ color: VERDE, opacity: 0.45 }} />
                <div>
                  <p className="text-xs" style={{ color: VERDE, opacity: 0.55 }}>
                    Entrega estimada
                  </p>
                  <p className="text-2xl font-black leading-none" style={{ color: "#EF4C86" }}>
                    {statusCopy.eta}
                  </p>
                </div>
              </div>
            </div>
            <div
              className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-full md:flex"
              style={{ background: `${ROSA}35` }}
            >
              <Image src={logoSkull} alt="Menfi's" width={78} height={78} style={{ mixBlendMode: "multiply" }} />
            </div>
          </div>

          <div className="relative mt-8 grid grid-cols-5 gap-1">
            <div
              className="absolute left-[10%] right-[10%] top-[30px] h-0.5"
              style={{ background: "#D9D9D9" }}
            />
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
                  {active && (
                    <span
                      className="mb-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
                      style={{ background: `${ROSA}80`, color: "#EF4C86" }}
                    >
                      Atual
                    </span>
                  )}
                  {!active && <span className="mb-1 h-[18px]" />}
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

        {delayed && (
          <div
            className="rounded-2xl p-4"
            style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A" }}
          >
            <p className="text-sm font-black" style={{ color: "#92400E" }}>
              Seu pedido está demorando mais que o esperado.
            </p>
            <p className="text-[11px] mt-1" style={{ color: "#92400E", opacity: 0.72 }}>
              Nossa equipe já foi notificada. Você também pode falar diretamente com a Menfi's.
            </p>
            <a
              href={`${WHATSAPP_URL}?text=${delayedWhatsappText}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider"
              style={{ background: VERDE, color: ROSA }}
            >
              <MessageCircle size={15} strokeWidth={2.5} />
              Falar com a Menfi's
            </a>
          </div>
        )}

        {staleTicket && (
          <div
            className="rounded-2xl p-4"
            style={{ background: "#FEF2F2", border: "1.5px solid #FECACA" }}
          >
            <p className="text-sm font-black" style={{ color: "#991B1B" }}>
              Sua solicitação ainda está pendente.
            </p>
            <p className="text-[11px] mt-1" style={{ color: "#991B1B", opacity: 0.72 }}>
              Para agilizar, fale diretamente com a equipe pelo WhatsApp.
            </p>
            <a
              href={`${WHATSAPP_URL}?text=${whatsappText}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider"
              style={{ background: VERDE, color: ROSA }}
            >
              <MessageCircle size={15} strokeWidth={2.5} />
              Falar diretamente com a equipe
            </a>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div
            className="rounded-[22px] p-4"
            style={{ background: "#fff", border: `1.5px solid ${ROSA}`, boxShadow: "0 14px 36px rgba(31,61,46,0.07)" }}
          >
            <p className="text-sm font-black" style={{ color: VERDE }}>
              Acompanhe sua entrega em tempo real
            </p>
            <p className="mt-1 text-[11px] leading-relaxed" style={{ color: VERDE, opacity: 0.58 }}>
              Assim que sair para entrega, você verá o entregador no mapa e o tempo estimado até você.
            </p>
            <div
              className="relative mt-4 h-32 overflow-hidden rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, #F7F7F7 25%, #FFFFFF 25%, #FFFFFF 50%, #F7F7F7 50%, #F7F7F7 75%, #FFFFFF 75%)",
                backgroundSize: "42px 42px",
              }}
            >
              <div className="absolute left-10 top-12 h-0.5 w-[72%] border-t-2 border-dashed" style={{ borderColor: "#EF4C86" }} />
              <div className="absolute left-8 top-8 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: ROSA }}>
                <Image src={logoSkull} alt="" width={34} height={34} style={{ mixBlendMode: "multiply" }} />
              </div>
              <div className="absolute right-7 top-12 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "#EF4C86", color: "#fff" }}>
                <Home size={18} strokeWidth={2.5} />
              </div>
              <div className="absolute left-1/2 top-14 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-white" style={{ color: VERDE, boxShadow: "0 8px 18px rgba(0,0,0,0.12)" }}>
                <Bike size={16} strokeWidth={2.5} />
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-xl px-4 py-2 text-center" style={{ background: `${ROSA}85`, color: VERDE }}>
                <p className="text-[10px] font-bold">Previsão de chegada</p>
                <p className="text-lg font-black leading-none">12 min</p>
              </div>
            </div>
          </div>

          <div
            className="rounded-[22px] p-4"
            style={{ background: "#fff", border: `1.5px solid ${ROSA}`, boxShadow: "0 14px 36px rgba(31,61,46,0.07)" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black" style={{ color: VERDE }}>
                  Precisa de ajuda?
                </p>
                <p className="mt-1 text-[11px]" style={{ color: VERDE, opacity: 0.58 }}>
                  Escolha uma opção abaixo para falar com a gente.
                </p>
              </div>
              <button
                onClick={() => {
                  setSupportOpen(true);
                  setSelectedTopic(null);
                  setSupportSent("");
                }}
                className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider"
                style={{ background: `${ROSA}70`, color: VERDE }}
              >
                SAC
              </button>
            </div>
            {supportSent && (
              <p className="text-[11px] font-bold mt-3" style={{ color: "#065F46" }}>
                {supportSent}
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {SUPPORT_TOPICS.slice(0, 6).map((topic) => (
                <button
                  key={topic.type}
                  onClick={() => {
                    if (topic.type === "TALK_TO_AGENT") {
                      createSupportTicket(topic.type, topic.reasons[0]);
                    } else {
                      setSupportOpen(true);
                      setSelectedTopic(topic);
                    }
                  }}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-[11px] font-bold"
                  style={{ background: "#fff", border: `1px solid ${ROSA}`, color: VERDE }}
                >
                  <span>{topic.icon}</span>
                  {topic.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="rounded-[22px] p-4"
          style={{ background: `linear-gradient(90deg, ${ROSA}55, #fff)`, border: `1.5px solid ${ROSA}` }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "#EF4C86", color: "#fff" }}>
                <MessageCircle size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-black" style={{ color: VERDE }}>
                  Fale direto com a Menfi's
                </p>
                <p className="text-[11px]" style={{ color: VERDE, opacity: 0.58 }}>
                  Nossa equipe está pronta para te atender.
                </p>
              </div>
            </div>
            <a
              href={`${WHATSAPP_URL}?text=${whatsappText}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black"
              style={{ background: "#EF4C86", color: "#fff" }}
            >
              <MessageCircle size={20} strokeWidth={2.5} />
              Chamar no WhatsApp
            </a>
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: pay.bg, border: `1.5px solid ${pay.border}` }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fff", color: pay.color }}>
              {pay.label.includes("não") ? <AlertCircle size={18} strokeWidth={2.3} /> : <PayIcon size={18} strokeWidth={2.3} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black uppercase tracking-wide" style={{ color: pay.color }}>
                {pay.label}
              </p>
              <p className="text-[11px] leading-relaxed mt-1" style={{ color: pay.color, opacity: 0.72 }}>
                {pay.copy}
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-4"
          style={{ background: "#fff", border: `1.5px solid ${ROSA}`, boxShadow: "0 14px 36px rgba(31,61,46,0.07)" }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: VERDE, opacity: 0.4 }}>
            Itens do pedido
          </p>
          {order.items.map((item, i) => (
            <div
              key={`${item.id}-${i}`}
              className="flex justify-between py-2"
              style={{ borderBottom: i < order.items.length - 1 ? `1px solid ${ROSA}` : "none" }}
            >
              <span className="text-xs" style={{ color: VERDE }}>
                {item.qty}x {item.name}
              </span>
              <span className="text-xs font-bold" style={{ color: VERDE }}>
                {fmt(item.price * item.qty)}
              </span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3 mt-1" style={{ borderTop: `1px solid ${ROSA}` }}>
            <span className="text-sm font-black uppercase tracking-wider" style={{ color: VERDE }}>
              Total
            </span>
            <span
              className="font-black"
              style={{ color: VERDE, fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: "1.4rem" }}
            >
              {fmt(order.total)}
            </span>
          </div>
        </div>

        {goHome && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={goHome}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-widest"
            style={{
              background: ROSA,
              color: VERDE,
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              letterSpacing: "0.18em",
            }}
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
            Voltar ao cardápio
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {supportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ background: "rgba(0,0,0,0.42)" }}
            onClick={() => setSupportOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="w-full rounded-t-[28px] p-5"
              style={{ background: "#fff", maxHeight: "82vh", overflowY: "auto" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <p className="text-lg font-black" style={{ color: VERDE }}>
                    Como podemos ajudar?
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: VERDE, opacity: 0.55 }}>
                    Pedido {order.id} · {statusCopy.label}
                  </p>
                </div>
                <button
                  onClick={() => setSupportOpen(false)}
                  className="rounded-full flex items-center justify-center"
                  style={{ width: 38, height: 38, background: `${VERDE}08`, color: VERDE, border: "none" }}
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              {!selectedTopic ? (
                <div className="flex flex-col gap-2">
                  {SUPPORT_TOPICS.map((topic) => (
                    <button
                      key={topic.type}
                      onClick={() => setSelectedTopic(topic)}
                      disabled={topic.type === "ORDER_CHANGE_REQUEST" && !canRequestChange}
                      className="w-full flex items-center gap-3 rounded-2xl px-4 py-4 text-left"
                      style={{
                        background: "#FFF8F2",
                        border: `1px solid ${ROSA}`,
                        color: VERDE,
                        opacity: topic.type === "ORDER_CHANGE_REQUEST" && !canRequestChange ? 0.45 : 1,
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{topic.icon}</span>
                      <span className="flex-1">
                        <span className="block font-black text-sm">{topic.label}</span>
                        {topic.type === "ORDER_CHANGE_REQUEST" && !canRequestChange && (
                          <span className="block text-[10px] mt-1" style={{ opacity: 0.7 }}>
                            Disponível apenas antes do preparo.
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                  <a
                    href={`${WHATSAPP_URL}?text=${whatsappText}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 rounded-2xl px-4 py-4 font-black text-xs uppercase tracking-wider"
                    style={{ background: VERDE, color: ROSA }}
                  >
                    <MessageCircle size={16} strokeWidth={2.5} />
                    WhatsApp Menfi's
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="self-start text-xs font-black uppercase tracking-wider"
                    style={{ color: VERDE, background: "transparent", border: "none" }}
                  >
                    Voltar
                  </button>
                  <p className="font-black mb-1" style={{ color: VERDE }}>
                    {selectedTopic.icon} {selectedTopic.label}
                  </p>
                  {selectedTopic.reasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => createSupportTicket(selectedTopic.type, reason)}
                      className="w-full rounded-2xl px-4 py-4 text-left text-sm font-bold"
                      style={{ background: "#FFF8F2", border: `1px solid ${ROSA}`, color: VERDE }}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
