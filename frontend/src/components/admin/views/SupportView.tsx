import { CheckCircle2, Clock, MessageCircle, Phone } from "lucide-react";
import { motion } from "motion/react";
import { ROSA, VERDE } from "@/utils/theme";
import { SupportTicket } from "../shared";
function supportTypeLabel(type: string) {
  return (
    {
      SUPPORT_PAYMENT: "Pagamento",
      SUPPORT_DELIVERY: "Entrega",
      ORDER_DELAYED: "Atraso",
      ORDER_CHANGE_REQUEST: "Alteração",
      CANCEL_REQUEST: "Cancelamento",
      DELIVERY_PROBLEM: "Entrega",
      PAYMENT_ERROR: "Pagamento",
    }[type] ?? type
  );
}
function minutesSince(value: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  return minutes < 1 ? "agora" : `${minutes} min`;
}

export function SupportView({
  tickets,
  onResolve,
}: {
  tickets: SupportTicket[];
  onResolve: (id: string) => void;
}) {
  const pending = tickets.filter((ticket) => ticket.status !== "RESOLVED");
  const resolved = tickets.filter((ticket) => ticket.status === "RESOLVED");
  const avgResponse = resolved.length
    ? Math.round(
        resolved.reduce((sum, ticket) => {
          const end = ticket.resolvedAt
            ? new Date(ticket.resolvedAt).getTime()
            : Date.now();
          return sum + Math.max(0, end - new Date(ticket.createdAt).getTime());
        }, 0) /
          resolved.length /
          60000,
      )
    : 0;

  const groups = [
    { label: "Pendentes", value: pending.length },
    { label: "Resolvidos", value: resolved.length },
    { label: "SLA médio", value: resolved.length ? `${avgResponse} min` : "-" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {groups.map((group) => (
          <div
            key={group.label}
            className="rounded-2xl p-3"
            style={{ background: "#fff", border: `1.5px solid ${VERDE}10` }}
          >
            <p
              className="text-[9px] font-black uppercase tracking-widest"
              style={{ color: VERDE, opacity: 0.42 }}
            >
              {group.label}
            </p>
            <p
              className="font-black mt-1"
              style={{
                color: VERDE,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "1.35rem",
              }}
            >
              {group.value}
            </p>
          </div>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <MessageCircle
            size={40}
            strokeWidth={1.5}
            style={{ color: VERDE, opacity: 0.18 }}
          />
          <p
            className="text-xs font-black uppercase tracking-widest"
            style={{ color: VERDE, opacity: 0.35 }}
          >
            Nenhum chamado de suporte
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => {
            const isPending = ticket.status !== "RESOLVED";
            const urgent =
              isPending &&
              Date.now() - new Date(ticket.createdAt).getTime() > 5 * 60000;
            return (
              <div
                key={ticket.id}
                className="rounded-2xl p-4"
                style={{
                  background: isPending ? "#fff" : `${VERDE}06`,
                  border: `1.5px solid ${urgent ? "#F59E0B" : ROSA}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
                        style={{ background: ROSA, color: VERDE }}
                      >
                        {supportTypeLabel(ticket.type)}
                      </span>
                      {urgent && (
                        <span
                          className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
                          style={{ background: "#FFFBEB", color: "#92400E" }}
                        >
                          +5 min sem resposta
                        </span>
                      )}
                    </div>
                    <p className="font-black mt-2" style={{ color: VERDE }}>
                      Pedido {ticket.orderId}
                    </p>
                    <p
                      className="text-sm font-bold mt-1"
                      style={{ color: VERDE }}
                    >
                      {ticket.reason}
                    </p>
                    <p
                      className="text-[11px] mt-1"
                      style={{ color: VERDE, opacity: 0.55 }}
                    >
                      Status pedido: {ticket.orderStatus} · aberto{" "}
                      {minutesSince(ticket.createdAt)}
                    </p>
                    {ticket.customerPhone && (
                      <a
                        href={`https://wa.me/${ticket.customerPhone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex mt-3 text-xs font-black uppercase tracking-wider"
                        style={{ color: VERDE }}
                      >
                        Abrir WhatsApp
                      </a>
                    )}
                  </div>
                  {isPending && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onResolve(ticket.id)}
                      className="rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider"
                      style={{ background: VERDE, color: ROSA, border: "none" }}
                    >
                      Resolvido
                    </motion.button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── DASHBOARD ─────────────────────────────────────── */
