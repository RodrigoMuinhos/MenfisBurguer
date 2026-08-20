"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Lightbulb,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Pencil,
  Trash2,
  Pause,
  Play,
} from "lucide-react";
import {
  DiningDashboard,
  DiningOrder,
  DiningTable,
  TableKit,
  diningRequest,
} from "@/services/dining";
import { ROSA, VERDE } from "@/utils/theme";

export function DiningManagementView({ adminToken }: { adminToken: string }) {
  const [dashboard, setDashboard] = useState<DiningDashboard | null>(null);
  const [kits, setKits] = useState<TableKit[]>([]);
  const [orders, setOrders] = useState<DiningOrder[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [newStation, setNewStation] = useState({
    name: "",
    code: "",
    area: "SALÃO",
    deviceId: "",
    installedByStaff: "RODRIGO",
  });
  const [editingTableId, setEditingTableId] = useState<string | null>(null);

  const resetStationForm = () => {
    setNewStation({ name: "", code: "", area: "SALÃO", deviceId: "", installedByStaff: "RODRIGO" });
    setEditingTableId(null);
  };

  const refresh = useCallback(async () => {
    try {
      const [nextDashboard, nextKits, nextOrders] = await Promise.all([
        diningRequest<DiningDashboard>(
          "/api/staff/dining/dashboard",
          adminToken,
        ),
        diningRequest<TableKit[]>("/api/admin/dining/kits", adminToken),
        diningRequest<DiningOrder[]>("/api/staff/dining/orders", adminToken),
      ]);
      setDashboard(nextDashboard);
      setKits(nextKits);
      setOrders(nextOrders);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Falha ao carregar o salão",
      );
    }
  }, [adminToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Operação não concluída",
      );
    } finally {
      setBusy(false);
    }
  };
  const occupied = dashboard?.openSessions.length || 0;
  const pending = orders.filter(
    (order) => order.status === "PAYMENT_REQUESTED",
  ).length;
  const grouped = useMemo(
    () =>
      Array.from(new Set((dashboard?.tables || []).map((table) => table.area))),
    [dashboard],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.22em] opacity-50">
            Operação presencial
          </p>
          <h1 className="text-3xl font-black" style={{ color: VERDE }}>
            Salão PDV
          </h1>
          <p className="mt-1 text-sm font-semibold opacity-60">
            Supervisão de mesas, kits, sessões e pedidos do QR.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/staff"
            target="_blank"
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
            style={{ background: VERDE, color: ROSA }}
          >
            <ExternalLink size={15} /> Abrir Staff
          </a>
          <button
            onClick={() => void refresh()}
            className="rounded-xl border bg-white p-3"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          [dashboard?.tables.length || 0, "Mesas"],
          [occupied, "Ocupadas"],
          [kits.filter((k) => k.status === "AVAILABLE").length, "Kits livres"],
          [pending, "Pagamentos"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-2xl border bg-white p-4">
            <strong className="block text-2xl font-black">{value}</strong>
            <span className="text-xs font-black uppercase opacity-50">
              {label}
            </span>
          </div>
        ))}
      </div>
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="text-lg font-black">Mapa operacional</h2>
        <div className="mt-4 space-y-5">
          {grouped.map((area) => (
            <div key={area}>
              <p className="mb-2 text-xs font-black uppercase tracking-widest opacity-50">
                {area}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {dashboard?.tables
                  .filter((table) => table.area === area)
                  .map((table) => {
                    const session = dashboard.openSessions.find(
                      (s) => s.table.id === table.id,
                    );
                    const tableOrders = orders.filter(
                      (o) => o.tableName === table.name,
                    );
                    return (
                      <div
                        key={table.id}
                        className="rounded-xl border p-3"
                        style={{ opacity: table.active ? 1 : 0.5 }}
                      >
                        <div className="flex justify-between">
                          <strong>{table.name}</strong>
                          <span className="text-[10px] font-black uppercase">
                            {session ? session.kit.code : "Livre"}
                          </span>
                        </div>
                        <p className="mt-2 text-xs font-bold opacity-60">
                          {session?.customerName ||
                            (table.active ? "Disponível" : "Desativada")}
                        </p>
                        {tableOrders.at(-1) && (
                          <p className="mt-1 text-xs font-black">
                            #{tableOrders.at(-1)?.number} ·{" "}
                            {tableOrders.at(-1)?.status}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border bg-white p-5">
        <div className="flex items-center gap-2">
          <QrCode size={19} />
          <div>
            <h2 className="text-lg font-black">Mesas com kit</h2>
            <p className="text-xs font-bold opacity-55">
              Crie a mesa, o QR e o kit em uma única operação.
            </p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await diningRequest(`/api/admin/dining/stations${editingTableId ? `/${editingTableId}` : ""}`, adminToken, {
                method: editingTableId ? "PATCH" : "POST",
                body: JSON.stringify({ ...newStation, active: true }),
              });
              resetStationForm();
            });
          }}
          className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-6"
        >
          <input
            required
            value={newStation.name}
            onChange={(e) =>
              setNewStation({ ...newStation, name: e.target.value })
            }
            placeholder="Nome ou número da mesa"
            className="rounded-xl border p-3"
          />
          <input
            required
            value={newStation.code}
            onChange={(e) =>
              setNewStation({ ...newStation, code: e.target.value })
            }
            placeholder="Código do kit"
            className="rounded-xl border p-3"
          />
          <select
            value={newStation.area}
            onChange={(e) =>
              setNewStation({ ...newStation, area: e.target.value })
            }
            className="rounded-xl border bg-white p-3 font-bold"
          >
            <option>SALÃO</option>
            <option>JARDIM</option>
            <option>SALA</option>
          </select>
          <input
            value={newStation.deviceId}
            onChange={(e) =>
              setNewStation({ ...newStation, deviceId: e.target.value })
            }
            placeholder="Device ID (opcional)"
            className="rounded-xl border p-3"
          />
          <select
            value={newStation.installedByStaff}
            onChange={(e) => setNewStation({ ...newStation, installedByStaff: e.target.value })}
            className="rounded-xl border bg-white p-3 font-bold"
            aria-label="Responsável pelo kit"
          >
            <option value="RODRIGO">Instalado por Rodrigo</option>
            <option value="NATHAN">Instalado por Nathan</option>
          </select>
          <button
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-black uppercase text-white"
            style={{ background: VERDE }}
          >
            {editingTableId ? <Pencil size={15} /> : <Plus size={15} />} {editingTableId ? "Salvar alterações" : "Criar mesa + kit"}
          </button>
          {editingTableId && <button type="button" onClick={resetStationForm} className="rounded-xl border p-3 text-xs font-black uppercase lg:col-start-6">Cancelar edição</button>}
        </form>
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {dashboard?.tables.map((table) => {
            const kit = kits.find((item) => item.code === table.code);
            return (
              <article key={table.id} className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">
                      {table.area}
                    </p>
                    <strong className="text-xl">{table.name}</strong>
                    <p className="text-xs font-bold opacity-55">
                      Kit {kit?.code || "não associado"} · instalado por{" "}
                      {kit?.installedByStaff || "cadastro anterior"}
                    </p>
                  </div>
                  <span className="rounded-full px-3 py-2 text-[10px] font-black uppercase" style={{ background: table.active ? "#DCFCE7" : "#F3F4F6", color: table.active ? "#166534" : "#4B5563" }}>{table.active ? "Ativa" : "Pausada"}</span>
                </div>
                {kit && (
                  <>
                    <p className="mt-3 break-all rounded-lg bg-stone-50 p-3 text-[10px] font-mono">
                      /pedido/k/{kit.qrToken}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button disabled={busy || kit.status === "IN_USE"} onClick={() => { setEditingTableId(table.id); setNewStation({ name: table.name, code: table.code, area: table.area, deviceId: kit.deviceId || "", installedByStaff: kit.installedByStaff || "RODRIGO" }); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }} className="rounded-lg border px-3 py-2 text-[10px] font-black uppercase"><Pencil className="mr-1 inline" size={13} /> Editar</button>
                      <button disabled={busy || kit.status === "IN_USE"} onClick={() => void run(() => diningRequest(`/api/admin/dining/stations/${table.id}`, adminToken, { method: "PATCH", body: JSON.stringify({ name: table.name, code: table.code, area: table.area, deviceId: kit.deviceId || "", installedByStaff: kit.installedByStaff || "RODRIGO", active: !table.active }) }))} className="rounded-lg border px-3 py-2 text-[10px] font-black uppercase">{table.active ? <Pause className="mr-1 inline" size={13} /> : <Play className="mr-1 inline" size={13} />}{table.active ? "Pausar" : "Ativar"}</button>
                      <button disabled={busy || kit.status === "IN_USE"} onClick={() => { if (window.confirm(`Excluir ${table.name} e seu kit? Esta ação só será concluída se não houver histórico.`)) void run(() => diningRequest(`/api/admin/dining/stations/${table.id}`, adminToken, { method: "DELETE" })); }} className="rounded-lg border border-red-200 px-3 py-2 text-[10px] font-black uppercase text-red-700"><Trash2 className="mr-1 inline" size={13} /> Excluir</button>
                      <button
                        disabled={busy || kit.status === "IN_USE"}
                        onClick={() =>
                          void run(() =>
                            diningRequest(
                              `/api/admin/dining/kits/${kit.id}/regenerate-token`,
                              adminToken,
                              { method: "POST" },
                            ),
                          )
                        }
                        className="rounded-lg border px-3 py-2 text-[10px] font-black uppercase"
                      >
                        <RotateCcw className="mr-1 inline" size={13} /> Regerar
                        QR
                      </button>
                      {["NORMAL", "BLUE", "GREEN", "RED", "OFF"].map(
                        (state) => (
                          <button
                            key={state}
                            disabled={busy}
                            title={`Luz ${state}`}
                            onClick={() =>
                              void run(() =>
                                diningRequest(
                                  `/api/admin/dining/kits/${kit.id}/light`,
                                  adminToken,
                                  {
                                    method: "POST",
                                    body: JSON.stringify({
                                      state,
                                      reason: "erp_test",
                                    }),
                                  },
                                ),
                              )
                            }
                            className="rounded-lg border p-2"
                          >
                            <Lightbulb size={13} />
                          </button>
                        ),
                      )}
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
