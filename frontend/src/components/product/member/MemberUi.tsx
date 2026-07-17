import Image from "next/image";
import { motion } from "motion/react";
import { useState, type ElementType, type HTMLInputTypeAttribute, type ReactNode } from "react";
import { Eye, EyeOff, ChevronRight, PackageSearch, X } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import type { Order } from "@/types/order";
import { STATUS_COPY, fmt } from "@/components/order/tracking";
export function ProfileInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  revealable = false,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  revealable?: boolean;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  maxLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  const inputType = revealable && visible ? "text" : type;

  return (
    <label className="grid min-w-0 gap-1">
      <span className="text-[10px] font-black uppercase tracking-wider text-black/40">
        {label}
      </span>
      <span className="relative block">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={inputType}
          inputMode={inputMode}
          maxLength={maxLength}
          className="min-w-0 w-full rounded-2xl px-4 py-3 text-base outline-none"
          style={{
            border: `1.5px solid ${VERDE}16`,
            color: VERDE,
            paddingRight: revealable ? "3.25rem" : undefined,
          }}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full"
            style={{ background: `${VERDE}08`, color: VERDE }}
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          >
            {visible ? <EyeOff size={18} strokeWidth={2.4} /> : <Eye size={18} strokeWidth={2.4} />}
          </button>
        )}
      </span>
    </label>
  );
}

export function ActiveProfileOrderCard({
  order,
  onOpen,
}: {
  order: Order;
  onOpen: () => void;
}) {
  const status = STATUS_COPY[order.status] ?? STATUS_COPY.PAYMENT_PENDING;
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-2xl p-4 text-left"
      style={{ background: VERDE, color: ROSA }}
    >
      <div className="flex items-start gap-3">
        <PackageSearch size={20} strokeWidth={2.5} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-wider opacity-70">
            Acompanhe seu pedido
          </p>
          <p className="mt-1 text-lg font-black leading-none">
            {order.id} · {status.label}
          </p>
          <p className="mt-2 line-clamp-2 text-xs font-bold leading-relaxed opacity-75">
            {order.items.map((item) => `${item.qty}x ${item.name}`).join(" · ")}
          </p>
          <p className="mt-2 text-sm font-black">{fmt(order.total)}</p>
        </div>
      </div>
    </button>
  );
}

export function OrderHistoryRow({
  order,
  onOpen,
  onRepeat,
}: {
  order: Order;
  onOpen: () => void;
  onRepeat: () => void;
}) {
  const status = STATUS_COPY[order.status] ?? STATUS_COPY.PAYMENT_PENDING;
  const activeOrder = !["DELIVERED", "CANCELLED"].includes(order.status);
  const canRepeat = order.status === "DELIVERED" && order.items.length > 0;
  const date = new Date(order.timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "#fff", border: `1px solid ${VERDE}12` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black leading-tight">
            Pedido {order.id}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide opacity-55">
            {status.label} · {date}
          </p>
          <p className="mt-2 line-clamp-2 text-xs font-bold leading-relaxed opacity-70">
            {order.items.map((item) => `${item.qty}x ${item.name}`).join(" · ")}
          </p>
        </div>
        <p className="shrink-0 text-sm font-black">{fmt(order.total)}</p>
      </div>
      {activeOrder && (
        <button
          onClick={onOpen}
          className="mt-3 w-full rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-wider"
          style={{ background: VERDE, color: ROSA }}
        >
          Acompanhar pedido
        </button>
      )}
      {canRepeat && (
        <button
          onClick={onRepeat}
          className="mt-3 w-full rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-wider"
          style={{ background: `${VERDE}10`, color: VERDE }}
        >
          Pedir novamente
        </button>
      )}
    </div>
  );
}

export function SidePanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[75] flex justify-end bg-black/45"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="flex h-full w-full max-w-[420px] flex-col overflow-hidden"
        style={{
          background: "#fff",
          color: VERDE,
          boxShadow: "-24px 0 70px rgba(0,0,0,0.22)",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-4 py-3"
          style={{ background: "rgba(255,255,255,0.96)", borderColor: `${VERDE}12`, backdropFilter: "blur(16px)" }}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-45">Menfi's</p>
            <h2 className="truncate text-base font-black uppercase tracking-wide">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: `${VERDE}08`, color: VERDE }}
            aria-label="Fechar painel"
          >
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}

export function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "#fff", border: `1px solid ${VERDE}12` }}>
      <p className="text-xs font-black uppercase tracking-wider">{title}</p>
      <div className="mt-3 grid gap-2">{children}</div>
    </div>
  );
}

export function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider opacity-45">{label}</p>
      <p className="mt-0.5 text-sm font-bold">{value}</p>
    </div>
  );
}

export function ProfileMenuButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-xs font-black uppercase tracking-wider"
      style={{ background: "#fff", color: VERDE, border: `1px solid ${VERDE}12` }}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${ROSA}55` }}>
        <Icon size={18} strokeWidth={2.4} />
      </span>
      <span className="min-w-0 flex-1">{label}</span>
      <ChevronRight size={17} strokeWidth={2.6} className="shrink-0 opacity-55" />
    </button>
  );
}

export function ProfileMenuLink({
  icon: Icon,
  label,
  href,
}: {
  icon: ElementType;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-xs font-black uppercase tracking-wider"
      style={{ background: "#fff", color: VERDE, border: `1px solid ${VERDE}12` }}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${ROSA}55` }}>
        <Icon size={18} strokeWidth={2.4} />
      </span>
      <span className="min-w-0 flex-1">{label}</span>
      <ChevronRight size={17} strokeWidth={2.6} className="shrink-0 opacity-55" />
    </a>
  );
}

