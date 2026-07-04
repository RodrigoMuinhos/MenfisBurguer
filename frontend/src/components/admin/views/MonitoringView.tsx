import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  Database,
  ListChecks,
  RefreshCcw,
  RadioTower,
  XCircle,
} from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import { API_URL, fmt } from "../shared";
import { fetchOperationsMonitoring } from "../adminBackend";

type ApiRow = Record<string, unknown>;

type MonitoringData = {
  summary?: ApiRow;
  orders?: ApiRow[];
  lifecycleEvents?: ApiRow[];
  rabbitmqEvents?: ApiRow[];
  statusHistory?: ApiRow[];
  auditLogs?: ApiRow[];
};

export function MonitoringView({ adminToken }: { adminToken: string }) {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = async () => {
    if (!API_URL) {
      setError("Backend não configurado para monitoramento.");
      return;
    }
    setLoading(true);
    try {
      const next = (await fetchOperationsMonitoring(API_URL, adminToken)) as MonitoringData;
      setData(next);
      setError("");
      setLastUpdated(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {
      setError("Não foi possível carregar o monitoramento operacional.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const summary = data?.summary ?? {};
  const rabbitOk = useMemo(
    () => (data?.rabbitmqEvents ?? []).filter((event) => event.processed === true).length,
    [data],
  );
  const rabbitPending = useMemo(
    () => (data?.rabbitmqEvents ?? []).filter((event) => event.processed !== true).length,
    [data],
  );

  return (
    <div className="mx-auto grid max-w-[1600px] gap-5 text-[#65001F]">
      <section
        className="rounded-3xl p-5"
        style={{
          background: VERDE,
          color: "#fff",
          boxShadow: "0 18px 44px rgba(101,0,31,0.18)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: ROSA }}>
              Monitoramento
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-wide">
              Operação e RabbitMQ
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold opacity-75">
              Acompanhe pedidos, eventos de pagamento enviados para a cozinha, ACKs da fila e histórico operacional.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-black uppercase text-[#65001F] shadow-sm disabled:opacity-60"
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>
        <p className="mt-3 text-xs font-bold opacity-70">
          {lastUpdated ? `Última atualização: ${lastUpdated}` : "Aguardando leitura dos dados."}
        </p>
      </section>

      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {error}
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Pedidos ativos" value={num(summary.active_orders)} icon={Activity} />
        <Metric label="Pagamento pendente" value={num(summary.payment_pending)} icon={Clock} />
        <Metric label="Na cozinha" value={num(summary.kitchen_flow)} icon={ListChecks} />
        <Metric label="Prontos" value={num(summary.ready)} icon={CheckCircle2} />
        <Metric label="RabbitMQ ACK" value={String(rabbitOk)} sub={`${rabbitPending} pendente(s)`} icon={RadioTower} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Eventos operacionais" icon={Activity}>
          <div className="grid gap-3">
            {(data?.lifecycleEvents ?? []).map((event, index) => (
              <EventRow
                key={`lifecycle-${event.event_type}-${event.order_id}-${index}`}
                title={`${text(event.event_type)} ${text(event.order_id)}`}
                status={event.consumed === true ? "ACK" : "Pendente"}
                tone={event.consumed === true ? "ok" : "warn"}
                meta={`${text(event.from_status || "novo")} -> ${text(event.to_status)} · ${text(event.origin)} · ${dateTime(event.published_at)}${event.consumed_at ? ` · consumido ${dateTime(event.consumed_at)}` : ""}`}
              />
            ))}
            {(data?.lifecycleEvents ?? []).length === 0 && (
              <EmptyState text="Nenhum evento operacional registrado ainda." />
            )}
          </div>
        </Panel>

        <Panel title="Eventos RabbitMQ" icon={RadioTower}>
          <div className="grid gap-3">
            {(data?.rabbitmqEvents ?? []).map((event, index) => (
              <EventRow
                key={`${event.event_type}-${event.order_id}-${index}`}
                title={`${text(event.event_type)} ${text(event.order_id)}`}
                status={event.processed === true ? "Processado" : "Pendente"}
                tone={event.processed === true ? "ok" : "warn"}
                meta={`criado ${dateTime(event.created_at)}${event.processed_at ? ` · ACK ${dateTime(event.processed_at)}` : ""}`}
              />
            ))}
            {(data?.rabbitmqEvents ?? []).length === 0 && (
              <EmptyState text="Nenhum evento RabbitMQ registrado ainda." />
            )}
          </div>
        </Panel>

        <Panel title="Pedidos recentes" icon={Database}>
          <div className="grid gap-3">
            {(data?.orders ?? []).map((order) => (
              <div key={text(order.id)} className="rounded-2xl border border-[#F5B6CA] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black">{text(order.id)}</p>
                    <p className="text-xs font-black uppercase text-[#0B5CFF]">{text(order.status)}</p>
                  </div>
                  <p className="text-lg font-black">{fmt(Number(order.total ?? 0))}</p>
                </div>
                <p className="mt-2 text-xs font-bold text-[#9B5970]">
                  {text(order.channel)} · {text(order.payment_method)} · {text(order.payment_status)}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#9B5970]">
                  Atualizado {dateTime(order.updated_at ?? order.created_at)}
                </p>
              </div>
            ))}
            {(data?.orders ?? []).length === 0 && (
              <EmptyState text="Nenhum pedido recente encontrado." />
            )}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="Histórico de status" icon={ListChecks}>
          <Timeline rows={data?.statusHistory ?? []} kind="status" />
        </Panel>
        <Panel title="Auditoria de pedidos" icon={Activity}>
          <Timeline rows={data?.auditLogs ?? []} kind="audit" />
        </Panel>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-2xl border border-[#F5B6CA] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#B15A78]">{label}</p>
        <Icon size={20} />
      </div>
      <p className="mt-3 text-3xl font-black">{value}</p>
      {sub && <p className="mt-1 text-xs font-bold text-[#9B5970]">{sub}</p>}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Activity;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#F5B6CA] bg-[#FFF8FA] p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={20} />
        <h2 className="text-lg font-black uppercase">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function EventRow({
  title,
  status,
  tone,
  meta,
}: {
  title: string;
  status: string;
  tone: "ok" | "warn";
  meta: string;
}) {
  const Icon = tone === "ok" ? CheckCircle2 : XCircle;
  return (
    <div className="rounded-2xl border border-[#F5B6CA] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-xs font-semibold text-[#9B5970]">{meta}</p>
        </div>
        <span
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black"
          style={{ background: tone === "ok" ? "#DCFCE7" : "#FEF3C7", color: tone === "ok" ? "#166534" : "#92400E" }}
        >
          <Icon size={14} />
          {status}
        </span>
      </div>
    </div>
  );
}

function Timeline({ rows, kind }: { rows: ApiRow[]; kind: "status" | "audit" }) {
  if (rows.length === 0) return <EmptyState text="Sem registros recentes." />;
  return (
    <div className="grid gap-3">
      {rows.map((row, index) => (
        <div key={`${kind}-${index}`} className="rounded-2xl border border-[#F5B6CA] bg-white p-4">
          {kind === "status" ? (
            <>
              <p className="font-black">
                {text(row.order_id)} · {text(row.from_status || "novo")} → {text(row.to_status)}
              </p>
              <p className="mt-1 text-xs font-bold text-[#9B5970]">
                {text(row.changed_by)} · {text(row.reason)} · {dateTime(row.created_at)}
              </p>
            </>
          ) : (
            <>
              <p className="font-black">
                {text(row.entity_id)} · {text(row.action)}
              </p>
              <p className="mt-1 text-xs font-bold text-[#9B5970]">
                {text(row.actor)} · {dateTime(row.created_at)}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#F5B6CA] bg-white p-5 text-sm font-bold text-[#9B5970]">
      {text}
    </div>
  );
}

function text(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function num(value: unknown) {
  return String(Number(value ?? 0));
}

function dateTime(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
