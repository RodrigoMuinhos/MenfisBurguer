import { motion } from "motion/react";
import { AlertCircle, ChevronLeft, LucideIcon } from "lucide-react";
import { Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { fmt } from "../tracking";
import { ITEM_DESC } from "../checkout";

export function TrackingOrderDetails({
  order,
  pay,
  PayIcon,
  goHome,
}: {
  order: Order;
  pay: { bg: string; border: string; color: string; label: string; copy: string };
  PayIcon: LucideIcon;
  goHome?: () => void;
}) {
  return (
    <>
      <div className="rounded-2xl p-4" style={{ background: pay.bg, border: `1.5px solid ${pay.border}` }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fff", color: pay.color }}>
            {pay.label.includes("não") ? <AlertCircle size={18} strokeWidth={2.3} /> : <PayIcon size={18} strokeWidth={2.3} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-wide" style={{ color: pay.color }}>
              {pay.label}
            </p>
            <p className="text-[11px] leading-relaxed mt-1" style={{ color: pay.color, opacity: 0.72 }}>
              {pay.copy}
            </p>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ background: "#fff", border: `1.5px solid ${ROSA}`, boxShadow: "0 14px 36px rgba(31,61,46,0.07)" }}
      >
        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: VERDE, opacity: 0.4 }}>
          Itens do pedido
        </p>
        {order.items.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="flex justify-between py-2"
            style={{ borderBottom: index < order.items.length - 1 ? `1px solid ${ROSA}` : "none" }}
          >
            <span className="text-xs" style={{ color: VERDE }}>
              <span className="font-bold">
                {item.qty}x {item.name}
              </span>
              {ITEM_DESC[item.id] && (
                <span className="mt-1 block text-[11px] leading-relaxed opacity-55">
                  {ITEM_DESC[item.id]}
                </span>
              )}
            </span>
            <span className="text-xs font-bold" style={{ color: VERDE }}>
              {fmt(item.price * item.qty)}
            </span>
          </div>
        ))}
        <div className="flex justify-between items-center pt-3 mt-1" style={{ borderTop: `1px solid ${ROSA}` }}>
          <span className="text-sm font-black uppercase tracking-wider" style={{ color: VERDE }}>
            Total
          </span>
          <span className="font-black" style={{ color: VERDE, fontFamily: "var(--menfis-font-display)", fontSize: "1.4rem" }}>
            {fmt(order.total)}
          </span>
        </div>
      </div>

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
          Voltar ao cardápio
        </motion.button>
      )}
    </>
  );
}
