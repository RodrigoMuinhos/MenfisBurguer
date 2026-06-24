import { useState } from "react";
import { BellRing, X } from "lucide-react";
import { API_URL, maskPhone } from "@/components/order/checkout";
import { ROSA, VERDE } from "@/utils/theme";

export const SOLD_OUT_TITLE = "FELIZMENTE, HOJE ESGOTAMOS TUDO!";

export const SOLD_OUT_MESSAGE =
  "Agradecemos demais a todos vocês que compraram e colaboraram com a gente hoje.\n\nNosso estoque foi totalmente vendido, mas não se preocupe: amanhã tem mais Menfi’s Burger esperando por você.\n\nAtive o alerta abaixo para ser avisado assim que voltarmos a receber pedidos.";

export function SoldOutBanner({
  message = SOLD_OUT_MESSAGE,
  onNotify,
}: {
  message?: string;
  onNotify: () => void;
}) {
  return (
    <section
      className="mx-4 mt-4 rounded-2xl p-4"
      style={{ background: "#FFF7ED", border: "1.5px solid #F59E0B", color: VERDE }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "#F59E0B", color: "#fff" }}
        >
          <BellRing size={21} strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black uppercase tracking-wide">{SOLD_OUT_TITLE}</p>
          <p className="mt-2 whitespace-pre-line text-xs font-bold leading-relaxed opacity-75">
            {message || SOLD_OUT_MESSAGE}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onNotify}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black uppercase tracking-wide"
        style={{ background: VERDE, color: ROSA }}
      >
        <BellRing size={17} strokeWidth={2.5} />
        Quero ser avisado
      </button>
    </section>
  );
}

export function SoldOutAlertModal({
  message = SOLD_OUT_MESSAGE,
  onClose,
}: {
  message?: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();
    setError("");
    if (cleanName.length < 2) {
      setError("Informe seu nome.");
      return;
    }
    if (cleanPhone.replace(/\D/g, "").length < 10) {
      setError("Informe seu WhatsApp com DDD.");
      return;
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Informe um e-mail válido ou deixe em branco.");
      return;
    }
    if (!API_URL) {
      setError("Cadastro indisponível no momento.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/customers/sold-out-alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail || undefined,
        }),
      });
      if (!response.ok) throw new Error("sold_out_alert_failed");
      setSaved(true);
    } catch {
      setError("Não foi possível salvar seu alerta. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/55 px-3 py-3 sm:items-center sm:p-4">
      <section
        className="max-h-[calc(100dvh-24px)] w-full max-w-md overflow-y-auto rounded-[24px] bg-white p-5 shadow-2xl"
        style={{ color: VERDE }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sold-out-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/40">
              Estoque esgotado
            </p>
            <h2 id="sold-out-title" className="mt-2 text-2xl font-black leading-tight">
              {SOLD_OUT_TITLE}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: `${ROSA}55`, color: VERDE }}
            aria-label="Fechar aviso"
          >
            <X size={20} strokeWidth={2.6} />
          </button>
        </div>

        <p className="mt-4 whitespace-pre-line rounded-2xl p-4 text-sm font-bold leading-relaxed" style={{ background: `${ROSA}35` }}>
          {message || SOLD_OUT_MESSAGE}
        </p>

        {saved ? (
          <div className="mt-4 rounded-2xl p-4 text-sm font-black leading-relaxed" style={{ background: "#DCFCE7", color: "#166534" }}>
            Alerta cadastrado. Vamos avisar você quando a Menfi’s voltar a receber pedidos.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <SoldOutField label="Nome" value={name} onChange={setName} placeholder="Seu nome" />
            <SoldOutField
              label="WhatsApp"
              value={phone}
              onChange={(value) => setPhone(maskPhone(value))}
              placeholder="(85) 99999-9999"
            />
            <SoldOutField
              label="E-mail opcional"
              value={email}
              onChange={setEmail}
              placeholder="voce@email.com"
              type="email"
            />
            {error && (
              <p className="rounded-2xl px-4 py-3 text-xs font-black leading-relaxed" style={{ background: "#FEF2F2", color: "#991B1B" }}>
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={() => void submit()}
              disabled={saving}
              className="flex min-h-13 w-full items-center justify-center rounded-2xl text-sm font-black uppercase tracking-wide disabled:opacity-60"
              style={{ background: VERDE, color: ROSA }}
            >
              {saving ? "Salvando..." : "Quero ser avisado"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function SoldOutField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-black uppercase tracking-wider text-black/45">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        className="min-h-12 rounded-2xl px-4 text-base font-bold outline-none"
        style={{ border: `1.5px solid ${VERDE}16`, color: VERDE }}
      />
    </label>
  );
}
