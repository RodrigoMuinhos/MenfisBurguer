"use client";

import { useEffect, useState } from "react";
import { Bike, CheckCircle2, KeyRound, LogOut, MapPin, Phone, RefreshCw, User } from "lucide-react";
import { normalizeBackendOrder } from "@/services/orders/normalize";
import { Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { deliveryConfirmationCode, fmt } from "@/components/order/tracking";
import { ITEM_DESC } from "@/components/order/checkout";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
const DELIVERY_SESSION_KEY = "menfis_delivery_session";

export default function DeliveryPage() {
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem(DELIVERY_SESSION_KEY) ?? "");
  }, []);

  if (!token) {
    return <DeliveryLogin onLogin={setToken} />;
  }

  return <DeliveryRoutePanel token={token} onLogout={() => setToken("")} />;
}

function DeliveryLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    if (!API_URL) {
      setError("Backend nao configurado.");
      return;
    }
    if (!loginValue.trim() || !password.trim()) {
      setError("Informe login e senha do entregador.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: loginValue.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) throw new Error("login_failed");
      if (data.role !== "DELIVERY" && data.role !== "ADMIN") {
        throw new Error("role_not_allowed");
      }
      localStorage.setItem(DELIVERY_SESSION_KEY, data.token);
      onLogin(data.token);
    } catch {
      setError("Login ou senha do entregador inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4" style={{ background: "#fff" }}>
      <form
        className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          login();
        }}
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full" style={{ background: VERDE, color: ROSA }}>
          <Bike size={36} strokeWidth={2.5} />
        </div>
        <h1 className="mt-5 text-center text-3xl font-black uppercase tracking-widest" style={{ color: VERDE, fontFamily: "var(--menfis-font-display)" }}>
          Entrega
        </h1>
        <p className="mt-2 text-center text-xs font-bold leading-relaxed" style={{ color: VERDE, opacity: 0.62 }}>
          Acesso separado para o entregador ver rotas e confirmar pedidos com o codigo do cliente.
        </p>
        {error && (
          <p className="mt-4 rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: `${ROSA}80`, color: VERDE }}>
            {error}
          </p>
        )}
        <label className="mt-5 block text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: VERDE }}>
          Login
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-2xl px-4 py-3" style={{ border: `1.5px solid ${ROSA}` }}>
          <User size={18} strokeWidth={2.2} style={{ color: VERDE, opacity: 0.5 }} />
          <input
            value={loginValue}
            onChange={(event) => setLoginValue(event.target.value)}
            autoComplete="username"
            inputMode="numeric"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
            style={{ color: VERDE }}
          />
        </div>
        <label className="mt-3 block text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: VERDE }}>
          Senha
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-2xl px-4 py-3" style={{ border: `1.5px solid ${ROSA}` }}>
          <KeyRound size={18} strokeWidth={2.2} style={{ color: VERDE, opacity: 0.5 }} />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
            type="password"
            style={{ color: VERDE }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-2xl px-4 py-4 text-sm font-black uppercase tracking-widest disabled:opacity-60"
          style={{ background: VERDE, color: ROSA }}
        >
          {loading ? "Entrando" : "Entrar nas entregas"}
        </button>
      </form>
    </main>
  );
}

function DeliveryRoutePanel({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = orders.find((order) => order.id === selectedId) ?? orders[0];

  const loadOrders = async () => {
    if (!API_URL) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders/delivery-route`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem(DELIVERY_SESSION_KEY);
        onLogout();
        return;
      }
      if (!res.ok) throw new Error("load_failed");
      const rows = await res.json();
      const normalized = Array.isArray(rows) ? rows.map(normalizeBackendOrder) : [];
      setOrders(normalized);
      setSelectedId((current) => current || normalized[0]?.id || "");
    } catch {
      setMessage("Nao foi possivel carregar as entregas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const timer = window.setInterval(loadOrders, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const logout = () => {
    localStorage.removeItem(DELIVERY_SESSION_KEY);
    onLogout();
  };

  const confirmDelivery = async () => {
    if (!selected || !code.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/orders/${encodeURIComponent(selected.id)}/delivery-confirmation`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, actor: "motoboy" }),
      });
      if (!res.ok) throw new Error("invalid_code");
      setCode("");
      setMessage(`Entrega ${selected.id} confirmada.`);
      await loadOrders();
    } catch {
      setMessage("Codigo incorreto ou pedido nao esta em rota.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen" style={{ background: "#fff", color: VERDE }}>
      <header className="sticky top-0 z-30 px-4 py-4" style={{ background: VERDE, color: ROSA }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Menfi's</p>
            <h1 className="text-3xl font-black uppercase tracking-widest" style={{ fontFamily: "var(--menfis-font-display)" }}>
              Entregas
            </h1>
          </div>
          <div className="flex gap-2">
            <button onClick={loadOrders} className="rounded-2xl px-4 py-3 text-xs font-black uppercase" style={{ background: ROSA, color: VERDE }}>
              <RefreshCw size={15} className="inline" /> Atualizar
            </button>
            <button onClick={logout} className="rounded-2xl px-4 py-3 text-xs font-black uppercase" style={{ background: `${ROSA}30`, color: ROSA }}>
              <LogOut size={15} className="inline" /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-5 lg:grid-cols-[340px_1fr]">
        <aside className="flex flex-col gap-2">
          {orders.length === 0 && (
            <div className="rounded-2xl bg-white p-5 text-sm font-bold" style={{ border: `1.5px solid ${ROSA}` }}>
              Nenhuma entrega em rota agora.
            </div>
          )}
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelectedId(order.id)}
              className="rounded-2xl p-4 text-left"
              style={{
                background: selected?.id === order.id ? `${ROSA}55` : "#fff",
                border: `1.5px solid ${selected?.id === order.id ? VERDE : ROSA}`,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <strong className="text-xl">{order.id}</strong>
                <span className="rounded-full px-2 py-1 text-[10px] font-black uppercase" style={{ background: VERDE, color: ROSA }}>
                  Em rota
                </span>
              </div>
              <p className="mt-1 text-xs font-bold opacity-70">{order.customerName || "Cliente"} · {fmt(order.total)}</p>
              <p className="mt-1 text-[11px] font-bold opacity-55">{order.customerAddress || "Endereco nao informado"}</p>
            </button>
          ))}
        </aside>

        <section className="rounded-[24px] bg-white p-5" style={{ border: `1.5px solid ${ROSA}` }}>
          {!selected ? (
            <p className="py-16 text-center text-sm font-bold opacity-50">Selecione uma entrega.</p>
          ) : (
            <DeliveryDetails
              order={selected}
              code={code}
              setCode={setCode}
              loading={loading}
              message={message}
              onConfirm={confirmDelivery}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function DeliveryDetails({
  order,
  code,
  setCode,
  loading,
  message,
  onConfirm,
}: {
  order: Order;
  code: string;
  setCode: (value: string) => void;
  loading: boolean;
  message: string;
  onConfirm: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-45">Pedido em rota</p>
          <h2 className="text-4xl font-black" style={{ color: VERDE, fontFamily: "var(--menfis-font-display)" }}>{order.id}</h2>
          <p className="text-sm font-bold">{order.customerName || "Cliente sem nome"}</p>
        </div>
        <div className="rounded-2xl px-4 py-3 text-center" style={{ background: `${ROSA}55`, border: `1.5px solid ${VERDE}` }}>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Codigo esperado</p>
          <p className="text-3xl font-black tracking-widest">{deliveryConfirmationCode(order)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Info icon={<MapPin size={18} />} label="Endereco" value={order.customerAddress || "Nao informado"} />
        <Info icon={<Phone size={18} />} label="Telefone" value={order.customerPhone || "Nao informado"} />
      </div>

      <div className="mt-5 rounded-2xl p-4" style={{ background: "#fff", border: `1px solid ${ROSA}` }}>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-45">Itens</p>
        {order.items.map((item) => (
          <div key={`${order.id}-${item.id}`} className="border-b py-3 last:border-b-0" style={{ borderColor: ROSA }}>
            <div className="flex justify-between gap-3 text-sm font-black">
              <span>{item.qty}x {item.name}</span>
              <span>{fmt(item.price * item.qty)}</span>
            </div>
            {ITEM_DESC[item.id] && <p className="mt-1 text-[11px] font-bold opacity-55">{ITEM_DESC[item.id]}</p>}
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl p-4" style={{ background: "#fff", border: `1.5px solid ${VERDE}` }}>
        <div className="flex items-center gap-2">
          <KeyRound size={18} />
          <p className="text-sm font-black uppercase">Confirmar entrega com codigo do cliente</p>
        </div>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4))}
          inputMode="text"
          className="mt-3 w-full rounded-2xl px-4 py-4 text-center text-3xl font-black tracking-widest outline-none"
          style={{ border: `1.5px solid ${ROSA}`, color: VERDE }}
        />
        {message && <p className="mt-3 text-sm font-bold">{message}</p>}
        <button
          onClick={onConfirm}
          disabled={loading || code.length !== 4}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black uppercase tracking-widest disabled:opacity-50"
          style={{ background: VERDE, color: ROSA }}
        >
          <CheckCircle2 size={18} />
          Confirmar entregue
        </button>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "#fff", border: `1px solid ${ROSA}` }}>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-50">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-black">{value}</p>
    </div>
  );
}
