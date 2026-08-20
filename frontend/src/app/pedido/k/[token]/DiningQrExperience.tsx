"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import App from "@/app/App";
import { API_URL } from "@/app/appState";
import { ROSA, VERDE } from "@/utils/theme";

type PublicDiningSession = {
  sessionPublicId: string;
  tableName: string;
  tableArea: string;
  customerName?: string | null;
  openedAt: string;
};

const DINING_CONTEXT_KEY = "menfis_dining_context";

export function DiningQrExperience({ token }: { token: string }) {
  const [session, setSession] = useState<PublicDiningSession | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(
      `${API_URL}/api/public/dining/kits/${encodeURIComponent(token)}/session`,
      {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("session_unavailable");
        return (await response.json()) as PublicDiningSession;
      })
      .then((value) => {
        if (!active) return;
        setSession(value);
        if (value.customerName) persistContext(value, token);
      })
      .catch(() => active && setUnavailable(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  async function startOrder(event: FormEvent) {
    event.preventDefault();
    const customerName = name.trim();
    if (customerName.length < 2) {
      setError("Digite um nome com pelo menos 2 letras.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/api/public/dining/kits/${encodeURIComponent(token)}/session/customer-name`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: customerName }),
        },
      );
      if (!response.ok) throw new Error("identify_failed");
      const value = (await response.json()) as PublicDiningSession;
      persistContext(value, token);
      setSession(value);
    } catch {
      setError(
        "Não foi possível iniciar agora. Solicite ajuda à equipe Menfi’s.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <DiningState
        icon={<Loader2 className="animate-spin" />}
        title="Validando sua mesa"
        copy="Só um instante..."
      />
    );
  if (unavailable || !session) {
    return (
      <DiningState
        icon={<AlertCircle />}
        title="Mesa ainda não preparada"
        copy="Este QR Code ainda não está disponível. Solicite ajuda à equipe Menfi’s."
      />
    );
  }

  if (session.customerName) {
    return (
      <div className="min-h-dvh bg-white">
        <div
          className="sticky top-0 z-[65] flex items-center justify-between gap-3 px-4 py-3 text-white shadow-lg"
          style={{ background: VERDE }}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
              Pedido no salão
            </p>
            <p className="truncate text-lg font-black">
              Mesa {session.tableName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="rounded-full px-4 py-2 text-xs font-black"
              style={{ background: ROSA, color: VERDE }}
            >
              {session.customerName}
            </div>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event("menfis:dining-open-account"))
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10"
              aria-label="Abrir meus pedidos e conta da mesa"
              title="Meus pedidos"
            >
              <ShoppingCart size={20} />
            </button>
          </div>
        </div>
        <App mode="dining" />
      </div>
    );
  }

  return (
    <main
      className="flex min-h-dvh items-center justify-center px-5 py-8"
      style={{ background: "#FFF8FB", color: VERDE }}
    >
      <section
        className="w-full max-w-md overflow-hidden rounded-[32px] border-2 bg-white shadow-2xl"
        style={{ borderColor: ROSA }}
      >
        <header
          className="px-6 py-7 text-center"
          style={{ background: VERDE, color: "white" }}
        >
          <p
            className="text-[11px] font-black uppercase tracking-[0.28em]"
            style={{ color: ROSA }}
          >
            Menfi’s
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <MapPin size={22} />
            <h1 className="text-3xl font-black uppercase">
              Mesa {session.tableName}
            </h1>
          </div>
          <p className="mt-1 text-xs font-bold uppercase opacity-70">
            {session.tableArea}
          </p>
        </header>
        <form onSubmit={startOrder} className="p-6">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: ROSA }}
          >
            <UserRound size={30} />
          </div>
          <h2 className="mt-4 text-center text-2xl font-black">
            Como podemos te chamar?
          </h2>
          <p className="mt-2 text-center text-sm font-bold opacity-60">
            Informe somente seu nome.
          </p>
          <input
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 80))}
            autoComplete="given-name"
            autoFocus
            placeholder="Seu nome"
            className="mt-5 min-h-14 w-full rounded-2xl border-2 px-5 text-lg font-black outline-none"
            style={{ borderColor: `${VERDE}30` }}
          />
          {error && (
            <p className="mt-3 text-center text-xs font-black text-red-700">
              {error}
            </p>
          )}
          <button
            disabled={saving}
            className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black uppercase disabled:opacity-60"
            style={{ background: VERDE, color: ROSA }}
          >
            {saving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <CheckCircle2 size={20} />
            )}
            Começar pedido
          </button>
          <ol className="mt-6 grid gap-2 text-xs font-bold leading-relaxed opacity-70">
            <li>1. Faça quantos pedidos desejar pelo celular.</li>
            <li>2. Cada pedido será anotado na conta da mesa.</li>
            <li>3. Ao terminar, toque em Encerrar conta.</li>
            <li>
              4. Depois do pagamento, acompanhe o preparo e retire no balcão.
            </li>
          </ol>
        </form>
      </section>
    </main>
  );
}

function persistContext(session: PublicDiningSession, token: string) {
  sessionStorage.setItem(
    DINING_CONTEXT_KEY,
    JSON.stringify({ ...session, token }),
  );
}

function DiningState({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <main
      className="flex min-h-dvh items-center justify-center px-6 text-center"
      style={{ background: "#FFF8FB", color: VERDE }}
    >
      <section
        className="w-full max-w-md rounded-[32px] border-2 bg-white p-8 shadow-xl"
        style={{ borderColor: ROSA }}
      >
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: ROSA }}
        >
          {icon}
        </div>
        <h1 className="mt-5 text-3xl font-black uppercase">{title}</h1>
        <p className="mt-3 text-sm font-bold leading-relaxed opacity-65">
          {copy}
        </p>
      </section>
    </main>
  );
}
