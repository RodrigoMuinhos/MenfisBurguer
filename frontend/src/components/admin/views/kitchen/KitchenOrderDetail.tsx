import { BellRing, MessageCircle, Printer } from "lucide-react";
import { Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { deliveryConfirmationCode } from "@/components/order/tracking";
import {
  fmt,
  paymentBadge,
  paymentMethodLabel,
  paymentStatusLabel,
  STAGE_LABEL,
} from "../../shared";

type ProductKind = "burger" | "chicken" | "bacon";

const PRODUCT_STYLE: Record<ProductKind, { label: string; bg: string; border: string; text: string }> = {
  burger: { label: "Menfi's Burger", bg: "#FEF2F2", border: "#EF4444", text: "#991B1B" },
  chicken: { label: "Menfi's Chicken", bg: "#EFF6FF", border: "#3B82F6", text: "#1D4ED8" },
  bacon: { label: "Menfi's Bacon", bg: "#ECFDF5", border: "#10B981", text: "#065F46" },
};

export function OrderDetail({
  order,
  production,
  busyAction,
  compact = false,
  onSendConfirmation,
  onSendReady,
  onPrintMotoboy,
}: {
  order: Order;
  production: Array<{ id: string; title: string; possible: number; cost: number; limiting?: string; time: string }>;
  busyAction: string;
  compact?: boolean;
  onSendConfirmation: () => void;
  onSendReady: () => void;
  onPrintMotoboy: () => void;
}) {
  const kind = primaryKind(order);
  const style = PRODUCT_STYLE[kind];
  const pay = paymentBadge(order);
  const added = order.items.filter((item) => item.id.startsWith("extra-"));
  const removed = Object.entries(order.removedByItemId ?? {})
    .flatMap(([, values]) => values)
    .filter((value, index, values) => values.indexOf(value) === index);
  const readyAction =
    order.status === "READY"
      ? order.deliveryType === "delivery"
        ? { label: "Saiu para entrega", sublabel: "Liberar motoboy" }
        : { label: "Finalizar entregue", sublabel: "Encerrar pedido" }
      : { label: "Pedido pronto", sublabel: "Avisar cliente" };

  return (
    <article
      style={{
        minHeight: compact ? "auto" : "calc(100vh - 210px)",
        background: "#fff",
        border: `2px solid ${style.border}`,
        borderRadius: 18,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "1fr" : "1fr auto",
          gap: 12,
          padding: compact ? 12 : 18,
          background: style.bg,
        }}
      >
        <div>
          <p style={{ fontSize: 11, fontWeight: 950, color: style.text, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Pedido selecionado
          </p>
          <h2 style={{ margin: "4px 0 0", fontFamily: "var(--menfis-font-display)", fontSize: 48, lineHeight: 0.95, color: style.text }}>
            {order.id}
          </h2>
          <p style={{ marginTop: 6, fontSize: 13, fontWeight: 950, color: VERDE }}>
            {statusLabel(order.status)} · {pay.label}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <ActionButton
            label="Enviar confirmação"
            sublabel="Cliente avisado"
            Icon={MessageCircle}
            disabled={order.status !== "PAID" || Boolean(busyAction)}
            onClick={onSendConfirmation}
          />
          <ActionButton
            label={readyAction.label}
            sublabel={readyAction.sublabel}
            Icon={BellRing}
            disabled={!["IN_PREPARATION", "READY"].includes(order.status) || Boolean(busyAction)}
            onClick={onSendReady}
          />
          {order.status === "READY" && (
            <ActionButton
              label="Via motoboy"
              sublabel={`Codigo ${deliveryConfirmationCode(order)}`}
              Icon={Printer}
              disabled={Boolean(busyAction)}
              onClick={onPrintMotoboy}
            />
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10,
          padding: compact ? 10 : 14,
        }}
      >
        <InfoBox label="Cliente" value={order.customerName || "Não informado"} />
        <InfoBox label="Telefone" value={order.customerPhone || "Não informado"} />
        <InfoBox label="Tipo" value={order.deliveryType === "delivery" ? "Entrega" : "Retirada"} />
        <InfoBox label="Codigo" value={deliveryConfirmationCode(order)} />
        <InfoBox label="Forma de pagamento" value={paymentMethodLabel(order)} />
        <InfoBox label="Status do pagamento" value={paymentStatusLabel(order)} />
        <InfoBox label="Total" value={fmt(order.total)} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 14,
          padding: compact ? "0 10px 12px" : "0 14px 16px",
        }}
      >
        <section>
          <h3 style={{ margin: "8px 0 10px", fontSize: 12, fontWeight: 950, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Itens e montagem
          </h3>
          <div style={{ display: "grid", gap: 10 }}>
            {order.items.map((item, index) => {
              const itemKind = itemKindFromId(item.id, item.name);
              const itemStyle = PRODUCT_STYLE[itemKind];
              const removedForItem = order.removedByItemId?.[item.id] ?? [];
              return (
                <div
                  key={`${item.id}-${index}`}
                  style={{
                    background: itemStyle.bg,
                    border: `1.5px solid ${itemStyle.border}`,
                    borderRadius: 14,
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong style={{ color: itemStyle.text, fontSize: 16 }}>
                      {item.qty}x {item.name}
                    </strong>
                    <Tag bg="#fff" color={itemStyle.text} border={itemStyle.border}>{PRODUCT_STYLE[itemKind].label}</Tag>
                  </div>
                  {removedForItem.length > 0 && (
                    <p style={{ marginTop: 8, color: "#991B1B", fontSize: 13, fontWeight: 900 }}>
                      Retirar: {removedForItem.join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 12 }}>
            <InfoPanel title="Adicionais" text={added.length ? added.map((item) => `${item.qty}x ${item.name}`).join(" · ") : "Nenhum adicional"} />
            <InfoPanel title="Retirados" text={removed.length ? removed.join(" · ") : "Nenhum item removido"} />
            <InfoPanel title="Observação do pedido" text="Sem observação registrada" />
          </div>
        </section>

      </div>
    </article>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: `1px solid ${ROSA}`, borderRadius: 12, padding: "10px 12px", background: "#FFF8F2" }}>
      <p style={{ fontSize: 9, fontWeight: 950, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.5 }}>{label}</p>
      <p style={{ marginTop: 4, fontFamily: "var(--menfis-font-display)", fontSize: 28, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#F8F4F5", borderRadius: 14, padding: 12 }}>
      <p style={{ fontSize: 9, fontWeight: 950, opacity: 0.45, textTransform: "uppercase" }}>{label}</p>
      <p style={{ marginTop: 6, fontSize: 13, fontWeight: 950 }}>{value}</p>
    </div>
  );
}

function InfoPanel({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ border: `1px solid ${ROSA}`, borderRadius: 12, padding: 11 }}>
      <p style={{ fontSize: 10, fontWeight: 950, textTransform: "uppercase", opacity: 0.55 }}>{title}</p>
      <p style={{ marginTop: 5, fontSize: 13, fontWeight: 800, lineHeight: 1.35 }}>{text}</p>
    </div>
  );
}

function ActionButton({
  label,
  sublabel,
  Icon,
  disabled,
  onClick,
}: {
  label: string;
  sublabel: string;
  Icon: typeof MessageCircle;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 0,
        flex: "1 1 190px",
        height: 76,
        border: "none",
        borderRadius: 14,
        background: disabled ? `${VERDE}18` : VERDE,
        color: disabled ? `${VERDE}70` : ROSA,
        cursor: disabled ? "default" : "pointer",
        fontWeight: 950,
      }}
    >
      <Icon size={20} />
      <span style={{ display: "block", marginTop: 4, fontSize: 12, textTransform: "uppercase" }}>{label}</span>
      <span style={{ display: "block", marginTop: 2, fontSize: 10, opacity: 0.7 }}>{sublabel}</span>
    </button>
  );
}

export function Tag({ bg, color, border, children }: { bg: string; color: string; border: string; children: React.ReactNode }) {
  return (
    <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 999, padding: "3px 8px", fontSize: 10, fontWeight: 950, textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function primaryKind(order: Order): ProductKind {
  if (order.items.some((item) => itemKindFromId(item.id, item.name) === "bacon")) return "bacon";
  if (order.items.some((item) => itemKindFromId(item.id, item.name) === "chicken")) return "chicken";
  return "burger";
}

function itemKindFromId(id: string, name = ""): ProductKind {
  const normalized = `${id} ${name}`.toLowerCase();
  if (normalized.includes("bacon")) return "bacon";
  if (normalized.includes("chicken") || normalized.includes("frango")) return "chicken";
  return "burger";
}

function statusLabel(status: Order["status"]) {
  if (status === "PAID") return "Novo";
  if (status === "IN_PREPARATION") return "Em preparo";
  if (status === "READY") return "Pronto";
  return STAGE_LABEL[status] ?? status;
}
