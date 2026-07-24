import { Crown, Medal, Search, ShoppingBag, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { ROSA, VERDE } from "@/utils/theme";
import { fmt } from "../shared";
import type { CrmCustomer } from "./CustomersCrmView";

export function LoyaltyView({ customers }: { customers: CrmCustomer[] }) {
  const [query, setQuery] = useState("");
  const loyaltyCustomers = useMemo(
    () => customers.filter(isLoyaltyCustomer),
    [customers],
  );
  const ranking = useMemo(
    () =>
      [...loyaltyCustomers]
        .filter((customer) => Number(customer.order_count ?? 0) > 0)
        .sort(
          (a, b) =>
            Number(b.order_count ?? 0) - Number(a.order_count ?? 0) ||
            Number(b.total_spent ?? 0) - Number(a.total_spent ?? 0) ||
            String(a.name ?? "").localeCompare(String(b.name ?? ""), "pt-BR"),
        ),
    [loyaltyCustomers],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return ranking;
    return ranking.filter((customer) =>
      `${customer.name ?? ""} ${customer.phone ?? ""} ${customer.email ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalized),
    );
  }, [query, ranking]);
  const totalOrders = ranking.reduce((sum, customer) => sum + Number(customer.order_count ?? 0), 0);
  const repeatCustomers = ranking.filter((customer) => Number(customer.order_count ?? 0) >= 2).length;

  return (
    <section className="mx-auto max-w-6xl" style={{ color: VERDE }}>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Crown size={20} strokeWidth={2.5} />
            <p className="text-xs font-black uppercase tracking-[0.2em]">Programa de fidelidade</p>
          </div>
          <h1 className="text-3xl font-black uppercase leading-none">Ranking de clientes</h1>
          <p className="mt-2 text-sm font-bold opacity-60">
            Pedidos válidos feitos pelos clientes cadastrados. Pedidos cancelados não entram na contagem.
          </p>
        </div>
        <label
          className="flex min-w-0 items-center gap-2 rounded-2xl bg-white px-4 py-3 sm:w-80"
          style={{ border: `1px solid ${VERDE}18` }}
        >
          <Search size={17} className="shrink-0 opacity-50" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cliente ou telefone"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:opacity-40"
          />
        </label>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={Users} label="Cadastrados" value={String(loyaltyCustomers.length)} />
        <Metric icon={ShoppingBag} label="Pedidos no programa" value={String(totalOrders)} />
        <Metric icon={Medal} label="Clientes recorrentes" value={String(repeatCustomers)} />
        <Metric icon={Trophy} label="Líder" value={ranking[0]?.name || "—"} compact />
      </div>

      <div className="overflow-hidden rounded-3xl bg-white" style={{ border: `1px solid ${VERDE}18` }}>
        <div className="hidden grid-cols-[72px_minmax(220px,1fr)_130px_150px_150px] gap-3 px-5 py-3 text-[10px] font-black uppercase tracking-widest opacity-50 md:grid">
          <span>Posição</span><span>Cliente</span><span>Pedidos</span><span>Total gasto</span><span>Último pedido</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Trophy size={36} className="mx-auto mb-3 opacity-25" />
            <p className="font-black">{ranking.length ? "Nenhum cliente encontrado." : "Ainda não há pedidos de clientes cadastrados."}</p>
          </div>
        ) : (
          filtered.map((customer) => {
            const position = ranking.findIndex((item) => item.id === customer.id) + 1;
            return (
              <div
                key={customer.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[72px_minmax(220px,1fr)_130px_150px_150px] md:items-center"
                style={{ borderTop: `1px solid ${VERDE}10`, background: position <= 3 ? `${ROSA}${position === 1 ? "35" : "18"}` : "#fff" }}
              >
                <div className="flex items-center gap-2">
                  <Rank position={position} />
                  <span className="text-xs font-black uppercase opacity-50 md:hidden">no ranking</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-black">{customer.name || "Cliente sem nome"}</p>
                  <p className="truncate text-xs font-bold opacity-55">{customer.phone || customer.email || "Sem contato"}</p>
                </div>
                <Value label="Pedidos" value={`${Number(customer.order_count ?? 0)} pedido${Number(customer.order_count ?? 0) === 1 ? "" : "s"}`} strong />
                <Value label="Total gasto" value={fmt(Number(customer.total_spent ?? 0))} />
                <Value label="Último pedido" value={formatDate(customer.last_order_at)} />
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export function isLoyaltyCustomer(customer: CrmCustomer) {
  const normalizedName = String(customer.name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  return normalizedName !== "KIOSKMOB"
    && normalizedName !== "MENFISDELIVERY"
    && normalizedName !== "CLIENTERABBITMQ";
}

function Metric({ icon: Icon, label, value, compact = false }: { icon: typeof Users; label: string; value: string; compact?: boolean }) {
  return <div className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${VERDE}18` }}><Icon size={18} className="mb-3 opacity-55" /><p className="text-[10px] font-black uppercase tracking-widest opacity-50">{label}</p><p className={`${compact ? "truncate text-lg" : "text-2xl"} mt-1 font-black`}>{value}</p></div>;
}

function Rank({ position }: { position: number }) {
  const colors = ["#B7791F", "#64748B", "#9A5A2E"];
  return <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black" style={{ background: position <= 3 ? colors[position - 1] : `${VERDE}10`, color: position <= 3 ? "#fff" : VERDE }}>{position <= 3 ? <Medal size={19} /> : position}</span>;
}

function Value({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div><p className="text-[10px] font-black uppercase tracking-wider opacity-45 md:hidden">{label}</p><p className={`${strong ? "text-base font-black" : "text-sm font-bold"}`}>{value}</p></div>;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}
