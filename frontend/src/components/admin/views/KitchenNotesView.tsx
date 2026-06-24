import type { ReactNode } from "react";
import { CalendarDays, ChefHat, Printer } from "lucide-react";
import { Order, OrderStatus } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { deliveryConfirmationCode } from "@/components/order/tracking";
import {
  elapsed,
  fmt,
  isKioskMobOrder,
  localDateKey,
  orderItemComponents,
  orderItemNote,
  printOrderReceipts,
  STAGE_LABEL,
} from "../shared";

const ACTIVE_STATUSES: OrderStatus[] = ["PAID", "ACCEPTED", "IN_PREPARATION", "READY"];

export function KitchenNotesView({
  orders,
  demoTableEnabled = false,
}: {
  orders: Order[];
  demoTableEnabled?: boolean;
}) {
  const today = demoTableEnabled ? "2026-06-12" : localDateKey(Date.now());
  const notes = orders
    .filter((order) => localDateKey(order.timestamp) === today)
    .filter((order) => ACTIVE_STATUSES.includes(order.status))
    .sort((a, b) => a.timestamp - b.timestamp);
  const readyCount = notes.filter((order) => order.status === "READY").length;

  return (
    <main style={{ minHeight: "100vh", background: "#FFF8F2", color: VERDE }}>
      <header
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 16,
          alignItems: "center",
          padding: "18px 22px",
          background: VERDE,
          color: ROSA,
        }}
      >
        <div>
          <p style={{ fontSize: 12, fontWeight: 950, textTransform: "uppercase", letterSpacing: "0.16em", opacity: 0.72 }}>
            Conferencia de pedidos
          </p>
          <h1
            style={{
              margin: "3px 0 0",
              fontFamily: "var(--menfis-font-display)",
              fontSize: "clamp(2.8rem, 6vw, 6rem)",
              lineHeight: 0.88,
              letterSpacing: "0.06em",
            }}
          >
            NOTAS DA SAIDA
          </h1>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(120px, 1fr))", gap: 10, minWidth: 420 }}>
          <HeaderMetric label="Fila" value={String(notes.length)} />
          <HeaderMetric label="Prontos" value={String(readyCount)} />
          <HeaderMetric label="Data" value={formatDate(today)} icon={<CalendarDays size={18} />} />
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(430px, 1fr))",
          gap: 12,
          padding: 14,
        }}
      >
        {notes.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              minHeight: "calc(100vh - 180px)",
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              opacity: 0.52,
              fontWeight: 950,
            }}
          >
            <div>
              <ChefHat size={52} />
              <p style={{ marginTop: 12 }}>Nenhum pedido ativo para conferir.</p>
            </div>
          </div>
        ) : (
          notes.map((order, index) => <KitchenNoteCard key={order.id} order={order} position={index + 1} />)
        )}
      </section>
    </main>
  );
}

function KitchenNoteCard({ order, position }: { order: Order; position: number }) {
  const ready = order.status === "READY";
  const type = isKioskMobOrder(order) ? "Balcao" : order.deliveryType === "delivery" ? "Entrega" : "Retirada";
  const removed = Object.entries(order.removedByItemId ?? {})
    .flatMap(([, values]) => values)
    .filter((value, index, values) => values.indexOf(value) === index);
  const extras = order.items.filter((item) => item.id.startsWith("extra-"));

  return (
    <article
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        minHeight: 520,
        background: "#fff",
        border: `3px solid ${ready ? "#10B981" : ROSA}`,
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: ready ? "0 0 0 4px rgba(16,185,129,0.14)" : "none",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 12,
          alignItems: "center",
          padding: 14,
          background: ready ? "#ECFDF5" : "#FFF1F2",
          borderBottom: `2px solid ${ready ? "#10B981" : ROSA}`,
        }}
      >
        <div
          style={{
            width: 62,
            height: 62,
            display: "grid",
            placeItems: "center",
            background: VERDE,
            color: ROSA,
            borderRadius: 8,
            fontFamily: "var(--menfis-font-display)",
            fontSize: 38,
            lineHeight: 1,
          }}
        >
          {position}
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--menfis-font-display)", fontSize: 46, lineHeight: 0.95 }}>
            {order.id}
          </h2>
          <p style={{ marginTop: 4, fontSize: 13, fontWeight: 950 }}>
            {type} · {STAGE_LABEL[order.status] ?? order.status} · {elapsed(order.timestamp)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => printOrderReceipts(order, { confirm: false })}
          style={{
            minHeight: 58,
            minWidth: 120,
            border: "none",
            borderRadius: 8,
            background: VERDE,
            color: ROSA,
            display: "grid",
            placeItems: "center",
            gap: 2,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 950,
            textTransform: "uppercase",
          }}
        >
          <Printer size={20} />
          Imprimir
        </button>
      </div>

      <div style={{ display: "grid", gap: 12, padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Info label="Cliente" value={order.customerName || "Nao informado"} />
          <Info label="Codigo" value={deliveryConfirmationCode(order)} />
          <Info label="Total" value={fmt(order.total)} />
        </div>

        <section style={{ display: "grid", gap: 10 }}>
          {order.items.map((item, index) => {
            const components = orderItemComponents(item);
            const note = orderItemNote(item);
            const removedForItem = order.removedByItemId?.[item.id] ?? [];
            return (
              <div key={`${item.id}-${index}`} style={{ border: `2px solid ${VERDE}22`, borderRadius: 8, padding: 12, background: "#FFFDF9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <strong style={{ fontSize: 24, lineHeight: 1.1 }}>
                    {item.qty}x {item.name}
                  </strong>
                  <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 950 }}>{fmt(item.price * item.qty)}</span>
                </div>
                {components.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 7, marginTop: 10 }}>
                    {components.map((component) => (
                      <span key={component} style={{ border: `1px solid ${ROSA}`, borderRadius: 8, padding: "8px 9px", fontSize: 14, fontWeight: 900 }}>
                        {component}
                      </span>
                    ))}
                  </div>
                )}
                {removedForItem.length > 0 && (
                  <p style={{ marginTop: 10, color: "#991B1B", fontSize: 16, fontWeight: 950 }}>
                    Retirar: {removedForItem.join(", ")}
                  </p>
                )}
                {note && (
                  <p style={{ marginTop: 10, color: "#92400E", fontSize: 16, fontWeight: 950 }}>
                    Obs: {note}
                  </p>
                )}
              </div>
            );
          })}
        </section>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          padding: 14,
          borderTop: `2px solid ${ROSA}`,
          background: "#FFF8F2",
        }}
      >
        <Summary label="Adicionais" value={extras.length ? extras.map((item) => `${item.qty}x ${item.name}`).join(" · ") : "Nenhum"} />
        <Summary label="Retirar" value={removed.length ? removed.join(" · ") : "Nenhum"} />
      </div>
    </article>
  );
}

function HeaderMetric({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div style={{ background: "#fff", color: VERDE, borderRadius: 8, padding: "10px 12px", minHeight: 62 }}>
      <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, fontWeight: 950, textTransform: "uppercase", opacity: 0.58 }}>
        {icon}
        {label}
      </p>
      <p style={{ marginTop: 3, fontFamily: "var(--menfis-font-display)", fontSize: 30, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: `1px solid ${VERDE}18`, borderRadius: 8, padding: 10, background: "#F8F4F5" }}>
      <p style={{ fontSize: 9, fontWeight: 950, textTransform: "uppercase", opacity: 0.45 }}>{label}</p>
      <p style={{ marginTop: 4, fontSize: 14, fontWeight: 950 }}>{value}</p>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${ROSA}`, borderRadius: 8, padding: 10 }}>
      <p style={{ fontSize: 10, fontWeight: 950, textTransform: "uppercase", opacity: 0.55 }}>{label}</p>
      <p style={{ marginTop: 5, fontSize: 14, fontWeight: 900, lineHeight: 1.35 }}>{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
