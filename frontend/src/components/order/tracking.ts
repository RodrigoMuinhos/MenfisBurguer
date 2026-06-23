import { Bike, CheckCircle2, ChefHat, Clock3, Home, PackageCheck } from "lucide-react";
import { Order, OrderStatus } from "@/types/order";

export const WHATSAPP_URL = "https://wa.me/5585997883764";
export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export const STEPS = [
  { icon: Clock3, label: "Pedido recebido" },
  { icon: CheckCircle2, label: "Pedido aceito" },
  { icon: ChefHat, label: "Em preparo" },
  { icon: PackageCheck, label: "Pronto" },
  { icon: Bike, label: "Saiu para entrega" },
  { icon: Home, label: "Entregue" },
];

export const STATUS_INDEX: Record<OrderStatus, number> = {
  CREATED: 0,
  PAYMENT_PENDING: 0,
  PAYMENT_PROOF_PENDING: 0,
  PAID: 0,
  ACCEPTED: 1,
  IN_PREPARATION: 2,
  READY: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  CANCELLED: 0,
};

export const STATUS_COPY: Record<
  OrderStatus,
  { label: string; copy: string; eta: string }
> = {
  CREATED: {
    label: "Pedido criado",
    copy: "Estamos aguardando o inicio do pagamento.",
    eta: "Aguardando pagamento",
  },
  PAYMENT_PENDING: {
    label: "Aguardando pagamento",
    copy: "Seu pedido foi criado e aguarda a confirmação da forma de pagamento escolhida.",
    eta: "Pague para enviar",
  },
  PAYMENT_PROOF_PENDING: {
    label: "Aguardando aprovação do comprovante",
    copy: "Recebemos a solicitação de validação. Seu pedido seguirá para produção após a aprovação manual.",
    eta: "Em validação",
  },
  PAID: {
    label: "Aguardando confirmação do restaurante",
    copy: "Seu pagamento foi confirmado. O pedido só entra em preparo depois que a administração ou a cozinha aceitar.",
    eta: "Aguardando confirmação",
  },
  ACCEPTED: {
    label: "Pedido aceito",
    copy: "A cozinha aceitou seu pedido e vai iniciar o preparo.",
    eta: "20-25 min",
  },
  IN_PREPARATION: {
    label: "Seu pedido esta sendo preparado",
    copy: "A cozinha recebeu seu pedido pelo KDS e iniciou o preparo.",
    eta: "20-25 min",
  },
  READY: {
    label: "Pedido pronto",
    copy: "A cozinha concluiu a producao. Aguardando liberacao manual para entrega.",
    eta: "15-20 min",
  },
  OUT_FOR_DELIVERY: {
    label: "Seu pedido saiu para entrega",
    copy: "O entregador esta a caminho do seu endereco.",
    eta: "10-15 min",
  },
  DELIVERED: {
    label: "Pedido entregue",
    copy: "Obrigado pelo pedido. Bom apetite!",
    eta: "Entregue",
  },
  CANCELLED: {
    label: "Pedido cancelado",
    copy: "Este pedido foi cancelado. Fale com o atendimento se precisar.",
    eta: "Cancelado",
  },
};

export const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

export function scheduledOrderInfo(order: Order) {
  const address = order.customerAddress ?? "";
  const scheduled = address.match(/PEDIDO AGENDADO: preparar para entrega as ([0-9:]+)/i);
  if (scheduled?.[1]) {
    return {
      time: scheduled[1],
      label: "Pedido agendado",
      copy: `Seu pedido será preparado para entrega às ${scheduled[1]}.`,
      eta: `Entrega às ${scheduled[1]}`,
    };
  }
  if (/PEDIDO ANTECIPADO/i.test(address)) {
    return {
      time: "18:30",
      label: "Pedido agendado",
      copy: "Seu pedido será preparado assim que abrirmos, às 18:30.",
      eta: "Entrega a partir das 18:30",
    };
  }
  return null;
}

export function deliveryConfirmationCode(order: Order) {
  if (order.deliveryCode) return order.deliveryCode;
  const seed = Number(order.number || order.id.replace(/\D/g, "") || Date.now());
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const a = letters[seed % letters.length];
  const b = letters[Math.floor(seed / letters.length) % letters.length];
  const digits = String((seed * 73 + 19) % 100).padStart(2, "0");
  return `${a}${b}${digits}`;
}

export const SUPPORT_TOPICS = [
  {
    type: "SUPPORT_PAYMENT",
    label: "Problema com pagamento",
    icon: "💳",
    reasons: [
      "Meu PIX foi pago mas nao confirmou",
      "Meu cartao foi cobrado",
      "Pagamento recusado",
      "Outro problema de pagamento",
    ],
  },
  {
    type: "SUPPORT_DELIVERY",
    label: "Problema na entrega",
    icon: "🚴",
    reasons: [
      "Entregador nao chegou",
      "Endereco incorreto",
      "Nao consigo localizar o entregador",
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
    reasons: ["Remover ingrediente", "Adicionar observacao", "Trocar bebida", "Outra alteracao"],
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

export type SupportTicket = {
  id: string;
  orderId: string;
  type: string;
  reason: string;
  status: string;
  createdAt: string;
};

export function paymentInfo(order: Order) {
  const status = (order.paymentStatus ?? "not_required").toLowerCase();
  const onlinePayment =
    order.paymentProvider === "mercado_pago" ||
    order.paymentProvider === "MERCADO_PAGO" ||
    order.paymentMethod === "pix" ||
    order.paymentMethod === "cartao";
  if (order.paymentMethod === "pagar_na_entrega") {
    return {
      label: "Pagamento na entrega",
      copy: "O pedido foi confirmado. O pagamento sera feito no recebimento.",
      color: "#92400E",
      bg: "#FFFBEB",
      border: "#FDE68A",
    };
  }
  if (order.paymentMethod === "whatsapp") {
    return {
      label: "Pagamento por WhatsApp",
      copy: "O atendimento vai combinar o pagamento e liberar o pedido para a cozinha.",
      color: "#065F46",
      bg: "#ECFDF5",
      border: "#6EE7B7",
    };
  }
  if (order.paymentProvider === "menfis_pix" || status === "awaiting_direct_pix") {
    return {
      label: "Aguardando Pix Direto",
      copy: "Pague pelo QR Code da Menfi's e envie o comprovante para validacao.",
      color: "#92400E",
      bg: "#FFFBEB",
      border: "#FDE68A",
    };
  }
  const rejected = ["rejected", "cancelled", "refunded", "charged_back"].includes(status);
  const approved = status === "approved";
  const pending =
    onlinePayment &&
    !approved &&
    !rejected &&
    order.status !== "CANCELLED" &&
    order.status !== "DELIVERED";

  if (approved) {
    return {
      label: "Pagamento aprovado",
      copy: "Mercado Pago confirmou o pagamento automaticamente.",
      color: "#065F46",
      bg: "#ECFDF5",
      border: "#6EE7B7",
    };
  }

  if (rejected || order.status === "CANCELLED") {
    return {
      label: "Pagamento nao aprovado",
      copy: "O Mercado Pago nao liberou este pagamento.",
      color: "#991B1B",
      bg: "#FEF2F2",
      border: "#FECACA",
    };
  }

  if (pending) {
    return {
      label: "Aguardando Mercado Pago",
      copy: "Assim que o pagamento for confirmado, o pedido segue para preparo.",
      color: "#92400E",
      bg: "#FFFBEB",
      border: "#FDE68A",
    };
  }

  return {
    label: "Pagamento nao necessario",
    copy: "Este pedido nao depende de pagamento online.",
    color: "#4B5563",
    bg: "#F3F4F6",
    border: "#E5E7EB",
  };
}
