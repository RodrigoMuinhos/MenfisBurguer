import { KeyRound, MapPin, MessageCircle, Plus, Save, Search, Trash2, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ROSA, VERDE } from "@/utils/theme";
import { API_URL, fmt } from "../shared";

export type CrmCustomer = {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  cpf?: string;
  internal_notes?: string;
  created_at?: string;
  order_count?: number;
  total_spent?: number;
  average_ticket?: number;
  delivered_count?: number;
  last_order_at?: string;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
};

type FormState = {
  id?: number;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  internalNotes: string;
};

const emptyForm: FormState = {
  name: "",
  phone: "",
  email: "",
  cpf: "",
  internalNotes: "",
};

export function CustomersCrmView({
  customers,
  adminToken,
  onChanged,
}: {
  customers: CrmCustomer[];
  adminToken: string;
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selected, setSelected] = useState<CrmCustomer | null>(customers[0] ?? null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) =>
      `${customer.name ?? ""} ${customer.phone ?? ""} ${customer.email ?? ""} ${customer.cpf ?? ""} ${formatCustomerAddress(customer)}`
        .toLowerCase()
        .includes(q),
    );
  }, [customers, query]);

  const active = selected ?? filtered[0] ?? null;

  const editCustomer = (customer: CrmCustomer) => {
    setSelected(customer);
    setTemporaryPassword("");
    setWhatsappUrl("");
    setFeedback("");
    setForm({
      id: customer.id,
      name: customer.name ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      cpf: customer.cpf ?? "",
      internalNotes: customer.internal_notes ?? "",
    });
  };

  const newCustomer = () => {
    setSelected(null);
    setTemporaryPassword("");
    setWhatsappUrl("");
    setFeedback("");
    setForm(emptyForm);
  };

  const saveCustomer = async () => {
    if (!API_URL || saving) return;
    setSaving(true);
    setFeedback("");
    try {
      const res = await fetch(
        form.id
          ? `${API_URL}/customers/admin/${encodeURIComponent(String(form.id))}`
          : `${API_URL}/customers/admin`,
        {
          method: form.id ? "PATCH" : "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "customer_save_failed");
      setTemporaryPassword(String(data.temporaryPassword ?? ""));
      setWhatsappUrl(String(data.whatsappUrl ?? ""));
      setFeedback(form.id ? "Cliente atualizado." : "Cliente cadastrado.");
      await onChanged();
      if (data.id) setSelected(data as CrmCustomer);
      if (data.id) setForm((current) => ({ ...current, id: Number(data.id) }));
    } catch {
      setFeedback("Não foi possível salvar o cliente.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomer = async () => {
    if (!API_URL || !form.id || saving) return;
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este cliente?\n\nEsta ação é irreversível. Os pedidos antigos permanecem no histórico.",
    );
    if (!confirmed) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/customers/admin/${encodeURIComponent(String(form.id))}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("delete_failed");
      setFeedback("Cliente excluído. Pedidos antigos preservados.");
      newCustomer();
      await onChanged();
    } catch {
      setFeedback("Não foi possível excluir o cliente.");
    } finally {
      setSaving(false);
    }
  };

  const generatePassword = async () => {
    if (!API_URL || !form.id || saving) return;
    setSaving(true);
    setFeedback("");
    try {
      const res = await fetch(`${API_URL}/customers/admin/${encodeURIComponent(String(form.id))}/temporary-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error("password_failed");
      setTemporaryPassword(String(data.temporaryPassword ?? ""));
      setWhatsappUrl(String(data.whatsappUrl ?? ""));
      setFeedback("Senha temporária criada com sucesso.");
      await onChanged();
    } catch {
      setFeedback("Não foi possível gerar a senha.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 md:grid-cols-4">
        <CrmMetric label="Clientes" value={String(customers.length)} />
        <CrmMetric label="Pedidos" value={String(total(customers, "order_count"))} />
        <CrmMetric label="Total gasto" value={fmt(total(customers, "total_spent"))} />
        <CrmMetric label="Entregas" value={String(total(customers, "delivered_count"))} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(280px,0.9fr)_minmax(360px,1.1fr)]">
        <div className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${ROSA}` }}>
          <div className="flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: "#FFF8F2", color: VERDE }}>
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
              placeholder="Buscar por nome, telefone, CPF ou e-mail"
            />
          </div>
          <button
            type="button"
            onClick={newCustomer}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase"
            style={{ background: VERDE, color: ROSA }}
          >
            <Plus size={16} /> Novo cliente
          </button>
          <div className="mt-3 grid max-h-[560px] gap-2 overflow-y-auto">
            {filtered.map((customer) => {
              const address = formatCustomerAddress(customer);
              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => editCustomer(customer)}
                  className="rounded-2xl p-3 text-left"
                  style={{
                    background: active?.id === customer.id ? `${ROSA}55` : "#fff",
                    border: `1px solid ${active?.id === customer.id ? VERDE : `${VERDE}14`}`,
                    color: VERDE,
                  }}
                >
                  <p className="text-base font-black leading-tight">{customer.name || "Cliente sem nome"}</p>
                  <p className="mt-1 text-sm font-black opacity-70">{customer.phone || "Sem telefone"}</p>
                  <p className="mt-1 text-xs font-bold opacity-50">{customer.email || "Sem e-mail"}</p>
                  <p className="mt-2 flex items-start gap-1.5 text-xs font-black leading-snug" style={{ color: VERDE }}>
                    <MapPin className="mt-0.5 shrink-0" size={13} />
                    <span>{address || "Sem endereço cadastrado"}</span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${ROSA}`, color: VERDE }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserRound size={20} />
              <h3 className="text-sm font-black uppercase tracking-wider">
                {form.id ? "Editar cliente" : "Cadastrar cliente"}
              </h3>
            </div>
            {form.id && (
              <button type="button" onClick={newCustomer} className="rounded-full p-2" style={{ background: `${VERDE}08` }}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Nome completo" value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <Field label="Telefone obrigatório" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} inputMode="tel" />
            <Field label="E-mail opcional" value={form.email} onChange={(email) => setForm({ ...form, email })} inputMode="email" />
            <Field label="CPF opcional" value={form.cpf} onChange={(cpf) => setForm({ ...form, cpf })} inputMode="numeric" />
            <div className="rounded-2xl p-4 md:col-span-2" style={{ background: `${ROSA}33`, border: `1px solid ${VERDE}18` }}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: VERDE, color: ROSA }}>
                  <MapPin size={18} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-55">Endereço do cliente</p>
                  <p className="mt-1 text-base font-black leading-snug">
                    {form.id && active ? formatCustomerAddress(active) || "Sem endereço cadastrado" : "Selecione um cliente para ver o endereço"}
                  </p>
                </div>
              </div>
            </div>
            <label className="grid gap-1 md:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-wider opacity-45">Observações internas</span>
              <textarea
                value={form.internalNotes}
                onChange={(event) => setForm({ ...form, internalNotes: event.target.value })}
                className="h-24 resize-none rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
              />
            </label>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <button type="button" onClick={saveCustomer} disabled={saving} className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase disabled:opacity-50" style={{ background: VERDE, color: ROSA }}>
              <Save size={16} /> Salvar
            </button>
            <button type="button" onClick={generatePassword} disabled={!form.id || saving} className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase disabled:opacity-40" style={{ background: `${VERDE}10`, color: VERDE }}>
              <KeyRound size={16} /> Gerar senha
            </button>
            <a href={whatsappUrl || undefined} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase" style={{ background: whatsappUrl ? ROSA : `${ROSA}40`, color: VERDE, pointerEvents: whatsappUrl ? "auto" : "none" }}>
              <MessageCircle size={16} /> Enviar WhatsApp
            </a>
            <button type="button" onClick={deleteCustomer} disabled={!form.id || saving} className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase disabled:opacity-40" style={{ background: "#FEF2F2", color: "#991B1B" }}>
              <Trash2 size={16} /> Excluir
            </button>
          </div>

          {(feedback || temporaryPassword) && (
            <div className="mt-4 rounded-2xl p-3 text-sm font-bold" style={{ background: "#FFF8F2", border: `1px solid ${VERDE}12` }}>
              {feedback && <p>{feedback}</p>}
              {temporaryPassword && <p className="mt-1">Senha temporária: <strong>{temporaryPassword}</strong></p>}
            </div>
          )}

          {active && (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Info label="Total de pedidos" value={`${Number(active.order_count ?? 0)} pedidos`} />
              <Info label="Valor total gasto" value={fmt(Number(active.total_spent ?? 0))} />
              <Info label="Ticket médio" value={fmt(Number(active.average_ticket ?? 0))} />
              <Info label="Último pedido" value={active.last_order_at ? formatDate(active.last_order_at) : "-"} />
              <Info label="Data de cadastro" value={active.created_at ? formatDate(active.created_at) : "-"} />
              <Info label="Entregas realizadas" value={String(Number(active.delivered_count ?? 0))} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "text" | "tel" | "email" | "numeric";
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-black uppercase tracking-wider opacity-45">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={inputMode}
        className="rounded-2xl px-4 py-3 text-sm font-bold outline-none"
        style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
      />
    </label>
  );
}

function CrmMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${ROSA}`, color: VERDE }}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-45">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "#FFF8F2", border: `1px solid ${VERDE}12` }}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-45">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function total(customers: CrmCustomer[], key: keyof CrmCustomer) {
  return customers.reduce((sum, customer) => sum + Number(customer[key] ?? 0), 0);
}

function formatCustomerAddress(customer: CrmCustomer) {
  const streetLine = [customer.street, customer.number].filter(Boolean).join(", ");
  return [streetLine, customer.neighborhood, customer.city, customer.cep ? `CEP ${customer.cep}` : ""]
    .filter(Boolean)
    .join(" - ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}
