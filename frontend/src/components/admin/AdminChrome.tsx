import type { ElementType } from "react";
import { BellRing, Check, LogOut } from "lucide-react";
import { Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import type { AdminTab } from "./AdminPanel";
import { fmt } from "./shared";

type AdminTabItem = {
  id: AdminTab;
  label: string;
  Icon: ElementType;
};

export function AdminHeader({
  activeOrders,
  onClose,
}: {
  activeOrders: number;
  onClose: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 pt-5 pb-4"
      style={{ background: VERDE, borderBottom: `2px solid ${ROSA}22` }}
    >
      <img
        src="/logo_M_square.png"
        alt="Admin"
        width={36}
        height={36}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          objectFit: "cover",
          background: "#fff",
          border: `1.5px solid ${ROSA}55`,
        }}
      />
      <div className="flex-1">
        <p
          className="font-black uppercase tracking-widest"
          style={{
            color: ROSA,
            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
            fontSize: "1.2rem",
            letterSpacing: "0.15em",
            lineHeight: 1,
          }}
        >
          Menfi's ERP
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: `${ROSA}70` }}>
          {activeOrders} pedido{activeOrders !== 1 ? "s" : ""} ativo
          {activeOrders !== 1 ? "s" : ""}
        </p>
      </div>
      <button
        onClick={onClose}
        className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-black uppercase tracking-wider"
        style={{
          background: `${ROSA}20`,
          border: "none",
          color: ROSA,
          cursor: "pointer",
        }}
      >
        <LogOut size={16} strokeWidth={2.5} />
        Sair
      </button>
    </div>
  );
}

export function AdminTabs({
  tabs,
  tab,
  tabCount,
  onChange,
}: {
  tabs: AdminTabItem[];
  tab: AdminTab;
  tabCount: Partial<Record<AdminTab, number>>;
  onChange: (tab: AdminTab) => void;
}) {
  return (
    <div
      className="flex"
      style={{ background: VERDE, borderBottom: `2px solid ${ROSA}22` }}
    >
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-wider"
          style={{
            background: tab === id ? ROSA : "none",
            color: tab === id ? VERDE : `${ROSA}60`,
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <Icon size={13} strokeWidth={2} />
          {label}
          {Number(tabCount[id] ?? 0) > 0 && (
            <span
              className="flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] font-black"
              style={{
                background: tab === id ? VERDE : "#FDE047",
                color: tab === id ? ROSA : "#713F12",
              }}
            >
              {tabCount[id]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function PayOnDeliverySettings({
  enabled,
  saving,
  disabled,
  onToggle,
}: {
  enabled: boolean;
  saving: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="mb-4 flex items-center justify-between gap-4 rounded-2xl p-4"
      style={{ background: "#fff", border: `1.5px solid ${VERDE}18` }}
    >
      <div>
        <p className="text-sm font-black uppercase" style={{ color: VERDE }}>
          Pagar na entrega
        </p>
        <p className="mt-1 text-xs font-bold opacity-55" style={{ color: VERDE }}>
          Quando desligado, esta opcao desaparece imediatamente do delivery web.
        </p>
      </div>
      <button
        onClick={onToggle}
        disabled={saving || disabled}
        className="min-w-24 rounded-full px-4 py-3 text-xs font-black uppercase"
        style={{
          background: enabled ? "#16A34A" : "#E5E7EB",
          color: enabled ? "#fff" : "#4B5563",
          opacity: saving ? 0.6 : 1,
        }}
      >
        {enabled ? "Ligado" : "Desligado"}
      </button>
    </div>
  );
}

export function PaymentRequestsAlert({
  orders,
  onConfirm,
}: {
  orders: Order[];
  onConfirm: (id: string) => void;
}) {
  if (orders.length === 0) return null;

  return (
    <div
      className="mb-4 rounded-2xl p-4"
      style={{
        background: "#FEF3C7",
        border: "2px solid #F59E0B",
        color: "#78350F",
        boxShadow: "0 12px 28px rgba(245,158,11,0.18)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ background: "#F59E0B", color: "#fff" }}
        >
          <BellRing size={22} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black uppercase tracking-wide">
            Solicitacao de pagamento aberta, ir ao caixa
          </p>
          <p className="mt-1 text-xs font-bold opacity-75">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""} aguardando
            confirmacao presencial.
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {orders.map((order) => (
          <button
            key={order.id}
            onClick={() => onConfirm(order.id)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
            style={{ background: "#16A34A", color: "#fff" }}
          >
            <Check size={15} />
            {order.id} - {fmt(order.total)} - Confirmar recebido
          </button>
        ))}
      </div>
    </div>
  );
}
