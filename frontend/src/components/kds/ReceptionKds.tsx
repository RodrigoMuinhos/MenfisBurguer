"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, BellOff } from "lucide-react";
import { API_URL } from "@/app/appState";
import styles from "./ReceptionKds.module.css";

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
    <main className={styles.screen}>
      <div className={styles.container}>
        <div className={styles.soundControl}>
          <button
            type="button"
            onClick={soundEnabled ? () => setSoundEnabled(false) : enableSound}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-black uppercase shadow-sm"
          >
            {soundEnabled ? <BellRing size={18} /> : <BellOff size={18} />}
            {soundEnabled ? "Som ativado" : "Ativar som"}
          </button>
        </div>

        <header className={styles.hero}>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-50">Acompanhe seu pedido</p>
          <h1>Painel de pedidos</h1>
          <p className={styles.subtitle}>Procure seu nome e o número do pedido.</p>
          <p className={`${styles.connection} ${connected ? styles.connected : styles.disconnected}`}>
            {connected ? "● Atualização em tempo real" : "● Reconectando…"}
          </p>
        </header>

        <div className={styles.board}>
          {COLUMNS.map((column) => {
            const columnOrders = orders
              .filter((order) => column.statuses.has(order.status))
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            const visibleOrders = columnOrders.slice(0, 10);
            return (
              <section key={column.id} className={styles.stage}>
                <header className={styles.stageHeader} style={{ background: column.color }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2>{column.label}</h2>
                      <p>{column.copy}</p>
                    </div>
                    <span className={styles.counter}>
                      {columnOrders.length}
                    </span>
                  </div>
                </header>
                <div className={styles.ordersGrid}>
                  {columnOrders.length === 0 ? (
                    <p className={styles.emptyState}>
                      Nenhum pedido nesta etapa
                    </p>
                  ) : visibleOrders.map((order) => (
                    <article key={order.id} className={styles.orderCard}>
                      <p>Pedido</p>
                      <div>
                        <strong>{customerLabel(order.customerName)}</strong>
                        <strong>#{order.number}</strong>
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
