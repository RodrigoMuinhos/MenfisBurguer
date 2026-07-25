"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CircleHelp, RefreshCw, ShoppingBag, Target, TrendingUp, Wallet } from "lucide-react";
import { API_URL } from "../shared";
import { fmt } from "../shared";

type DailyPlanning = {
  date: string;
  revenue: number;
  target: number;
  minimumGoal: number;
  maintenanceGoal: number;
  recommendedGoal: number;
  idealGoal: number;
  targetPercentage: number;
  missingRevenue: number;
  averageTicket: number;
  ordersCount: number;
  requiredOrders: number;
  projectedRevenue: number;
  status: "BELOW" | "ON_TRACK" | "ACHIEVED";
};

type WeeklyPlanning = {
  weekStart: string;
  weekEnd: string;
  currentRevenue: number;
  weeklyTarget: number;
  previousWeekRevenue: number;
  fourWeekAverage: number;
  remainingRevenue: number;
  remainingDays: number;
  growthPercentage: number;
  projectedClosingRevenue: number;
  dailyTargets: { date: string; dayOfWeek: string; historicalWeight: number; target: number }[];
};

type Comparison = {
  weekStart: string;
  weekEnd: string;
  revenue: number;
  orders: number;
  averageTicket: number;
  growthPercentage: number;
  status: "PARTIAL" | "STABLE" | "GROWTH" | "DECLINE";
};

type PlanningData = {
  generatedAt: string;
  timezone: string;
  daily: DailyPlanning;
  weekly: WeeklyPlanning;
  comparison: Comparison[];
};

export function SalesPlanningView({ adminToken }: { adminToken: string }) {
  const [data, setData] = useState<PlanningData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/reports/sales-planning`, {
        cache: "no-store",
        credentials: "include",
        headers: adminToken && adminToken !== "cookie" ? { Authorization: `Bearer ${adminToken}` } : {},
      });
      if (!response.ok) throw new Error(`planning_${response.status}`);
      setData(await response.json());
    } catch {
      setError("Não foi possível carregar o planejamento de vendas do backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [adminToken]);

  if (loading) return <div className="grid min-h-[420px] place-items-center rounded-3xl bg-white"><RefreshCw className="animate-spin" /><p className="sr-only">Carregando planejamento</p></div>;
  if (error || !data) return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-800">{error}<button onClick={load} className="ml-3 underline">Tentar novamente</button></div>;

  const { daily, weekly } = data;
  return (
    <div className="grid gap-5">
      <section className="rounded-3xl bg-[#750020] p-5 text-white shadow-xl lg:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#F8B7C8]">Inteligência de vendas</p>
            <h1 className="mt-2 text-3xl font-black lg:text-4xl">Planejamento de Vendas</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-white/65">Metas calculadas pelo histórico real, com crescimento recomendado de 8% e distribuição pelo peso de cada dia.</p>
          </div>
          <button onClick={load} className="flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-xs font-black"><RefreshCw size={15}/> Atualizar</button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Wallet/>} label="Faturamento de hoje" value={fmt(daily.revenue)} help="Soma dos pedidos faturáveis registrados hoje." />
        <Metric icon={<Target/>} label="Meta recomendada" value={fmt(daily.target)} detail={`${daily.targetPercentage.toFixed(1)}% atingido`} help="Média histórica deste dia da semana acrescida de 8%." />
        <Metric icon={<TrendingUp/>} label="Falta para a meta" value={fmt(daily.missingRevenue)} detail={daily.missingRevenue > 0 ? `aprox. ${daily.requiredOrders} pedido(s)` : "Meta alcançada"} alert={daily.status === "BELOW"} help="Meta menos faturamento atual. Pedidos faltantes usam o ticket médio." />
        <Metric icon={<CalendarDays/>} label="Projeção de fechamento" value={fmt(daily.projectedRevenue)} detail={statusLabel(daily.status)} alert={daily.status === "BELOW"} help="Vendas atuais divididas pela participação histórica vendida até este horário." />
        <Metric icon={<ShoppingBag/>} label="Pedidos" value={String(daily.ordersCount)} detail={`Ticket médio ${fmt(daily.averageTicket)}`} help="Quantidade faturável e valor médio por pedido." />
        <Metric label="Meta mínima" value={fmt(daily.minimumGoal)} help="Referência conservadora equivalente a 70% da manutenção enquanto custos fixos não estão cadastrados." />
        <Metric label="Meta de manutenção" value={fmt(daily.maintenanceGoal)} help="Média das últimas ocorrências do mesmo dia da semana." />
        <Metric label="Meta ideal" value={fmt(daily.idealGoal)} help="Maior resultado recente do mesmo dia, nunca abaixo da meta recomendada." />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <Panel title="Planejamento semanal" subtitle={`${dateLabel(weekly.weekStart)} a ${dateLabel(weekly.weekEnd)}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Mini label="Faturamento atual" value={fmt(weekly.currentRevenue)} />
            <Mini label="Meta semanal" value={fmt(weekly.weeklyTarget)} />
            <Mini label="Falta para a meta" value={fmt(weekly.remainingRevenue)} />
            <Mini label="Média das últimas 4 semanas" value={fmt(weekly.fourWeekAverage)} />
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#F3E8E3]"><div className="h-full rounded-full bg-[#314A37]" style={{ width: `${Math.min(100, weekly.weeklyTarget ? weekly.currentRevenue / weekly.weeklyTarget * 100 : 0)}%` }} /></div>
          <p className="mt-2 text-xs font-bold opacity-55">Projeção semanal: {fmt(weekly.projectedClosingRevenue)}</p>
        </Panel>
        <Panel title="Meta por dia restante" subtitle="Distribuição proporcional ao histórico de cada dia">
          <div className="grid gap-2">
            {weekly.dailyTargets.map(day => <div key={day.date} className="flex items-center justify-between rounded-xl bg-[#FFF8F2] p-3"><div><p className="text-sm font-black">{day.dayOfWeek}</p><p className="text-[10px] font-bold opacity-50">{dateLabel(day.date)} · peso {day.historicalWeight.toFixed(1)}%</p></div><p className="text-lg font-black">{fmt(day.target)}</p></div>)}
          </div>
        </Panel>
      </section>

      <Panel title="Comparativo entre semanas" subtitle="Estabilidade entre -3% e +3%; a semana atual é marcada como parcial.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead><tr className="border-b text-[10px] uppercase tracking-wider opacity-50"><th className="p-3">Semana</th><th>Faturamento</th><th>Pedidos</th><th>Ticket médio</th><th>Crescimento</th><th>Situação</th></tr></thead>
            <tbody>{data.comparison.map((row, index) => <tr key={row.weekStart} className="border-b border-[#314A37]/10"><td className="p-3 font-black">{index === data.comparison.length - 1 ? "Semana atual" : `${dateLabel(row.weekStart)} a ${dateLabel(row.weekEnd)}`}</td><td>{fmt(row.revenue)}</td><td>{row.orders}</td><td>{fmt(row.averageTicket)}</td><td className={row.growthPercentage < -3 ? "text-red-700" : row.growthPercentage > 3 ? "text-green-700" : "text-amber-700"}>{row.growthPercentage >= 0 ? "+" : ""}{row.growthPercentage.toFixed(2)}%</td><td><Status value={row.status}/></td></tr>)}</tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Metric({ icon, label, value, detail, help, alert = false }: { icon?: React.ReactNode; label: string; value: string; detail?: string; help: string; alert?: boolean }) {
  return <article className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: alert ? "#FCA5A5" : "#314A3720" }}><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F8B7C8]/45">{icon}</span><span title={help} aria-label={help}><CircleHelp size={16} className="opacity-35"/></span></div><p className="mt-4 text-[9px] font-black uppercase tracking-widest opacity-50">{label}</p><p className="mt-1 text-2xl font-black">{value}</p>{detail && <p className="mt-1 text-[10px] font-bold opacity-55">{detail}</p>}</article>;
}
function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-[#314A37]/10 bg-white p-4 shadow-sm"><h2 className="font-black">{title}</h2><p className="mb-4 mt-1 text-xs font-semibold opacity-50">{subtitle}</p>{children}</section>; }
function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#FFF8F2] p-3"><p className="text-[9px] font-black uppercase opacity-45">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>; }
function Status({ value }: { value: Comparison["status"] }) { const config = { PARTIAL: ["Parcial", "#6B7280"], STABLE: ["Estável", "#B45309"], GROWTH: ["Crescimento", "#15803D"], DECLINE: ["Queda", "#B91C1C"] } as const; return <span className="rounded-full px-2 py-1 text-[9px] font-black text-white" style={{ background: config[value][1] }}>{config[value][0]}</span>; }
function statusLabel(value: DailyPlanning["status"]) { return value === "ACHIEVED" ? "Meta alcançada" : value === "ON_TRACK" ? "No caminho da meta" : "Abaixo do ritmo necessário"; }
function dateLabel(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }); }
