import { Package } from "lucide-react";
import { Order } from "@/types/order";
import { VERDE } from "@/utils/theme";
import { fmt } from "../../shared";

export function DeliveredStrip({ orders }: { orders: Order[] }) {
  const delivered = orders.filter((o) => o.status === "DELIVERED");
  if (delivered.length === 0) return null;

  return (
    <div style={{ padding: "8px 10px", borderBottom: `1px solid ${VERDE}08` }}>
      <p
        style={{
          fontSize: 8,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: VERDE,
          opacity: 0.3,
          marginBottom: 4,
        }}
      >
        Entregues
      </p>
      <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        {[...delivered].reverse().slice(0, 5).map((order) => (
          <div
            key={order.id}
            style={{
              flexShrink: 0,
              background: `${VERDE}06`,
              border: `1px solid ${VERDE}10`,
              borderRadius: 8,
              padding: "4px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Package size={10} strokeWidth={2} style={{ color: VERDE, opacity: 0.3 }} />
            <span
              style={{
                fontFamily: "var(--menfis-font-display)",
                fontSize: "0.85rem",
                color: VERDE,
                opacity: 0.35,
              }}
            >
              {order.id}
            </span>
            <span style={{ fontSize: 8, color: VERDE, opacity: 0.25 }}>
              {fmt(order.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
