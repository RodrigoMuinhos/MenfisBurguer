import { useState } from "react";
import { BellRing, Check, MessageCircle, Phone, Printer, XCircle } from "lucide-react";
import { Order, OrderStatus } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { deliveryConfirmationCode } from "@/components/order/tracking";
import {
  customerWhatsappUrl,
  fmt,
  orderReadyWhatsappUrl,
  paymentMethodLabel,
  paymentStatusLabel,
  printOrderReceipts,
  STAGE_COLOR,
  STAGE_LABEL,
} from "../shared";

const CANCELLABLE_STATUSES: OrderStatus[] = ["PAYMENT_PENDING", "PAID"];
const PREPARATION_STARTED_STATUSES: OrderStatus[] = [
  "IN_PREPARATION",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export function OrdersView({
  orders,
  updateOrderStatus,
}: {
  orders: Order[];
  updateOrderStatus: (id: string, status: OrderStatus) => void;
}) {
  const [channelFilter, setChannelFilter] = useState<"ALL" | Order["channel"]>(
    "ALL",
  );
  const [selectedId, setSelectedId] = useState(orders[0]?.id ?? "");
  const filteredOrders = orders.filter(
    (order) => channelFilter === "ALL" || order.channel === channelFilter,
  );
  const selected =
    filteredOrders.find((order) => order.id === selectedId) ??
    filteredOrders[0];
  const selectedPaymentStatus = String(selected?.paymentStatus ?? "").toLowerCase();
  const paymentRejected = [
    "rejected",
    "failed",
    "cancelled",
    "canceled",
    "expired",
    "refunded",
    "charged_back",
  ].includes(selectedPaymentStatus);
  const canReleasePayment =
    selected &&
    (selected.status === "PAYMENT_PENDING" ||
      (selected.status === "CANCELLED" && selected.paymentProvider === "mercado_pago" && paymentRejected));

  if (!selected) {
    return (
      <p className="py-12 text-center text-sm font-bold opacity-40">
        Nenhum pedido registrado.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["ALL", "DELIVERY", "KIOSK"] as const).map((channel) => (
          <button
            key={channel}
            onClick={() => setChannelFilter(channel)}
            className="rounded-full px-4 py-2 text-xs font-black uppercase"
            style={{
              background: channelFilter === channel ? VERDE : "#fff",
              color: channelFilter === channel ? ROSA : VERDE,
              border: `1px solid ${VERDE}22`,
            }}
          >
            {channel === "ALL" ? "Todos" : channel}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.8fr)_minmax(360px,1.2fr)]">
        <div className="flex max-h-[72vh] flex-col gap-2 overflow-y-auto">
          {filteredOrders.map((order) => {
            const stage = STAGE_COLOR[order.status];
            return (
              <button
                key={order.id}
                onClick={() => setSelectedId(order.id)}
                className="rounded-xl p-3 text-left"
                style={{
                  background: selected.id === order.id ? stage.bg : "#fff",
                  border: `1.5px solid ${selected.id === order.id ? stage.accent : stage.border}`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong style={{ color: stage.text }}>{order.id}</strong>
                  <span
                    className="text-[10px] font-black uppercase"
                    style={{ color: stage.text }}
                  >
                    {STAGE_LABEL[order.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold" style={{ color: VERDE }}>
                  {order.channel} · {fmt(order.total)} ·{" "}
                  {order.customerName || "Sem nome"} ·{" "}
                  {order.customerPhone || "Sem telefone"}
                </p>
              </button>
            );
          })}
        </div>

        <div
          className="rounded-2xl p-5"
          style={{ border: `1.5px solid ${ROSA}`, background: "#fff" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-black" style={{ color: VERDE }}>
                {selected.id}
              </p>
              <p
                className="text-xs font-black uppercase tracking-wide"
                style={{ color: STAGE_COLOR[selected.status].text }}
              >
                {STAGE_LABEL[selected.status]} · {paymentStatusLabel(selected)}
              </p>
            </div>
            <button
              onClick={() => printOrderReceipts(selected)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black uppercase"
              style={{ background: VERDE, color: ROSA }}
            >
              <Printer size={15} /> Imprimir via
            </button>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-4">
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Cliente
              </p>
              <p className="mt-1 text-sm font-bold">
                {selected.customerName || "Não informado"}
              </p>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Telefone
              </p>
              <p className="mt-1 text-sm font-bold">
                {selected.customerPhone || "Não informado"}
              </p>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Tipo
              </p>
              <p className="mt-1 text-sm font-bold">
                {selected.deliveryType === "delivery" ? "Entrega" : "Retirada"}
              </p>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Codigo
              </p>
              <p className="mt-1 text-sm font-bold">
                {deliveryConfirmationCode(selected)}
              </p>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Forma de pagamento
              </p>
              <p className="mt-1 text-sm font-bold">
                {paymentMethodLabel(selected)}
              </p>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Status do pagamento
              </p>
              <p className="mt-1 text-sm font-bold">
                {paymentStatusLabel(selected)}
              </p>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Total
              </p>
              <p className="mt-1 text-sm font-bold">
                {fmt(selected.total)}
              </p>
            </div>
            {selected.deliveryType === "delivery" && (
              <div
                className="rounded-xl p-3"
                style={{ background: `${VERDE}08` }}
              >
                <p className="text-[10px] font-black uppercase opacity-50">
                  Endereco
                </p>
                <p className="mt-1 text-sm font-bold">
                  {selected.customerAddress || "Não informado"}
                </p>
              </div>
            )}
          </div>

          <div className="admin-order-actions mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {canReleasePayment && (
              <button
                onClick={() => updateOrderStatus(selected.id, "PAID")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black uppercase"
                style={{ background: "#16A34A", color: "#fff" }}
              >
                <Check size={15} /> Liberar pagamento
              </button>
            )}
            {selected.status === "PAID" && (
              <button
                onClick={() => updateOrderStatus(selected.id, "IN_PREPARATION")}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{ background: "#16A34A", color: "#fff" }}
              >
                <Check size={15} /> Aceitar pedido
              </button>
            )}
            {CANCELLABLE_STATUSES.includes(selected.status) && (
              <button
                onClick={() => {
                  if (window.confirm(`Cancelar o pedido ${selected.id}?`)) {
                    updateOrderStatus(selected.id, "CANCELLED");
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{
                  background: "#FEF2F2",
                  color: "#991B1B",
                  border: "1.5px solid #FCA5A5",
                }}
              >
                <XCircle size={15} /> Cancelar pedido
              </button>
            )}
            {PREPARATION_STARTED_STATUSES.includes(selected.status) && (
              <span
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{
                  background: `${VERDE}08`,
                  color: VERDE,
                  border: `1.5px solid ${VERDE}18`,
                  opacity: 0.7,
                }}
                title="Cancelamento permitido apenas antes de entrar em preparo."
              >
                <XCircle size={15} /> Cancelamento bloqueado
              </span>
            )}
            {selected.customerPhone && (
              <a
                href={`tel:${selected.customerPhone.replace(/\D/g, "")}`}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{ border: `1.5px solid ${VERDE}`, color: VERDE }}
              >
                <Phone size={15} /> Ligar
              </a>
            )}
            {customerWhatsappUrl(selected) && (
              <a
                href={customerWhatsappUrl(selected)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{ background: "#25D366", color: "#fff" }}
              >
                <MessageCircle size={15} /> Enviar confirmação
              </a>
            )}
            {selected.status === "READY" && (
              <button
                onClick={() =>
                  updateOrderStatus(
                    selected.id,
                    selected.deliveryType === "delivery" ? "OUT_FOR_DELIVERY" : "DELIVERED",
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{ background: VERDE, color: ROSA }}
              >
                <BellRing size={15} />
                {selected.deliveryType === "delivery" ? "Saiu para entrega" : "Finalizar entregue"}
              </button>
            )}
            {selected.status === "OUT_FOR_DELIVERY" && (
              <button
                onClick={() => updateOrderStatus(selected.id, "DELIVERED")}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{ background: "#16A34A", color: "#fff" }}
              >
                <Check size={15} /> Entregue
              </button>
            )}
            {selected.status === "READY" && orderReadyWhatsappUrl(selected) && (
              <a
                href={orderReadyWhatsappUrl(selected)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{ background: VERDE, color: ROSA }}
              >
                <BellRing size={15} /> Avisar pronto
              </a>
            )}
          </div>

          <div className="mt-5">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-45">
              Itens
            </p>
            {selected.items.map((item) => (
              <div
                key={`${selected.id}-${item.id}`}
                className="flex justify-between gap-4 border-b py-3 text-sm"
              >
                <span>
                  {item.qty}x {item.name}
                </span>
                <strong>{fmt(item.price * item.qty)}</strong>
              </div>
            ))}
            <div className="mt-3 flex justify-between text-lg font-black">
              <span>Total</span>
              <span>{fmt(selected.total)}</span>
            </div>
          </div>
          <style>{`
            .admin-order-actions > * {
              min-height: 48px;
              width: 100%;
              justify-content: center;
              text-align: center;
              padding-left: 12px;
              padding-right: 12px;
              line-height: 1.05;
            }
            .admin-order-actions svg {
              flex-shrink: 0;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

/* ─── KDS — 3-COLUMN KANBAN ─────────────────────────── */
