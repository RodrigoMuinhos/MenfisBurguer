import { CheckCircle2, Send } from "lucide-react";
import { Order, OrderStatus } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { elapsed, paymentBadge, paymentMethodLabel, STAGE_LABEL } from "../../shared";
import { Tag } from "./KitchenOrderDetail";

type ProductKind = "burger" | "chicken" | "bacon";

const PRODUCT_STYLE: Record<ProductKind, { label: string; bg: string; border: string; text: string }> = {
  burger: { label: "Menfi's Burger", bg: "#FEF2F2", border: "#EF4444", text: "#991B1B" },
  chicken: { label: "Menfi's Chicken", bg: "#EFF6FF", border: "#3B82F6", text: "#1D4ED8" },
  bacon: { label: "Menfi's Bacon", bg: "#ECFDF5", border: "#10B981", text: "#065F46" },
};

export function KitchenStageColumn({
  title,
  subtitle,
  orders,
  selectedId,
  actionLabel,
  actionIcon,
  busyAction,
  compact = false,
  onSelect,
  onAction,
}: {
  title: string;
  subtitle: string;
  orders: Order[];
  selectedId?: string;
  actionLabel: string;
  actionIcon: "send" | "check";
  busyAction: string;
  compact?: boolean;
  onSelect: (id: string) => void;
  onAction: (order: Order) => void;
}) {
  return (
    <section
      style={{
        minHeight: compact ? "auto" : "calc(100vh - 220px)",
        border: `2px solid ${ROSA}`,
        borderRadius: 16,
        overflow: "hidden",
        background: "#FFF8F2",
      }}
    >
      <div style={{ padding: compact ? "10px 12px" : 12, background: VERDE, color: ROSA }}>
        <p style={{ fontSize: 14, fontWeight: 950, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {title}
          <span style={{ marginLeft: 8, background: ROSA, color: VERDE, borderRadius: 999, padding: "2px 8px", fontSize: 11 }}>
            {orders.length}
          </span>
        </p>
        <p style={{ marginTop: 3, fontSize: 11, fontWeight: 800, opacity: 0.72 }}>{subtitle}</p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "repeat(auto-fit, minmax(260px, 1fr))" : "1fr",
          gap: 8,
          padding: compact ? 8 : 10,
        }}
      >
        {orders.length === 0 ? (
          <div style={{ padding: "30px 10px", textAlign: "center", opacity: 0.45, fontSize: 12, fontWeight: 900 }}>
            Sem pedidos
          </div>
        ) : (
          orders.map((order) => (
            <KitchenKanbanCard
              key={order.id}
              order={order}
              selected={selectedId === order.id}
              actionLabel={actionLabel}
              actionIcon={actionIcon}
              busy={Boolean(busyAction)}
              compact={compact}
              onSelect={() => onSelect(order.id)}
              onAction={() => onAction(order)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function KitchenKanbanCard({
  order,
  selected,
  actionLabel,
  actionIcon,
  busy,
  compact,
  onSelect,
  onAction,
}: {
  order: Order;
  selected: boolean;
  actionLabel: string;
  actionIcon: "send" | "check";
  busy: boolean;
  compact: boolean;
  onSelect: () => void;
  onAction: () => void;
}) {
  const kind = primaryKind(order);
  const style = PRODUCT_STYLE[kind];
  const isLate = Date.now() - order.timestamp > 20 * 60 * 1000;
  const pay = paymentBadge(order);
  const Icon = actionIcon === "send" ? Send : CheckCircle2;

  return (
    <article
      style={{
        background: selected ? style.bg : "#fff",
        border: `2px solid ${selected ? style.border : `${style.border}66`}`,
        borderRadius: 14,
        padding: compact ? 10 : 12,
        boxShadow: selected ? `0 0 0 3px ${style.border}22` : "none",
      }}
    >
      <button onClick={onSelect} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <strong style={{ fontFamily: "var(--menfis-font-display)", fontSize: 28, color: style.text, lineHeight: 1 }}>
            {order.id}
          </strong>
          <span style={{ color: isLate ? "#DC2626" : style.text, fontSize: 11, fontWeight: 950 }}>
            {elapsed(order.timestamp)}
          </span>
        </div>
        <p style={{ marginTop: 4, fontSize: 11, fontWeight: 950, color: style.text }}>
          {order.channel} · {paymentMethodLabel(order)} · {order.items.length} itens
        </p>
        <p style={{ marginTop: 8, fontSize: compact ? 13 : 12, fontWeight: 900, color: VERDE }}>
          {order.items.map((item) => `${item.qty}x ${item.name}`).join(" · ")}
        </p>
        <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
          <Tag bg={style.bg} color={style.text} border={style.border}>{style.label}</Tag>
          <Tag bg={pay.bg} color={pay.text} border={pay.border}>{pay.label}</Tag>
          {isLate && <Tag bg="#FEF2F2" color="#991B1B" border="#EF4444">Atraso</Tag>}
          <Tag bg="#F8F4F5" color={VERDE} border={`${VERDE}24`}>{statusLabel(order.status)}</Tag>
        </div>
      </button>
      <button
        onClick={onAction}
        disabled={busy}
        style={{
          marginTop: 10,
          width: "100%",
          minHeight: compact ? 54 : 48,
          border: "none",
          borderRadius: 12,
          background: VERDE,
          color: ROSA,
          cursor: busy ? "default" : "pointer",
          opacity: busy ? 0.6 : 1,
          fontSize: 12,
          fontWeight: 950,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Icon size={16} strokeWidth={2.6} />
        {actionLabel}
      </button>
    </article>
  );
}

export function primaryKind(order: Order): ProductKind {
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

function statusLabel(status: OrderStatus) {
  if (status === "PAID") return "Novo";
  if (status === "IN_PREPARATION") return "Em preparo";
  if (status === "READY") return "Pronto";
  return STAGE_LABEL[status] ?? status;
}
