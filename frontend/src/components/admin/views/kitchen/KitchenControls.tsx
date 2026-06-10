import { motion } from "motion/react";
import { BellRing, Check } from "lucide-react";
import { Order, OrderStatus } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import {
  fmt,
  orderReadyWhatsappUrl,
  paymentBadge,
  paymentMethodLabel,
  STAGE_COLOR,
  STAGE_LABEL,
} from "../../shared";
import { KANBAN_STAGES, KITCHEN_STAGE_LABEL } from "./kitchenShared";

export function KitchenControls({
  selectedOrder,
  selectedAddedItems,
  selectedRemovedItems,
  selectedCanAdvance,
  selectedIsAdvancing,
  selectedNextStage,
  selectedNextStageLabel,
  selectedCol,
  clampedRow,
  currentColLength,
  onAdvance,
}: {
  selectedOrder: Order | null;
  selectedAddedItems: Order["items"];
  selectedRemovedItems: string[];
  selectedCanAdvance: boolean;
  selectedIsAdvancing: boolean;
  selectedNextStage?: OrderStatus;
  selectedNextStageLabel: string;
  selectedCol: number;
  clampedRow: number;
  currentColLength: number;
  onAdvance: (order: Order) => void;
}) {
  if (!selectedOrder) {
    return (
      <div style={{ background: VERDE, padding: "14px 14px 18px" }}>
        <p style={{ color: `${ROSA}50`, fontSize: 10 }}>Selecione um pedido</p>
      </div>
    );
  }

  const pay = paymentBadge(selectedOrder);
  const whatsappUrl = orderReadyWhatsappUrl(selectedOrder);

  return (
    <div style={{ background: VERDE, padding: "14px 14px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <p
            style={{
              color: ROSA,
              fontFamily: "var(--menfis-font-display)",
              fontSize: "1.35rem",
              lineHeight: 1,
              letterSpacing: "0.07em",
            }}
          >
            {selectedOrder.id} -{" "}
            {KITCHEN_STAGE_LABEL[selectedOrder.status] ?? STAGE_LABEL[selectedOrder.status]}
          </p>
          <p style={{ color: `${ROSA}70`, fontSize: 10, marginTop: 3, fontWeight: 700 }}>
            {selectedOrder.customerName || "Cliente não informado"} ·{" "}
            {selectedOrder.deliveryType === "delivery" ? "Entrega" : "Retirada no balcão"} ·{" "}
            {fmt(selectedOrder.total)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {KANBAN_STAGES.map((stage) => {
            const sc = STAGE_COLOR[stage];
            return (
              <div
                key={stage}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: selectedOrder.status === stage ? sc.accent : `${ROSA}25`,
                  transition: "background 0.3s",
                }}
              />
            );
          })}
        </div>
      </div>

      <div
        style={{
          background: `${ROSA}14`,
          border: `1.5px solid ${ROSA}35`,
          borderRadius: 12,
          padding: "10px 12px",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            background: pay.bg,
            border: `1px solid ${pay.border}`,
            borderRadius: 10,
            padding: "8px 10px",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              color: pay.text,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {pay.label}
          </span>
          <span style={{ color: pay.text, fontSize: 10, fontWeight: 800, opacity: 0.75 }}>
            {paymentMethodLabel(selectedOrder)}
          </span>
        </div>
        <p
          style={{
            fontSize: 10,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: ROSA,
            opacity: 0.9,
            marginBottom: 8,
          }}
        >
          Detalhes do pedido
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {selectedOrder.items.map((item, idx) => {
            const removedForItem = selectedOrder.removedByItemId?.[item.id] ?? [];
            return (
              <div
                key={`${item.id}-${idx}`}
                style={{
                  borderBottom:
                    idx < selectedOrder.items.length - 1 ? `1px solid ${ROSA}25` : "none",
                  paddingBottom: idx < selectedOrder.items.length - 1 ? 6 : 0,
                }}
              >
                <p style={{ color: ROSA, fontSize: 12, fontWeight: 900, lineHeight: 1.25 }}>
                  {item.qty}× {item.name}
                </p>
                {removedForItem.length > 0 && (
                  <p style={{ color: `${ROSA}88`, fontSize: 10, marginTop: 2 }}>
                    Retirar: {removedForItem.join(", ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {(selectedAddedItems.length > 0 || selectedRemovedItems.length > 0) && (
          <div
            style={{
              marginTop: 8,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <ChangeList
              title="Adicionados"
              text={
                selectedAddedItems.length > 0
                  ? selectedAddedItems.map((item) => `${item.qty}× ${item.name}`).join(" · ")
                  : "Nenhum"
              }
            />
            <ChangeList
              title="Retirados"
              text={selectedRemovedItems.length > 0 ? selectedRemovedItems.join(" · ") : "Nenhum"}
            />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {selectedOrder.status === "READY" && whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              height: 88,
              minWidth: 210,
              background: "#25D366",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              fontWeight: 900,
              textDecoration: "none",
              boxShadow:
                "0 6px 0 rgba(37,211,102,0.45), 0 8px 20px rgba(0,0,0,0.25)",
            }}
          >
            <BellRing size={22} strokeWidth={3} />
            <span
              style={{
                fontFamily: "var(--menfis-font-display)",
                fontSize: "1.05rem",
                letterSpacing: "0.12em",
                lineHeight: 1,
              }}
            >
              AVISAR CLIENTE
            </span>
            <span style={{ fontSize: 8, fontWeight: 800, opacity: 0.85 }}>
              Pedido pronto
            </span>
          </a>
        )}
        <motion.button
          whileTap={{ scale: 0.94, y: 3 }}
          onClick={() => onAdvance(selectedOrder)}
          disabled={!selectedCanAdvance}
          style={{
            flex: 1,
            height: 88,
            background: selectedCanAdvance ? ROSA : `${ROSA}30`,
            border: "none",
            borderRadius: 14,
            cursor: selectedCanAdvance ? "pointer" : "default",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            boxShadow: selectedCanAdvance
              ? `0 6px 0 ${ROSA}60, 0 8px 20px rgba(0,0,0,0.3)`
              : "none",
            transition: "all 0.2s",
          }}
        >
          <Check
            size={22}
            strokeWidth={3}
            style={{ color: selectedCanAdvance ? VERDE : `${ROSA}50` }}
          />
          <span
            style={{
              fontFamily: "var(--menfis-font-display)",
              fontSize: "1.05rem",
              letterSpacing: "0.12em",
              color: selectedCanAdvance ? VERDE : `${ROSA}40`,
              lineHeight: 1,
            }}
          >
            {selectedIsAdvancing
              ? "ENVIANDO"
              : !selectedCanAdvance
                ? "AGUARDANDO PAGAMENTO"
                : "CONFIRMAR"}
          </span>
          {selectedCanAdvance && selectedNextStage && (
            <span
              style={{
                fontSize: 8,
                color: `${VERDE}80`,
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              → {selectedNextStageLabel}
            </span>
          )}
        </motion.button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <span style={{ fontSize: 8, color: `${ROSA}40`, fontWeight: 700 }}>
          col {selectedCol + 1}/{KANBAN_STAGES.length} · linha {clampedRow + 1}/
          {Math.max(1, currentColLength)}
        </span>
        <span style={{ fontSize: 8, color: `${ROSA}40` }}>
          4/6 ou setas: coluna · 8/2 ou setas: linha · Enter avançar
        </span>
      </div>
    </div>
  );
}

function ChangeList({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        background: `${ROSA}14`,
        border: `1px solid ${ROSA}30`,
        borderRadius: 8,
        padding: "6px 8px",
      }}
    >
      <p
        style={{
          color: ROSA,
          fontSize: 9,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 3,
        }}
      >
        {title}
      </p>
      <p style={{ color: `${ROSA}90`, fontSize: 10, lineHeight: 1.35 }}>{text}</p>
    </div>
  );
}
