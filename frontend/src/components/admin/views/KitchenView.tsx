import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChefHat,
  ClipboardCheck,
  PackageCheck,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Order, OrderStatus } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { StockItem } from "../EstoqueView";
import {
  customerWhatsappUrl,
  copyOrderTxt,
  fmt,
  isKioskMobOrder,
  MENU_STOCK_MAP,
  orderReadyWhatsappUrl,
  printOrderReceipts,
} from "../shared";
import { Metric, OrderDetail } from "./kitchen/KitchenOrderDetail";
import { KitchenStageColumn, primaryKind } from "./kitchen/KitchenKanban";

type ProductKind = "burger" | "chicken" | "bacon";

const KDS_SEEN_ORDERS_KEY = "menfis_kds_seen_orders";
const KDS_SOUND_KEY = "menfis_kds_sound_enabled";
const ACTIVE_STATUSES: OrderStatus[] = ["PAID", "IN_PREPARATION", "READY"];

const TECHNICAL_CARDS = [
  { id: "burger", title: "Menfi's Burger", recipeId: "burger", time: "8-12 min" },
  { id: "chicken", title: "Menfi's Chicken", recipeId: "menfis-chicken", time: "10-14 min" },
  { id: "bacon", title: "Menfi's Bacon", recipeId: "menfis-bacon", time: "9-13 min" },
] as const;

export function KitchenView({
  orders,
  updateOrderStatus,
  deductStock,
  stockItems = [],
}: {
  orders: Order[];
  updateOrderStatus: (id: string, s: OrderStatus) => void | Promise<void>;
  deductStock: (o: Order) => void;
  stockItems?: StockItem[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedId, setSelectedId] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(KDS_SOUND_KEY) !== "false";
  });
  const [busyAction, setBusyAction] = useState("");
  const viewport = useViewportSize();
  const initializedSoundRef = useRef(false);
  const sideBySide = viewport.width >= 1360 && viewport.width >= viewport.height;
  const compact = viewport.width < 980 || viewport.height > viewport.width;

  const dayOrders = useMemo(
    () =>
      orders
        .filter((order) => new Date(order.timestamp).toISOString().slice(0, 10) === selectedDate)
        .sort((a, b) => b.timestamp - a.timestamp),
    [orders, selectedDate],
  );

  const activeOrders = dayOrders
    .filter((order) => ACTIVE_STATUSES.includes(order.status))
    .sort((a, b) => a.timestamp - b.timestamp);

  const stageOrders = {
    PAID: activeOrders.filter((order) => order.status === "PAID"),
    IN_PREPARATION: activeOrders.filter((order) => order.status === "IN_PREPARATION"),
    READY: activeOrders.filter((order) => order.status === "READY"),
  } satisfies Record<"PAID" | "IN_PREPARATION" | "READY", Order[]>;

  const selectedOrder =
    activeOrders.find((order) => order.id === selectedId) ?? activeOrders[0] ?? null;

  useEffect(() => {
    if (!selectedOrder) return;
    setSelectedId(selectedOrder.id);
  }, [selectedOrder?.id]);

  useEffect(() => {
    localStorage.setItem(KDS_SOUND_KEY, String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentIds = activeOrders.map((order) => order.id);
    const stored = new Set(
      JSON.parse(localStorage.getItem(KDS_SEEN_ORDERS_KEY) ?? "[]") as string[],
    );

    if (!initializedSoundRef.current) {
      currentIds.forEach((id) => stored.add(id));
      localStorage.setItem(KDS_SEEN_ORDERS_KEY, JSON.stringify([...stored]));
      initializedSoundRef.current = true;
      return;
    }

    const newOrders = activeOrders.filter((order) => !stored.has(order.id));
    if (newOrders.length > 0 && soundEnabled) {
      playProductSound(primaryKind(newOrders[0]));
    }
    newOrders.forEach((order) => stored.add(order.id));
    localStorage.setItem(KDS_SEEN_ORDERS_KEY, JSON.stringify([...stored]));
  }, [activeOrders.map((order) => order.id).join("|"), soundEnabled]);

  const metrics = {
    total: dayOrders.length,
    preparation: dayOrders.filter((order) => order.status === "IN_PREPARATION").length,
    ready: dayOrders.filter((order) => order.status === "READY").length,
    delivered: dayOrders.filter((order) => order.status === "DELIVERED").length,
    revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
    average:
      dayOrders.length > 0
        ? dayOrders.reduce((sum, order) => sum + order.total, 0) / dayOrders.length
        : 0,
  };

  const runStatusAction = async (order: Order, status: OrderStatus, key: string, url?: string) => {
    if (busyAction) return;
    setBusyAction(`${key}:${order.id}`);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    if (order.status === "PAID" && status === "IN_PREPARATION") deductStock(order);
    try {
      await updateOrderStatus(order.id, status);
    } finally {
      setBusyAction("");
    }
  };

  const production = TECHNICAL_CARDS.map((card) => ({
    ...card,
    possible: possibleUnits(card.recipeId, stockItems),
    cost: recipeCost(card.recipeId, stockItems),
    limiting: limitingIngredient(card.recipeId, stockItems),
  }));
  const critical = stockItems.filter((item) => item.qty <= item.minQty).slice(0, 3);
  const nextOrderRequest = stageOrders.PAID[0];
  const paidColumnOrders = nextOrderRequest
    ? stageOrders.PAID.filter((order) => order.id !== nextOrderRequest.id)
    : stageOrders.PAID;

  return (
    <main style={{ minHeight: "100vh", background: "#FFF8F2", color: VERDE }}>
      <header
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "1fr" : "1fr auto",
          gap: compact ? 10 : 16,
          alignItems: compact ? "start" : "center",
          padding: compact ? "14px 12px" : "18px 20px",
          background: VERDE,
          color: ROSA,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--menfis-font-display)",
              fontSize: "clamp(2.4rem, 5vw, 4.8rem)",
              lineHeight: 0.9,
              letterSpacing: "0.06em",
              margin: 0,
            }}
          >
            COZINHA
          </h1>
          <p style={{ marginTop: 6, fontSize: 12, fontWeight: 900, opacity: 0.72 }}>
            Pedidos de hoje - {formatDate(selectedDate)}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              color: VERDE,
              borderRadius: 14,
              padding: "10px 12px",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            <CalendarDays size={16} />
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setSelectedId("");
              }}
              style={{ border: 0, color: VERDE, fontWeight: 900, outline: "none" }}
            />
          </label>
          <button
            onClick={() => setSoundEnabled((current) => !current)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: soundEnabled ? ROSA : "#fff",
              color: VERDE,
              border: "none",
              borderRadius: 14,
              padding: "12px 14px",
              fontSize: 12,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            Som {soundEnabled ? "ligado" : "desligado"}
          </button>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: compact
            ? "repeat(2, minmax(0, 1fr))"
            : "repeat(6, minmax(0, 1fr))",
          gap: 8,
          padding: 12,
          background: "#fff",
          borderBottom: `1px solid ${ROSA}`,
        }}
      >
        <Metric label="Pedidos hoje" value={String(metrics.total)} />
        <Metric label="Em preparo" value={String(metrics.preparation)} />
        <Metric label="Prontos" value={String(metrics.ready)} />
        <Metric label="Entregues" value={String(metrics.delivered)} />
        <Metric label="Faturamento" value={fmt(metrics.revenue)} />
        <Metric label="Ticket médio" value={fmt(metrics.average)} />
      </section>

      {critical.length > 0 && (
        <section style={{ padding: "10px 14px", background: "#FFF7ED", color: "#9A3412", fontSize: 12, fontWeight: 900 }}>
          Atenção: {critical.map((item) => `${item.name} (${item.qty} ${item.unit})`).join(" · ")}
        </section>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: sideBySide ? "minmax(0,1.55fr) minmax(520px,0.85fr)" : "1fr",
          minHeight: "calc(100vh - 172px)",
        }}
      >
        <div
          style={{
            padding: compact ? 8 : 12,
            borderRight: sideBySide ? `1px solid ${ROSA}` : "none",
            borderBottom: sideBySide ? "none" : `1px solid ${ROSA}`,
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: compact ? "1fr" : "repeat(3, minmax(220px, 1fr))",
              gap: compact ? 8 : 10,
            }}
          >
            <div style={{ display: "grid", gap: compact ? 8 : 10 }}>
              {nextOrderRequest && (
                <NewOrderRequestCard
                  order={nextOrderRequest}
                  busy={Boolean(busyAction)}
                  onSelect={() => setSelectedId(nextOrderRequest.id)}
                  onAccept={() =>
                    runStatusAction(nextOrderRequest, "IN_PREPARATION", "prepare")
                  }
                  onReject={() =>
                    runStatusAction(nextOrderRequest, "CANCELLED", "reject")
                  }
                />
              )}
              <KitchenStageColumn
                title="Pedidos aceitos"
                subtitle="Aceitar e iniciar preparo"
                orders={paidColumnOrders}
                selectedId={selectedOrder?.id}
                actionLabel="Botar em preparo"
                actionIcon="send"
                busyAction={busyAction}
                compact={compact}
                onSelect={setSelectedId}
                onAction={(order) => runStatusAction(order, "IN_PREPARATION", "prepare")}
              />
            </div>
            <KitchenStageColumn
              title="Em preparo"
              subtitle="Produção em andamento"
              orders={stageOrders.IN_PREPARATION}
              selectedId={selectedOrder?.id}
              actionLabel="Marcar pronto"
              actionIcon="check"
              busyAction={busyAction}
              compact={compact}
              onSelect={setSelectedId}
              onAction={(order) => runStatusAction(order, "READY", "ready")}
            />
            <KitchenStageColumn
              title="Pronto"
              subtitle="Aguardando retirada/entrega"
              orders={stageOrders.READY}
              selectedId={selectedOrder?.id}
              actionLabel="Liberar pedido"
              actionIcon="check"
              busyAction={busyAction}
              compact={compact}
              onSelect={setSelectedId}
              onAction={(order) =>
                order.deliveryType === "delivery" && !isKioskMobOrder(order)
                  ? runStatusAction(order, "OUT_FOR_DELIVERY", "route")
                  : runStatusAction(order, "DELIVERED", "deliver")
              }
            />
          </div>
          {activeOrders.length === 0 && (
            <div style={{ marginTop: 14, padding: 28, textAlign: "center", opacity: 0.5, border: `1px dashed ${ROSA}`, borderRadius: 16 }}>
              <ChefHat size={36} />
              <p style={{ marginTop: 10, fontSize: 12, fontWeight: 900 }}>
                Nenhum pedido ativo para esta data.
              </p>
            </div>
          )}
        </div>

        <div style={{ padding: compact ? 8 : 14, overflowY: "auto" }}>
          {selectedOrder ? (
            <OrderDetail
              order={selectedOrder}
              production={production}
              busyAction={busyAction}
              compact={compact || !sideBySide}
              onSendConfirmation={() =>
                runStatusAction(
                  selectedOrder,
                  "IN_PREPARATION",
                  "confirm",
                  customerWhatsappUrl(selectedOrder),
                )
              }
              onSendReady={() =>
                selectedOrder.status === "READY"
                  ? selectedOrder.deliveryType === "delivery" && !isKioskMobOrder(selectedOrder)
                    ? runStatusAction(selectedOrder, "OUT_FOR_DELIVERY", "route")
                    : runStatusAction(selectedOrder, "DELIVERED", "deliver")
                  : runStatusAction(selectedOrder, "READY", "ready", orderReadyWhatsappUrl(selectedOrder))
              }
              onPrintMotoboy={() => printOrderReceipts(selectedOrder)}
              onGenerateTxt={() => void copyOrderTxt(selectedOrder)}
            />
          ) : (
            <div style={{ padding: 40, textAlign: "center", opacity: 0.45 }}>
              <PackageCheck size={42} />
              <p style={{ marginTop: 10, fontSize: 13, fontWeight: 900 }}>
                Selecione um pedido para ver a montagem.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function NewOrderRequestCard({
  order,
  busy,
  onSelect,
  onAccept,
  onReject,
}: {
  order: Order;
  busy: boolean;
  onSelect: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <section
      style={{
        padding: 14,
        borderRadius: 16,
        background: "#65001F",
        color: ROSA,
        border: `2px solid ${ROSA}`,
        boxShadow: "0 14px 30px rgba(101,0,31,0.18)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: ROSA,
            color: VERDE,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ClipboardCheck size={22} strokeWidth={2.6} />
        </div>
        <button
          onClick={onSelect}
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: "left",
            background: "transparent",
            border: "none",
            color: "inherit",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 950, textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.72 }}>
            Nova solicitação para aceitar
          </p>
          <p style={{ marginTop: 2, fontFamily: "var(--menfis-font-display)", fontSize: 30, lineHeight: 1, letterSpacing: "0.04em" }}>
            {order.id}
          </p>
          <p style={{ marginTop: 5, fontSize: 12, fontWeight: 900 }}>
            {order.customerName || "Cliente"} · {fmt(order.total)}
          </p>
          <p style={{ marginTop: 6, fontSize: 11, fontWeight: 800, opacity: 0.72 }}>
            {order.items.map((item) => `${item.qty}x ${item.name}`).join(" · ")}
          </p>
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        <button
          onClick={onReject}
          disabled={busy}
          style={{
            minHeight: 54,
            border: `1.5px solid ${ROSA}`,
            borderRadius: 14,
            background: "transparent",
            color: ROSA,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.58 : 1,
            fontSize: 12,
            fontWeight: 950,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Negar pedido
        </button>
        <button
          onClick={onAccept}
          disabled={busy}
          style={{
            minHeight: 54,
            border: "none",
            borderRadius: 14,
            background: ROSA,
            color: VERDE,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.58 : 1,
            fontSize: 12,
            fontWeight: 950,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Aceitar pedido
        </button>
      </div>
    </section>
  );
}

function useViewportSize() {
  const [size, setSize] = useState({ width: 1280, height: 720 });
  useEffect(() => {
    const update = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function possibleUnits(recipeId: string, stockItems: StockItem[]) {
  const recipe = MENU_STOCK_MAP[recipeId] ?? [];
  if (recipe.length === 0) return 0;
  return Math.max(
    0,
    Math.min(
      ...recipe.map(({ stockId, qty }) => {
        const stock = stockItems.find((item) => item.id === stockId);
        return stock ? Math.floor(stock.qty / qty) : 0;
      }),
    ),
  );
}

function limitingIngredient(recipeId: string, stockItems: StockItem[]) {
  const recipe = MENU_STOCK_MAP[recipeId] ?? [];
  let selectedName = "";
  let selectedPossible = Number.POSITIVE_INFINITY;
  recipe.forEach(({ stockId, qty }) => {
    const stock = stockItems.find((item) => item.id === stockId);
    const possible = stock ? Math.floor(stock.qty / qty) : 0;
    if (possible < selectedPossible) {
      selectedName = stock?.name ?? stockId;
      selectedPossible = possible;
    }
  });
  return selectedName || undefined;
}

function recipeCost(recipeId: string, stockItems: StockItem[]) {
  return (MENU_STOCK_MAP[recipeId] ?? []).reduce((sum, ingredient) => {
    const stock = stockItems.find((item) => item.id === ingredient.stockId);
    return sum + (stock?.unitCost ?? 0) * ingredient.qty;
  }, 0);
}

function playProductSound(kind: ProductKind) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const gain = context.createGain();
    gain.connect(context.destination);
    const frequencies =
      kind === "bacon" ? [660, 880, 990] : kind === "chicken" ? [523, 659] : [392, 523];
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      oscillator.connect(gain);
      const start = context.currentTime + index * 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);
      oscillator.start(start);
      oscillator.stop(start + 0.14);
    });
    window.setTimeout(() => context.close(), 800);
  } catch {
    // O KDS continua funcional se o navegador bloquear áudio.
  }
}
