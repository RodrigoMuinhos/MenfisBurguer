"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Armchair, ExternalLink, Lightbulb, Plus, QrCode, RefreshCw, RotateCcw } from "lucide-react";
import { DiningDashboard, DiningOrder, DiningTable, TableKit, diningRequest } from "@/services/dining";
import { ROSA, VERDE } from "@/utils/theme";

export function DiningManagementView({ adminToken }: { adminToken: string }) {
  const [dashboard, setDashboard] = useState<DiningDashboard | null>(null);
  const [kits, setKits] = useState<TableKit[]>([]);
  const [orders, setOrders] = useState<DiningOrder[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [newTable, setNewTable] = useState({ name: "", code: "", area: "SALÃO" });
  const [newKit, setNewKit] = useState({ name: "", code: "", deviceId: "" });

  const refresh = useCallback(async () => {
    try {
      const [nextDashboard, nextKits, nextOrders] = await Promise.all([
        diningRequest<DiningDashboard>("/api/staff/dining/dashboard", adminToken),
        diningRequest<TableKit[]>("/api/admin/dining/kits", adminToken),
        diningRequest<DiningOrder[]>("/api/staff/dining/orders", adminToken),
      ]);
      setDashboard(nextDashboard); setKits(nextKits); setOrders(nextOrders); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao carregar o salão"); }
  }, [adminToken]);

  useEffect(() => { void refresh(); }, [refresh]);
  const run = async (action: () => Promise<unknown>) => { setBusy(true); setError(""); try { await action(); await refresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Operação não concluída"); } finally { setBusy(false); } };
  const occupied = dashboard?.openSessions.length || 0;
  const pending = orders.filter((order) => order.status === "PAYMENT_REQUESTED").length;
  const grouped = useMemo(() => Array.from(new Set((dashboard?.tables || []).map((table) => table.area))), [dashboard]);

  return <div className="mx-auto max-w-7xl space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.22em] opacity-50">Operação presencial</p><h1 className="text-3xl font-black" style={{ color: VERDE }}>Salão PDV</h1><p className="mt-1 text-sm font-semibold opacity-60">Supervisão de mesas, kits, sessões e pedidos do QR.</p></div><div className="flex gap-2"><a href="/staff" target="_blank" className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase" style={{ background: VERDE, color: ROSA }}><ExternalLink size={15} /> Abrir Staff</a><button onClick={() => void refresh()} className="rounded-xl border bg-white p-3"><RefreshCw size={18} /></button></div></div>
    {error && <div className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>}
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[[dashboard?.tables.length || 0, "Mesas"], [occupied, "Ocupadas"], [kits.filter((k) => k.status === "AVAILABLE").length, "Kits livres"], [pending, "Pagamentos"]].map(([value, label]) => <div key={label} className="rounded-2xl border bg-white p-4"><strong className="block text-2xl font-black">{value}</strong><span className="text-xs font-black uppercase opacity-50">{label}</span></div>)}</div>
    <section className="rounded-2xl border bg-white p-4"><h2 className="text-lg font-black">Mapa operacional</h2><div className="mt-4 space-y-5">{grouped.map((area) => <div key={area}><p className="mb-2 text-xs font-black uppercase tracking-widest opacity-50">{area}</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{dashboard?.tables.filter((table) => table.area === area).map((table) => { const session = dashboard.openSessions.find((s) => s.table.id === table.id); const tableOrders = orders.filter((o) => o.tableName === table.name); return <div key={table.id} className="rounded-xl border p-3" style={{ opacity: table.active ? 1 : .5 }}><div className="flex justify-between"><strong>{table.name}</strong><span className="text-[10px] font-black uppercase">{session ? session.kit.code : "Livre"}</span></div><p className="mt-2 text-xs font-bold opacity-60">{session?.customerName || (table.active ? "Disponível" : "Desativada")}</p>{tableOrders.at(-1) && <p className="mt-1 text-xs font-black">#{tableOrders.at(-1)?.number} · {tableOrders.at(-1)?.status}</p>}</div>; })}</div></div>)}</div></section>
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border bg-white p-4"><div className="flex items-center gap-2"><Armchair size={19} /><h2 className="text-lg font-black">Mesas</h2></div><form onSubmit={(e) => { e.preventDefault(); void run(async () => { await diningRequest("/api/admin/dining/tables", adminToken, { method: "POST", body: JSON.stringify({ ...newTable, active: true }) }); setNewTable({ name: "", code: "", area: "SALÃO" }); }); }} className="mt-4 grid grid-cols-2 gap-2"><input required value={newTable.name} onChange={(e) => setNewTable({ ...newTable, name: e.target.value })} placeholder="Nome da mesa" className="rounded-xl border p-3" /><input required value={newTable.code} onChange={(e) => setNewTable({ ...newTable, code: e.target.value })} placeholder="Código" className="rounded-xl border p-3" /><input required value={newTable.area} onChange={(e) => setNewTable({ ...newTable, area: e.target.value })} placeholder="Área" className="rounded-xl border p-3" /><button disabled={busy} className="flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-black uppercase text-white" style={{ background: VERDE }}><Plus size={15} /> Criar mesa</button></form><div className="mt-4 divide-y">{dashboard?.tables.map((table) => <TableAdminRow key={table.id} table={table} busy={busy} onToggle={() => run(() => diningRequest(`/api/admin/dining/tables/${table.id}`, adminToken, { method: "PATCH", body: JSON.stringify({ name: table.name, code: table.code, area: table.area, active: !table.active, positionX: table.positionX, positionY: table.positionY }) }))} />)}</div></section>
      <section className="rounded-2xl border bg-white p-4"><div className="flex items-center gap-2"><QrCode size={19} /><h2 className="text-lg font-black">Kits e QR Codes</h2></div><form onSubmit={(e) => { e.preventDefault(); void run(async () => { await diningRequest("/api/admin/dining/kits", adminToken, { method: "POST", body: JSON.stringify({ ...newKit, active: true }) }); setNewKit({ name: "", code: "", deviceId: "" }); }); }} className="mt-4 grid grid-cols-2 gap-2"><input required value={newKit.name} onChange={(e) => setNewKit({ ...newKit, name: e.target.value })} placeholder="Nome do kit" className="rounded-xl border p-3" /><input required value={newKit.code} onChange={(e) => setNewKit({ ...newKit, code: e.target.value })} placeholder="Código" className="rounded-xl border p-3" /><input value={newKit.deviceId} onChange={(e) => setNewKit({ ...newKit, deviceId: e.target.value })} placeholder="Device ID" className="rounded-xl border p-3" /><button disabled={busy} className="flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-black uppercase text-white" style={{ background: VERDE }}><Plus size={15} /> Criar kit</button></form><div className="mt-4 space-y-3">{kits.map((kit) => <div key={kit.id} className="rounded-xl border p-3"><div className="flex items-start justify-between"><div><strong>{kit.name}</strong><p className="text-xs font-bold opacity-55">{kit.code} · {kit.status} · luz {kit.lightState}</p></div><span className="rounded-full px-2 py-1 text-[10px] font-black" style={{ background: kit.active ? "#DCFCE7" : "#FEE2E2" }}>{kit.active ? "ATIVO" : "INATIVO"}</span></div><p className="mt-2 break-all rounded-lg bg-stone-50 p-2 text-[10px] font-mono">/pedido/k/{kit.qrToken}</p><div className="mt-2 flex flex-wrap gap-2"><button disabled={busy || kit.status === "IN_USE"} onClick={() => void run(() => diningRequest(`/api/admin/dining/kits/${kit.id}/regenerate-token`, adminToken, { method: "POST" }))} className="rounded-lg border px-3 py-2 text-[10px] font-black uppercase"><RotateCcw className="mr-1 inline" size={13} /> Regerar QR</button>{["NORMAL", "BLUE", "GREEN", "RED", "OFF"].map((state) => <button key={state} disabled={busy} title={`Luz ${state}`} onClick={() => void run(() => diningRequest(`/api/admin/dining/kits/${kit.id}/light`, adminToken, { method: "POST", body: JSON.stringify({ state, reason: "erp_test" }) }))} className="rounded-lg border p-2"><Lightbulb size={13} /></button>)}</div></div>)}</div></section>
    </div>
  </div>;
}

function TableAdminRow({ table, busy, onToggle }: { table: DiningTable; busy: boolean; onToggle: () => Promise<void> }) { return <div className="flex items-center justify-between py-3"><div><strong>{table.name}</strong><p className="text-xs font-bold opacity-50">{table.area} · {table.code}</p></div><button disabled={busy} onClick={() => void onToggle()} className="rounded-full px-3 py-2 text-[10px] font-black uppercase" style={{ background: table.active ? "#DCFCE7" : "#F3F4F6", color: table.active ? "#166534" : "#4B5563" }}>{table.active ? "Ativa" : "Desativada"}</button></div>; }
