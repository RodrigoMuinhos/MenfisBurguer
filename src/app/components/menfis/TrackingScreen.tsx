import { useEffect } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import {
  CheckCircle2,
  ChefHat,
  Package,
  Bike,
  Store,
  ChevronLeft,
  CreditCard,
  QrCode,
  AlertCircle,
} from "lucide-react";
import logoSkull from "@/imports/image-1.png";
import { VERDE, ROSA, Order } from "./types";

const STEPS = [
  { icon: CheckCircle2, label: "Pedido recebido", key: "recebido" as const },
  { icon: ChefHat, label: "Em preparo", key: "preparo" as const },
  { icon: Package, label: "Pronto", key: "pronto" as const },
  { icon: Bike, label: "Entregue", key: "entregue" as const },
];

const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

function paymentInfo(order: Order) {
  const status = order.paymentStatus ?? "not_required";
  const approved = status === "approved";
  const rejected = ["rejected", "cancelled", "refunded", "charged_back"].includes(status);
  const pending = order.paymentProvider === "mercado_pago" && !approved && !rejected;

  if (approved) {
    return {
      label: "Pagamento aprovado",
      copy: "Mercado Pago confirmou o pagamento deste pedido.",
      color: "#065F46",
      bg: "#ECFDF5",
      border: "#6EE7B7",
    };
  }

  if (rejected) {
    return {
      label: "Pagamento não aprovado",
      copy: "O Mercado Pago não confirmou este pagamento. Fale com o atendimento.",
      color: "#991B1B",
      bg: "#FEF2F2",
      border: "#FECACA",
    };
  }

  if (pending) {
    return {
      label: "Pagamento pendente",
      copy: "Aguardando confirmação automática do Mercado Pago.",
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
  autoReturnMs = 30000,
}: Props) {
  const statusIdx = order ? STEPS.findIndex((s) => s.key === order.status) : -1;
  const current = orderPlaced ? Math.max(statusIdx, 0) : -1;

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
            Nenhum pedido ativo
          </p>
          <p className="text-xs mt-1" style={{ color: VERDE, opacity: 0.4 }}>
            Faça um pedido pelo cardápio
          </p>
        </div>
        {goHome && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={goHome}
            className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider"
            style={{
              background: ROSA,
              color: VERDE,
              border: "none",
              cursor: "pointer",
            }}
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

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#FFF8F2" }}>
      {/* ── Hero ── */}
      <div
        className="relative px-5 pt-5 pb-6 overflow-hidden"
        style={{
          background: VERDE,
          boxShadow: "0 16px 42px rgba(31,61,46,0.18)",
        }}
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
            <p
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: `${ROSA}70` }}
            >
              ACOMPANHE SEU PEDIDO
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
              {order.status === "recebido"
                ? "Recebido"
                : order.status === "preparo"
                  ? "Em preparo"
                  : order.status === "pronto"
                    ? "Pronto ✓"
                    : "Entregue"}
            </span>
            <div className="flex items-center gap-1">
              {order.deliveryType === "delivery" ? (
                <Bike
                  size={12}
                  strokeWidth={2}
                  style={{ color: `${ROSA}70` }}
                />
              ) : (
                <Store
                  size={12}
                  strokeWidth={2}
                  style={{ color: `${ROSA}70` }}
                />
              )}
              <span className="text-[10px]" style={{ color: `${ROSA}70` }}>
                {order.deliveryType === "delivery"
                  ? "Delivery"
                  : "Retirada no balcão"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 gap-4">
        {/* Steps */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: "#fff",
            border: `1.5px solid ${ROSA}`,
            boxShadow: "0 14px 36px rgba(31,61,46,0.07)",
          }}
        >
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-4"
            style={{ color: VERDE, opacity: 0.4 }}
          >
            Status do pedido
          </p>
          {STEPS.map((step, i) => {
            const done = i <= current;
            const active = i === current;
            const Icon = step.icon;
            const isLast = i === STEPS.length - 1;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <motion.div
                    animate={{
                      opacity: done ? 1 : 0.3,
                      scale: done ? 1 : 0.85,
                    }}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      background: done ? VERDE : "#fff",
                      border: `2px solid ${done ? VERDE : `${VERDE}20`}`,
                    }}
                  >
                    <Icon
                      size={15}
                      strokeWidth={2}
                      style={{ color: done ? ROSA : VERDE }}
                    />
                  </motion.div>
                  {!isLast && (
                    <div
                      className="w-0.5 h-7 mt-0.5"
                      style={{ background: i < current ? VERDE : `${VERDE}12` }}
                    />
                  )}
                </div>
                <div className={`pt-1.5 ${!isLast ? "pb-5" : ""}`}>
                  <p
                    className="text-sm font-black uppercase tracking-wide"
                    style={{ color: done ? VERDE : `${VERDE}30` }}
                  >
                    {step.label}
                  </p>
                  {active && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] mt-0.5"
                      style={{ color: VERDE, opacity: 0.5 }}
                    >
                      {step.key === "recebido"
                        ? "Confirmado às " + timeStr
                        : step.key === "preparo"
                          ? "Aguarde um momento..."
                          : step.key === "pronto"
                            ? "Retire no balcão!"
                            : "A caminho!"}
                    </motion.p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment status */}
        <div
          className="rounded-2xl p-4"
          style={{ background: pay.bg, border: `1.5px solid ${pay.border}` }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "#fff", color: pay.color }}
            >
              {pay.label.includes("não") ? (
                <AlertCircle size={18} strokeWidth={2.3} />
              ) : (
                <PayIcon size={18} strokeWidth={2.3} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-black uppercase tracking-wide"
                style={{ color: pay.color }}
              >
                {pay.label}
              </p>
              <p
                className="text-[11px] leading-relaxed mt-1"
                style={{ color: pay.color, opacity: 0.72 }}
              >
                {pay.copy}
              </p>
              {order.paymentMethod && (
                <p
                  className="text-[10px] font-black uppercase tracking-wider mt-2"
                  style={{ color: pay.color, opacity: 0.62 }}
                >
                  Método: {order.paymentMethod === "pix" ? "Pix" : "Cartão"} · Status:{" "}
                  {order.paymentStatus ?? "not_required"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order items */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: "#fff",
            border: `1.5px solid ${ROSA}`,
            boxShadow: "0 14px 36px rgba(31,61,46,0.07)",
          }}
        >
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-3"
            style={{ color: VERDE, opacity: 0.4 }}
          >
            Itens do pedido
          </p>
          {order.items.map((item, i) => (
            <div
              key={i}
              className="flex justify-between py-2"
              style={{
                borderBottom:
                  i < order.items.length - 1 ? `1px solid ${ROSA}` : "none",
              }}
            >
              <span className="text-xs" style={{ color: VERDE }}>
                {item.qty}× {item.name}
              </span>
              <span className="text-xs font-bold" style={{ color: VERDE }}>
                {fmt(item.price * item.qty)}
              </span>
            </div>
          ))}
          <div
            className="flex justify-between items-center pt-3 mt-1"
            style={{ borderTop: `1px solid ${ROSA}` }}
          >
            <span
              className="text-sm font-black uppercase tracking-wider"
              style={{ color: VERDE }}
            >
              Total
            </span>
            <span
              className="font-black"
              style={{
                color: VERDE,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "1.4rem",
              }}
            >
              {fmt(order.total)}
            </span>
          </div>
        </div>

        {/* Novo pedido */}
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
            Novo pedido
          </motion.button>
        )}
      </div>
    </div>
  );
}
