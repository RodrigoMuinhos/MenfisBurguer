import { AnimatePresence, motion } from "motion/react";
import { ClipboardList, X } from "lucide-react";
import { VERDE } from "@/utils/theme";
import { MOV_META, Movement } from "../EstoqueView";

export function AuditHistory({
  open,
  movements,
  onClose,
}: {
  open: boolean;
  movements: Movement[];
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          style={{ borderTop: `2px solid ${VERDE}15`, overflow: "hidden" }}
        >
          <div style={{ padding: "10px 14px 4px", background: `${VERDE}04`, display: "flex", alignItems: "center", gap: 6 }}>
            <ClipboardList size={11} strokeWidth={2} style={{ color: VERDE, opacity: 0.5 }} />
            <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: VERDE, opacity: 0.45 }}>
              Auditoria - {movements.length} movimento{movements.length !== 1 ? "s" : ""}
            </span>
            <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: VERDE, opacity: 0.4 }}>
              <X size={14} strokeWidth={2} />
            </button>
          </div>
          {movements.length === 0 && (
            <p style={{ fontSize: 10, color: VERDE, opacity: 0.3, padding: "12px 14px", fontWeight: 700 }}>
              Nenhum movimento registrado.
            </p>
          )}
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {movements.map((movement) => {
              const mm = MOV_META[movement.type];
              return (
                <div key={movement.id} style={{ display: "flex", gap: 10, padding: "8px 14px", borderBottom: `1px solid ${VERDE}06`, alignItems: "flex-start" }}>
                  <div style={{ padding: "2px 7px", background: mm.bg, borderRadius: 999, flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 8, fontWeight: 900, color: mm.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {mm.label}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: VERDE, lineHeight: 1 }}>{movement.itemName}</p>
                    <p style={{ fontSize: 9, color: VERDE, opacity: 0.5, marginTop: 1 }}>
                      {movement.qtyBefore} {"->"} {movement.qtyAfter} · {movement.note}
                    </p>
                  </div>
                  <span style={{ fontSize: 8, color: VERDE, opacity: 0.3, flexShrink: 0, marginTop: 1 }}>
                    {new Date(movement.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
