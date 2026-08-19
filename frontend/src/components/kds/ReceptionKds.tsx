"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, BellOff } from "lucide-react";
import { API_URL } from "@/app/appState";

type BoardStatus =
  | "CREATED"
  | "PAYMENT_PENDING"
  | "PAYMENT_PROOF_PENDING"
  | "PAYMENT_APPROVED"
  | "PAID"
  | "ACCEPTED"
  | "IN_PREPARATION"
  | "READY";

type BoardOrder = {
  id: string;
  number: number;
  customerName: string;
  status: BoardStatus;
  createdAt: string;
};

const COLUMNS = [
  {
    id: "received",
    label: "Recebidos",
    copy: "Aguardando o início do preparo",
    statuses: new Set<BoardStatus>([
      "CREATED", "PAYMENT_PENDING", "PAYMENT_PROOF_PENDING", "PAYMENT_APPROVED", "PAID", "ACCEPTED",
    ]),
    color: "#F6B8CB",
  },
  {
    id: "preparing",
    label: "Em preparo",
    copy: "Nossa cozinha está preparando",
    statuses: new Set<BoardStatus>(["IN_PREPARATION"]),
    color: "#F6C453",
  },
  {
    id: "ready",
    label: "Prontos",
    copy: "Pode retirar no balcão",
    statuses: new Set<BoardStatus>(["READY"]),
    color: "#A2E61B",
  },
] as const;

export function ReceptionKds() {
  const [orders, setOrders] = useState<BoardOrder[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [connected, setConnected] = useState(true);
  const knownReady = useRef<Set<string> | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  const playReadySound = useCallback(() => {
    const context = audioContext.current;
    if (!context) return;
    void context.resume().then(() => {
      const start = context.currentTime;
      [659.25, 783.99, 987.77].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = frequency;
        oscillator.type = "sine";
        gain.gain.setValueAtTime(0.0001, start + index * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.28, start + index * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.18 + 0.3);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start + index * 0.18);
        oscillator.stop(start + index * 0.18 + 0.32);
      });
    });
  }, []);

  const enableSound = () => {
    const AudioContextClass = window.AudioContext;
    audioContext.current ??= new AudioContextClass();
    setSoundEnabled(true);
    playReadySound();
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`${API_URL}/orders/kiosk-board?_=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        if (!response.ok) throw new Error("board_unavailable");
        const payload = await response.json();
        if (!Array.isArray(payload) || cancelled) return;
        const next = payload as BoardOrder[];
        const nextReady = new Set(next.filter((order) => order.status === "READY").map((order) => order.id));
        if (knownReady.current && soundEnabled) {
          const hasNewReady = [...nextReady].some((id) => !knownReady.current?.has(id));
          if (hasNewReady) playReadySound();
        }
        knownReady.current = nextReady;
        setOrders(next);
        setConnected(true);
      } catch {
        if (!cancelled) setConnected(false);
      }
    };
    void load();
    const timer = window.setInterval(load, 2_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [playReadySound, soundEnabled]);

  const customerLabel = (value: string) => {
    const clean = String(value ?? "").trim();
    if (!clean || clean.toUpperCase().replace("_", "-") === "KIOSK-MOB") return "Cliente";
    return clean.split(/\s+/)[0];
  };

  return (
    <main className="min-h-screen bg-[#FFF9FB] px-3 py-5 text-[#65001F] sm:px-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={soundEnabled ? () => setSoundEnabled(false) : enableSound}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-black uppercase shadow-sm"
          >
            {soundEnabled ? <BellRing size={18} /> : <BellOff size={18} />}
            {soundEnabled ? "Som ativado" : "Ativar som"}
          </button>
        </div>

        <header className="pb-7 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-50">Acompanhe seu pedido</p>
          <h1 className="mt-2 text-4xl font-black sm:text-6xl">Painel de pedidos</h1>
          <p className="mt-2 font-bold opacity-60">Procure seu nome e o número do pedido.</p>
          <p className={`mt-3 text-xs font-black uppercase ${connected ? "text-emerald-600" : "text-red-600"}`}>
            {connected ? "● Atualização em tempo real" : "● Reconectando…"}
          </p>
        </header>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {COLUMNS.map((column) => {
            const columnOrders = orders
              .filter((order) => column.statuses.has(order.status))
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            return (
              <section key={column.id} className="min-h-[65vh] overflow-hidden rounded-3xl border border-[#65001F]/10 bg-white">
                <header className="px-2 py-4 sm:px-5 sm:py-5" style={{ background: column.color }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-black uppercase sm:text-2xl xl:text-3xl">{column.label}</h2>
                      <p className="hidden text-xs font-bold opacity-65 sm:block">{column.copy}</p>
                    </div>
                    <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-white px-2 text-sm font-black sm:h-11 sm:min-w-11 sm:px-3 sm:text-xl">
                      {columnOrders.length}
                    </span>
                  </div>
                </header>
                <div className="grid gap-2 p-2 sm:gap-3 sm:p-4">
                  {columnOrders.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[#65001F]/10 p-9 text-center text-sm font-bold opacity-40">
                      Nenhum pedido nesta etapa
                    </p>
                  ) : columnOrders.map((order) => (
                    <article key={order.id} className="rounded-2xl border border-[#65001F]/10 p-4 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-45">Pedido</p>
                      <div className="mt-1 flex items-end justify-between gap-3">
                        <strong className="truncate text-base font-black sm:text-2xl">{customerLabel(order.customerName)}</strong>
                        <strong className="shrink-0 text-lg font-black sm:text-3xl">#{order.number}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
