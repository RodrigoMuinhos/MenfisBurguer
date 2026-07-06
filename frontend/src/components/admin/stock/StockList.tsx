import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, Calendar, Pencil, Trash2 } from "lucide-react";
import { VERDE } from "@/utils/theme";
import {
  daysUntil,
  fmtDate,
  fmtQty,
  fmtR$,
  getStatus,
  IconBtn,
  STATUS_META,
  StockItem,
} from "../EstoqueView";

export function StockList({
  items,
  onEdit,
  onMove,
  onDelete,
}: {
  items: StockItem[];
  onEdit: (item: StockItem) => void;
  onMove: (item: StockItem, type: "entrada" | "saida") => void;
  onDelete: (item: StockItem) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <AnimatePresence>
        {items.map((item) => {
          const status = getStatus(item);
          const sm = STATUS_META[status];
          const Icon = sm.Icon;
          const expDays = daysUntil(item.expiryDate);
          const expWarn = expDays <= 7;
          const base = item.monthlyBaseStock && item.monthlyBaseStock > 0 ? item.monthlyBaseStock : item.minQty * 1.8;
          const pct = base > 0 ? Math.min(100, (item.qty / base) * 100) : 100;

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -40 }}
              style={{
                padding: "11px 14px",
                borderBottom: `1px solid ${VERDE}08`,
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <p style={{ flex: 1, fontSize: 13, fontWeight: 800, color: VERDE, lineHeight: 1 }}>
                  {item.name}
                  <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, opacity: 0.45 }}>{item.category ?? "Geral"}</span>
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: sm.bg, border: `1px solid ${sm.border}`, borderRadius: 999, padding: "2px 8px" }}>
                  <Icon size={10} strokeWidth={2.5} style={{ color: sm.text }} />
                  <span style={{ fontSize: 8, fontWeight: 900, color: sm.text, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {sm.label}
                  </span>
                </div>
              </div>

              <div style={{ height: 4, background: `${VERDE}10`, borderRadius: 99, marginBottom: 8, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    borderRadius: 99,
                    background: status === "ok" ? "#10B981" : status === "atencao" ? "#F59E0B" : "#EF4444",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 7 }}>
                <Metric label="Qtd atual" value={fmtQty(item.qty, item.unit)} color={status === "zerado" ? "#DC2626" : status === "baixo" ? "#D97706" : VERDE} />
                <Metric label="% mês" value={`${Math.round(pct)}%`} color={pct <= 10 ? "#DC2626" : pct <= 25 ? "#D97706" : VERDE} />
                <Metric label="Base mês" value={fmtQty(item.monthlyBaseStock ?? 0, item.unit)} />
                <Metric label="Mínimo" value={fmtQty(item.minQty, item.unit)} />
                <div>
                  <p style={metricLabelStyle}>Custo unit.</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: VERDE }}>{fmtR$(item.unitCost)}/{item.unit}</p>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <p style={metricLabelStyle}>Valor total</p>
                  <p style={metricValueStyle}>{fmtR$(item.qty * item.unitCost)}</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <ArrowDown size={9} strokeWidth={2.5} style={{ color: VERDE, opacity: 0.35 }} />
                    <span style={{ fontSize: 9, color: VERDE, opacity: 0.45 }}>{fmtDate(item.entryDate)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Calendar size={9} strokeWidth={2.5} style={{ color: expWarn ? "#D97706" : VERDE, opacity: expWarn ? 1 : 0.35 }} />
                    <span style={{ fontSize: 9, color: expWarn ? "#D97706" : VERDE, opacity: expWarn ? 1 : 0.45, fontWeight: expWarn ? 800 : 400 }}>
                      {fmtDate(item.expiryDate)}{expWarn ? ` (${expDays}d)` : ""}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 4 }}>
                  <IconBtn Icon={ArrowDown} color="#065F46" bg="#ECFDF5" title="Saída" onClick={() => onMove(item, "saida")} />
                  <IconBtn Icon={ArrowUp} color="#1D4ED8" bg="#EFF6FF" title="Entrada" onClick={() => onMove(item, "entrada")} />
                  <IconBtn Icon={Pencil} color={VERDE} bg={`${VERDE}10`} title="Editar" onClick={() => onEdit(item)} />
                  <IconBtn Icon={Trash2} color="#991B1B" bg="#FEF2F2" title="Excluir" onClick={() => onDelete(item)} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function Metric({ label, value, color = VERDE }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p style={metricLabelStyle}>{label}</p>
      <p style={{ ...metricValueStyle, color }}>{value}</p>
    </div>
  );
}

const metricLabelStyle = {
  fontSize: 8,
  color: VERDE,
  opacity: 0.4,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
} as const;

const metricValueStyle = {
  fontSize: 13,
  fontWeight: 900,
  color: VERDE,
  fontFamily: "var(--menfis-font-display)",
} as const;
