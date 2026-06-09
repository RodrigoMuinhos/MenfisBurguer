import { CalendarDays, Phone, Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { ROSA, VERDE } from "@/utils/theme";
import { fmt } from "../shared";

export type CrmCustomer = {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  birthday?: string;
  birth_year?: number;
  order_count?: number | string;
  total_spent?: number | string;
  last_order_at?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
};

export function CustomersCrmView({ customers }: { customers: CrmCustomer[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) =>
      `${customer.name ?? ""} ${customer.phone ?? ""} ${customer.email ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [customers, query]);

  const birthdays = filtered.filter((customer) => isBirthdaySoon(customer.birthday));

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 md:grid-cols-3">
        <CrmMetric label="Clientes" value={String(customers.length)} />
        <CrmMetric label="Aniversários próximos" value={String(birthdays.length)} />
        <CrmMetric
          label="Pedidos mapeados"
          value={String(customers.reduce((sum, customer) => sum + Number(customer.order_count ?? 0), 0))}
        />
      </section>

      <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3" style={{ border: `1px solid ${ROSA}` }}>
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome, telefone ou email"
          className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
          style={{ color: VERDE }}
        />
      </label>

      <section className="grid gap-3">
        {filtered.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-center text-sm font-bold opacity-50">
            Nenhum cliente encontrado.
          </p>
        )}
        {filtered.map((customer) => (
          <article
            key={customer.id}
            className="grid gap-3 rounded-2xl bg-white p-4 md:grid-cols-[1.1fr_0.8fr_0.8fr_auto]"
            style={{ border: `1px solid ${ROSA}` }}
          >
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full" style={{ background: ROSA, color: VERDE }}>
                <UserRound size={22} />
              </div>
              <div>
                <p className="text-sm font-black">{customer.name || "Cliente sem nome"}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-bold opacity-65">
                  <Phone size={13} />
                  {customer.phone || "Sem telefone"}
                </p>
                <p className="mt-1 text-[11px] font-bold opacity-55">
                  {[customer.street, customer.number, customer.neighborhood, customer.city].filter(Boolean).join(", ") || "Sem endereço principal"}
                </p>
              </div>
            </div>
            <Info label="Frequência" value={`${Number(customer.order_count ?? 0)} pedidos`} />
            <Info label="Total gasto" value={fmt(Number(customer.total_spent ?? 0))} />
            <div className="grid gap-1 text-right text-xs font-bold">
              <span className="inline-flex items-center justify-end gap-1">
                <CalendarDays size={13} />
                {customer.birthday ? formatDate(customer.birthday) : "Sem aniversário"}
              </span>
              <span style={{ color: isBirthdaySoon(customer.birthday) ? "#16A34A" : `${VERDE}88` }}>
                {isBirthdaySoon(customer.birthday) ? "Data especial chegando" : customer.birth_year ? `Nasc. ${customer.birth_year}` : "Ano não informado"}
              </span>
              <span className="opacity-55">
                Último pedido: {customer.last_order_at ? formatDate(customer.last_order_at) : "-"}
              </span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function CrmMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${ROSA}` }}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-45">{label}</p>
      <p className="mt-1 text-2xl font-black" style={{ color: VERDE }}>{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-45">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function isBirthdaySoon(value?: string) {
  if (!value) return false;
  const now = new Date();
  const date = new Date(value);
  const next = new Date(now.getFullYear(), date.getMonth(), date.getDate());
  if (next.getTime() < now.setHours(0, 0, 0, 0)) next.setFullYear(next.getFullYear() + 1);
  return (next.getTime() - Date.now()) / 86400000 <= 30;
}
