"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, CircleOff, LogOut, Plus, Printer, RefreshCw } from "lucide-react";
import { DiningDashboard, DiningOrder, DiningSession, DiningTable, TableKit, diningRequest } from "@/services/dining";
import { ROSA, VERDE } from "@/utils/theme";

const SESSION_KEY = "menfis_staff_session";
const money = (value: number) => `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;

export function StaffDiningApp() {
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [dashboard, setDashboard] = useState<DiningDashboard | null>(null);
  const [orders, setOrders] = useState<DiningOrder[]>([]);
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);
  const [prepareTable, setPrepareTable] = useState<DiningTable | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");
      if (stored.token) { setToken(String(stored.token)); setRole(String(stored.role || "STAFF")); }
    } catch { localStorage.removeItem(SESSION_KEY); }
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const [nextDashboard, nextOrders] = await Promise.all([
        diningRequest<DiningDashboard>("/api/staff/dining/dashboard", token),
        diningRequest<DiningOrder[]>("/api/staff/dining/orders", token),
      ]);
      setDashboard(nextDashboard); setOrders(nextOrders); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao atualizar o salão"); }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [refresh, token]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true); setError("");
    try { await action(); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível concluir"); }
    finally { setBusy(false); }
  };

  if (!token) return <StaffLogin onAuthenticated={(nextToken, nextRole) => { setToken(nextToken); setRole(nextRole); }} />;
  const selectedSession = dashboard?.openSessions.find((session) => session.table.id === selectedTable?.id);
  const selectedOrders = orders.filter((order) => order.tableName === selectedTable?.name);

  return (
    <main className="min-h-dvh" style={{ background: "#FFF9F5", color: VERDE }}>
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-4 shadow-sm" style={{ background: VERDE, color: ROSA }}>
        <img src="/logo_M.jpeg" alt="Menfi's" className="h-11 w-11 rounded-full object-cover" />
        <div className="min-w-0 flex-1"><h1 className="text-xl font-black uppercase tracking-wider">Menfi&apos;s Staff</h1><p className="text-[11px] font-bold opacity-70">Salão em tempo real · {role}</p></div>
        <button onClick={() => void refresh()} className="rounded-full p-3" aria-label="Atualizar"><RefreshCw size={19} /></button>
        <button onClick={() => { localStorage.removeItem(SESSION_KEY); setToken(""); }} className="rounded-full p-3" aria-label="Sair"><LogOut size={19} /></button>
      </header>
      <div className="mx-auto max-w-6xl p-4 pb-24">
        {error && <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-800">{friendlyError(error)}</div>}
        <StaffMetrics dashboard={dashboard} orders={orders} />
        <DiningMap dashboard={dashboard} orders={orders} onSelect={setSelectedTable} onPrepare={setPrepareTable} />
      </div>
      {prepareTable && dashboard && <PrepareDialog table={prepareTable} kits={dashboard.availableKits} busy={busy} onClose={() => setPrepareTable(null)} onSubmit={(kitId, customerName) => run(async () => { await diningRequest("/api/staff/dining/sessions", token, { method: "POST", body: JSON.stringify({ tableId: prepareTable.id, tableKitId: kitId, customerName: customerName || null }) }); setPrepareTable(null); })} />}
      {selectedTable && selectedSession && <TableDialog table={selectedTable} session={selectedSession} orders={selectedOrders} token={token} busy={busy} onRun={run} onClose={() => setSelectedTable(null)} />}
    </main>
  );
}

function StaffLogin({ onAuthenticated }: { onAuthenticated: (token: string, role: string) => void }) {
  const [login, setLogin] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/backend/auth/login", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login, password }) });
      if (!response.ok) throw new Error("Login ou senha inválidos");
      const session = await response.json();
      if (!["STAFF", "MANAGER", "ADMIN"].includes(session.role)) throw new Error("Este usuário não possui acesso ao Staff");
      const nextToken = session.token || "cookie";
      localStorage.setItem(SESSION_KEY, JSON.stringify({ token: nextToken, role: session.role }));
      onAuthenticated(nextToken, session.role);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível entrar"); }
    finally { setBusy(false); }
  };
  return <main className="grid min-h-dvh place-items-center p-5" style={{ background: VERDE }}><form onSubmit={submit} className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl"><img src="/logo_M.jpeg" alt="Menfi's" className="mx-auto h-20 w-20 rounded-full object-cover" /><h1 className="mt-4 text-center text-3xl font-black" style={{ color: VERDE }}>MENFI&apos;S STAFF</h1><p className="mt-1 text-center text-sm font-semibold opacity-60">Acesso da equipe do salão</p><label className="mt-6 block text-xs font-black uppercase">Usuário</label><input value={login} onChange={(e) => setLogin(e.target.value)} className="mt-2 w-full rounded-xl border p-4" autoComplete="username" /><label className="mt-4 block text-xs font-black uppercase">Senha</label><input value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border p-4" type="password" autoComplete="current-password" />{error && <p className="mt-3 text-sm font-bold text-red-700">{error}</p>}<button disabled={busy} className="mt-5 w-full rounded-xl p-4 text-sm font-black uppercase" style={{ background: ROSA, color: VERDE }}>{busy ? "Entrando..." : "Entrar no salão"}</button></form></main>;
}

function StaffMetrics({ dashboard, orders }: { dashboard: DiningDashboard | null; orders: DiningOrder[] }) {
  const todayTotal = orders.filter((o) => o.status !== "PAYMENT_REQUESTED").reduce((sum, o) => sum + Number(o.total), 0);
  return <section className="mb-5 grid grid-cols-3 gap-2">{[[money(todayTotal), "confirmado"], [String(orders.length), "pedidos"], [String(dashboard?.openSessions.length || 0), "mesas ocupadas"]].map(([value, label]) => <div key={label} className="rounded-2xl bg-white p-3 shadow-sm"><strong className="block text-base font-black sm:text-xl">{value}</strong><span className="text-[10px] font-black uppercase opacity-55">{label}</span></div>)}</section>;
}

function DiningMap({ dashboard, orders, onSelect, onPrepare }: { dashboard: DiningDashboard | null; orders: DiningOrder[]; onSelect: (table: DiningTable) => void; onPrepare: (table: DiningTable) => void }) {
  const areas = useMemo(() => Array.from(new Set((dashboard?.tables || []).map((table) => table.area))), [dashboard]);
  if (!dashboard) return <div className="py-20 text-center font-bold opacity-50">Carregando salão...</div>;
  return <div className="space-y-6">{areas.map((area) => <section key={area}><h2 className="mb-3 text-sm font-black uppercase tracking-[.2em]">{area}</h2><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{dashboard.tables.filter((table) => table.area === area && table.active).map((table) => { const session = dashboard.openSessions.find((item) => item.table.id === table.id); const tableOrders = orders.filter((order) => order.tableName === table.name); const state = tableState(session, tableOrders); return <button key={table.id} onClick={() => session ? onSelect(table) : onPrepare(table)} className="rounded-2xl border-2 bg-white p-4 text-left shadow-sm" style={{ borderColor: state.color }}><div className="flex items-start justify-between"><div><strong className="text-xl font-black">{table.name}</strong><p className="mt-1 text-xs font-black uppercase" style={{ color: state.color }}>{state.label}</p></div><span className="rounded-full px-3 py-2 text-xs font-black" style={{ background: `${state.color}18`, color: state.color }}>{session?.kit.code || "LIVRE"}</span></div>{session ? <div className="mt-4 border-t pt-3"><p className="font-black">{session.customerName || "Aguardando nome"}</p><p className="mt-1 text-xs font-bold opacity-60">{tableOrders.length ? `#${tableOrders.at(-1)?.number} · ${money(tableOrders.reduce((s, o) => s + Number(o.total), 0))}` : "Nenhum pedido"}</p></div> : <div className="mt-4 flex items-center gap-2 text-xs font-black uppercase"><Plus size={15} /> Receber cliente</div>}</button>; })}</div></section>)}</div>;
}

function PrepareDialog({ table, kits, busy, onClose, onSubmit }: { table: DiningTable; kits: TableKit[]; busy: boolean; onClose: () => void; onSubmit: (kitId: string, customerName: string) => void }) {
  const [kitId, setKitId] = useState(kits[0]?.id || ""); const [name, setName] = useState("");
  return <Overlay onClose={onClose}><h2 className="text-2xl font-black">Preparar {table.name}</h2><p className="mt-1 text-sm font-bold opacity-55">Associe um kit disponível. O cliente poderá informar o nome pelo QR.</p><label className="mt-5 block text-xs font-black uppercase">Kit físico</label><select value={kitId} onChange={(e) => setKitId(e.target.value)} className="mt-2 w-full rounded-xl border p-4">{kits.map((kit) => <option key={kit.id} value={kit.id}>{kit.name} · {kit.code}</option>)}</select><label className="mt-4 block text-xs font-black uppercase">Nome (opcional)</label><input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border p-4" placeholder="O cliente pode preencher pelo QR" /><button disabled={busy || !kitId} onClick={() => onSubmit(kitId, name)} className="mt-5 w-full rounded-xl p-4 font-black uppercase text-white" style={{ background: VERDE }}>{busy ? "Preparando..." : "Preparar mesa"}</button>{kits.length === 0 && <p className="mt-3 text-sm font-bold text-red-700">Nenhum kit disponível.</p>}</Overlay>;
}

function TableDialog({ table, session, orders, token, busy, onRun, onClose }: { table: DiningTable; session: DiningSession; orders: DiningOrder[]; token: string; busy: boolean; onRun: (action: () => Promise<unknown>) => Promise<void>; onClose: () => void }) {
  const payment = orders.find((o) => o.status === "PAYMENT_REQUESTED"); const ready = orders.find((o) => o.status === "READY");
  const call = (path: string, body?: unknown) => onRun(() => diningRequest(path, token, { method: "POST", ...(body ? { body: JSON.stringify(body) } : {}) }));
  return <Overlay onClose={onClose}><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase opacity-50">{table.area}</p><h2 className="text-3xl font-black">{table.name}</h2><p className="font-bold">{session.customerName || "Aguardando nome"} · {session.kit.name}</p></div><span className="rounded-full px-3 py-2 text-xs font-black" style={{ background: lightColor(session.kit.lightState), color: "#fff" }}>{session.kit.lightState}</span></div><div className="mt-5 space-y-3">{orders.length === 0 ? <p className="rounded-xl bg-stone-50 p-4 text-sm font-bold opacity-60">Aguardando o primeiro pedido.</p> : orders.map((order) => <article key={order.publicOrderId} className="rounded-2xl border p-4"><div className="flex justify-between"><strong className="text-xl">#{order.number}</strong><strong>{money(order.total)}</strong></div><p className="mt-1 text-xs font-black uppercase opacity-55">{orderStatus(order.status)}</p><div className="mt-3 space-y-1 text-sm font-bold">{order.items.map((item, index) => <p key={index}>{Number(item.quantity ?? item.qty ?? 1)}x {String(item.name ?? "Item")}</p>)}</div>{order.status === "PAYMENT_REQUESTED" && <div className="mt-4 grid grid-cols-2 gap-2">{[["CARTAO", "Cartão"], ["DINHEIRO", "Dinheiro"], ["PIX_MANUAL", "PIX manual"], ["OUTRO", "Outro"]].map(([method, label]) => <button key={method} disabled={busy} onClick={() => call(`/api/staff/dining/orders/${order.publicOrderId}/confirm-payment`, { paymentMethod: method })} className="rounded-xl bg-emerald-600 p-3 text-xs font-black uppercase text-white">{label}</button>)}</div>}{order.status === "READY" && <button disabled={busy} onClick={() => call(`/api/staff/dining/orders/${order.publicOrderId}/picked-up`)} className="mt-4 w-full rounded-xl bg-emerald-600 p-4 text-xs font-black uppercase text-white"><Check className="mr-2 inline" size={16} /> Pedido retirado</button>}</article>)}</div><div className="mt-5 grid grid-cols-3 gap-2"><LightButton label="Normal" color="#6B7280" onClick={() => call(`/api/staff/dining/kits/${session.kit.id}/light`, { state: "NORMAL", reason: "staff_manual" })} /><LightButton label="Azul" color="#2563EB" onClick={() => call(`/api/staff/dining/kits/${session.kit.id}/light`, { state: "BLUE", reason: "staff_manual" })} /><LightButton label="Verde" color="#16A34A" onClick={() => call(`/api/staff/dining/kits/${session.kit.id}/light`, { state: "GREEN", reason: "staff_manual" })} /><LightButton label="Vermelho" color="#DC2626" onClick={() => call(`/api/staff/dining/kits/${session.kit.id}/light`, { state: "RED", reason: "staff_manual" })} /><LightButton label="Desligar" color="#111827" onClick={() => call(`/api/staff/dining/kits/${session.kit.id}/light`, { state: "OFF", reason: "staff_manual" })} /><button onClick={() => window.print()} className="rounded-xl border p-3 text-xs font-black uppercase"><Printer className="mx-auto mb-1" size={16} /> Conta</button></div><button disabled={busy || Boolean(payment || ready || orders.some((o) => ["PAID", "ACCEPTED", "IN_PREPARATION"].includes(o.status)))} onClick={() => void call(`/api/staff/dining/sessions/${session.id}/close`)} className="mt-4 w-full rounded-xl border border-red-300 p-4 text-xs font-black uppercase text-red-700"><CircleOff className="mr-2 inline" size={16} /> Finalizar sessão</button></Overlay>;
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 sm:max-w-xl sm:rounded-[28px]">{children}<button onClick={onClose} className="mt-4 w-full rounded-xl bg-stone-100 p-3 text-xs font-black uppercase">Fechar</button></section></div>; }
function LightButton({ label, color, onClick }: { label: string; color: string; onClick: () => void }) { return <button onClick={onClick} className="rounded-xl p-3 text-xs font-black uppercase text-white" style={{ background: color }}>{label}</button>; }
function tableState(session: DiningSession | undefined, orders: DiningOrder[]) { if (!session) return { label: "Livre", color: "#94A3B8" }; if (orders.some((o) => o.status === "READY")) return { label: "Pronto · retirar", color: "#16A34A" }; if (orders.some((o) => o.status === "PAYMENT_REQUESTED")) return { label: "Pagamento solicitado", color: "#2563EB" }; if (orders.some((o) => ["PAID", "ACCEPTED", "IN_PREPARATION"].includes(o.status))) return { label: "Em preparo", color: "#F59E0B" }; return { label: "Mesa ativa", color: "#7C3AED" }; }
function lightColor(state: string) { return ({ BLUE: "#2563EB", GREEN: "#16A34A", RED: "#DC2626", OFF: "#111827", NORMAL: "#6B7280" } as Record<string, string>)[state] || "#6B7280"; }
function orderStatus(status: string) { return ({ PAYMENT_REQUESTED: "Pagamento solicitado", PAID: "Recebido pela cozinha", ACCEPTED: "Aceito", IN_PREPARATION: "Em preparo", READY: "Pronto para retirada", PICKED_UP: "Retirado" } as Record<string, string>)[status] || status; }
function friendlyError(value: string) { if (value.includes("dining_session_has_active_orders")) return "A sessão ainda possui pedido aguardando pagamento, em preparo ou pronto para retirada."; if (value.includes("table_or_kit_already_in_use")) return "A mesa ou o kit já está em uso."; return value; }
