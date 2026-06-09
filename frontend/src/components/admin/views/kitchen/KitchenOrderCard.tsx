import { motion } from "motion/react";
import { Bike, Store } from "lucide-react";
import { Order } from "@/types/order";
import { VERDE } from "@/utils/theme";
import { elapsed, paymentBadge } from "../../shared";

type StageColor = {
  bg: string;
  border: string;
  text: string;
  accent: string;
};

export function KitchenOrderCard({
  order,
  selected,
  stageColor,
  onSelect,
}: {
  order: Order;
  selected: boolean;
  stageColor: StageColor;
  onSelect: () => void;
}) {
  const pay = paymentBadge(order);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onSelect}
      style={{
        background: selected ? stageColor.bg : "#fff",
        border: `2px solid ${
          selected ? stageColor.accent : stageColor.border + "80"
        }`,
        borderRadius: 10,
        padding: "7px 8px",
        cursor: "pointer",
        boxShadow: selected ? `0 0 0 3px ${stageColor.accent}30` : "none",
        transition: "box-shadow 0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 3,
        }}
      >
        <span
          style={{
            fontFamily: "var(--menfis-font-display)",
            fontSize: "0.95rem",
            color: stageColor.text,
            lineHeight: 1,
          }}
        >
          {order.id}
        </span>
        <span style={{ fontSize: 8, color: stageColor.text, opacity: 0.6 }}>
          {elapsed(order.timestamp)}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          marginBottom: 4,
        }}
      >
        {order.items.map((item) => (
          <span
            key={item.id}
            style={{
              fontSize: 8.5,
              color: VERDE,
              opacity: 0.8,
              lineHeight: 1.3,
            }}
          >
            {item.qty}× {item.name}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
        {order.deliveryType === "delivery" ? (
          <Bike size={9} strokeWidth={2} style={{ color: stageColor.text, opacity: 0.6 }} />
        ) : (
          <Store size={9} strokeWidth={2} style={{ color: stageColor.text, opacity: 0.6 }} />
        )}
        <span
          style={{
            fontSize: 8,
            color: stageColor.text,
            opacity: 0.55,
            fontWeight: 700,
          }}
        >
          {order.channel}
        </span>
        <span
          style={{
            background: pay.bg,
            color: pay.text,
            border: `1px solid ${pay.border}`,
            borderRadius: 999,
            fontSize: 7,
            fontWeight: 900,
            padding: "1px 5px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {pay.label}
        </span>
        {selected && (
          <span
            style={{
              marginLeft: "auto",
              background: stageColor.accent,
              color: "#fff",
              borderRadius: 999,
              fontSize: 7,
              fontWeight: 900,
              padding: "1px 5px",
              letterSpacing: "0.06em",
            }}
          >
            SELECIONADO
          </span>
        )}
      </div>
    </motion.div>
  );
}
