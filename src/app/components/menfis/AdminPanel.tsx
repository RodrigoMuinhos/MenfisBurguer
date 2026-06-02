import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  X,
  Store,
  Bike,
  Clock,
  CheckCircle2,
  ChefHat,
  Package,
  DollarSign,
  TrendingUp,
  Check,
} from "lucide-react";
import { VERDE, ROSA, Order, OrderStatus } from "./types";
import { EstoqueView, INITIAL_ITEMS, StockItem, Movement } from "./EstoqueView";

type AdminTab = "cozinha" | "dashboard" | "estoque";

const STAGE_ORDER: OrderStatus[] = [
  "recebido",
  "preparo",
  "pronto",
  "entregue",
];

const STAGE_LABEL: Record<OrderStatus, string> = {
  recebido: "Recebido",
  preparo: "Em Preparo",
  pronto: "Pronto",
  entregue: "Entregue",
};

const STAGE_COLOR: Record<
  OrderStatus,
  { bg: string; text: string; border: string; accent: string }
> = {
  recebido: {
    bg: "#FFFBEB",
    text: "#92400E",
    border: "#FDE68A",
    accent: "#F59E0B",
  },
  preparo: {
    bg: "#EFF6FF",
    text: "#1D4ED8",
    border: "#BFDBFE",
    accent: "#3B82F6",
  },
  pronto: {
    bg: "#ECFDF5",
    text: "#065F46",
    border: "#6EE7B7",
    accent: "#10B981",
  },
  entregue: {
    bg: `${VERDE}10`,
    text: VERDE,
    border: `${VERDE}30`,
    accent: VERDE,
  },
};

const STAGE_ICON: Record<OrderStatus, React.ElementType> = {
  recebido: Clock,
  preparo: ChefHat,
  pronto: CheckCircle2,
  entregue: Package,
};

const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function paymentBadge(order: Order) {
  const status = order.paymentStatus ?? "not_required";
  if (status === "approved") {
    return { label: "Pago", bg: "#ECFDF5", text: "#065F46", border: "#6EE7B7" };
  }
  if (order.paymentProvider === "mercado_pago") {
    return { label: "Pgto pendente", bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" };
  }
  return { label: "Sem online", bg: `${VERDE}08`, text: VERDE, border: `${VERDE}18` };
}

function canAdvanceOrder(order: Order) {
  return (
    order.paymentProvider !== "mercado_pago" ||
    order.paymentStatus === "approved" ||
    order.status !== "recebido"
  );
}

function elapsed(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}min`;
}

/* ─── Menu → Estoque recipe map ──────────────────────── */
// Each cart item ID maps to the stock ingredients it consumes (per unit sold)
const MENU_STOCK_MAP: Record<
  string,
  Array<{ stockId: string; qty: number }>
> = {
  burger: [
    { stockId: "1", qty: 1 }, // Pão Brioche
    { stockId: "2", qty: 0.1 }, // Carne 70/30
    { stockId: "3", qty: 0.5 }, // Alface
    { stockId: "4", qty: 1 }, // Queijo Coelho
    { stockId: "7", qty: 30 }, // Molho Menfi's
  ],
  combo: [
    { stockId: "1", qty: 1 },
    { stockId: "2", qty: 0.1 },
    { stockId: "3", qty: 0.5 },
    { stockId: "4", qty: 1 },
    { stockId: "7", qty: 30 },
    { stockId: "5", qty: 1 }, // Coca-Cola
    { stockId: "6", qty: 0.25 }, // Batata Frita
  ],
  combo2: [
    { stockId: "1", qty: 2 },
    { stockId: "2", qty: 0.2 },
    { stockId: "3", qty: 1 },
    { stockId: "4", qty: 2 },
    { stockId: "7", qty: 60 },
    { stockId: "5", qty: 2 },
    { stockId: "6", qty: 0.25 },
  ],
  batata: [{ stockId: "6", qty: 0.25 }],
  cola: [{ stockId: "5", qty: 1 }],
  "extra-carne": [{ stockId: "2", qty: 0.1 }],
  "extra-queijo": [{ stockId: "4", qty: 1 }],
  "extra-bebida": [{ stockId: "5", qty: 1 }],
  "extra-molho": [{ stockId: "7", qty: 20 }],
};

interface Props {
  orders: Order[];
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  onClose: () => void;
}

export function AdminPanel({ orders, updateOrderStatus, onClose }: Props) {
  const [tab, setTab] = useState<AdminTab>("cozinha");

  /* ── Shared stock state (owned here, passed down to EstoqueView) ── */
  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_ITEMS);
  const [stockMovements, setStockMovements] = useState<Movement[]>([]);
  const stockItemsRef = useRef(stockItems);
  stockItemsRef.current = stockItems;

  /* ── Deduct ingredients from stock when kitchen accepts an order ── */
  const deductStockForOrder = (order: Order) => {
    const current = stockItemsRef.current;

    // Sum up all ingredient deductions for every cart item × qty
    const deductions = new Map<string, number>();
    order.items.forEach((cartItem) => {
      (MENU_STOCK_MAP[cartItem.id] ?? []).forEach(({ stockId, qty }) => {
        deductions.set(
          stockId,
          (deductions.get(stockId) ?? 0) + qty * cartItem.qty,
        );
      });
    });

    // Apply to stock
    setStockItems((prev) =>
      prev.map((si) => {
        const d = deductions.get(si.id);
        return d !== undefined ? { ...si, qty: Math.max(0, si.qty - d) } : si;
      }),
    );

    // Audit log entries for every deducted ingredient
    const newMovs: Movement[] = [];
    deductions.forEach((delta, stockId) => {
      const si = current.find((s) => s.id === stockId);
      if (!si || delta <= 0) return;
      newMovs.push({
        id: uid(),
        timestamp: Date.now(),
        type: "saida",
        itemName: si.name,
        delta: -delta,
        qtyBefore: si.qty,
        qtyAfter: Math.max(0, si.qty - delta),
        note: `Pedido ${order.id} aceito`,
      });
    });
    if (newMovs.length > 0) setStockMovements((prev) => [...newMovs, ...prev]);
  };

  const tabs: { id: AdminTab; label: string; Icon: React.ElementType }[] = [
    { id: "cozinha", label: "Cozinha", Icon: ChefHat },
    { id: "dashboard", label: "Dashboard", Icon: TrendingUp },
    { id: "estoque", label: "Estoque", Icon: Package },
  ];

  const activeOrders = orders.filter((o) => o.status !== "entregue").length;
  const todayRevenue = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#fff",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* HEADER */}
      <div
        className="flex items-center gap-3 px-4 pt-5 pb-4"
        style={{ background: VERDE, borderBottom: `2px solid ${ROSA}22` }}
      >
        <img
          src="/logo_M_square.png"
          alt="Admin"
          width={36}
          height={36}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            objectFit: "cover",
            background: "#fff",
            border: `1.5px solid ${ROSA}55`,
          }}
        />
        <div className="flex-1">
          <p
            className="font-black uppercase tracking-widest"
            style={{
              color: ROSA,
              fontFamily: "'Bebas Neue','Arial Black',sans-serif",
              fontSize: "1.2rem",
              letterSpacing: "0.15em",
              lineHeight: 1,
            }}
          >
            Menfi's ERP
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: `${ROSA}70` }}>
            {activeOrders} pedido{activeOrders !== 1 ? "s" : ""} ativo
            {activeOrders !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-full"
          style={{
            width: 36,
            height: 36,
            background: `${ROSA}20`,
            border: "none",
            color: ROSA,
            cursor: "pointer",
          }}
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* TABS */}
      <div
        className="flex"
        style={{ background: VERDE, borderBottom: `2px solid ${ROSA}22` }}
      >
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-black uppercase tracking-wider"
            style={{
              background: tab === id ? ROSA : "none",
              color: tab === id ? VERDE : `${ROSA}60`,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <Icon size={13} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div
        style={
          tab === "cozinha"
            ? { padding: 0, paddingBottom: 0 }
            : { padding: "16px", paddingBottom: "40px" }
        }
      >
        {tab === "cozinha" && (
          <KitchenView
            orders={orders}
            updateOrderStatus={updateOrderStatus}
            deductStock={deductStockForOrder}
          />
        )}
        {tab === "dashboard" && (
          <DashboardView orders={orders} todayRevenue={todayRevenue} />
        )}
        {tab === "estoque" && (
          <EstoqueView
            items={stockItems}
            setItems={setStockItems}
            movements={stockMovements}
            setMovements={setStockMovements}
          />
        )}
      </div>
    </div>
  );
}

/* ─── KDS — 3-COLUMN KANBAN ─────────────────────────── */
function KitchenView({
  orders,
  updateOrderStatus,
  deductStock,
}: {
  orders: Order[];
  updateOrderStatus: (id: string, s: OrderStatus) => void;
  deductStock: (o: Order) => void;
}) {
  const KANBAN_STAGES: OrderStatus[] = ["recebido", "preparo", "pronto"];

  // 2D selection: col = kanban column, row = card within that column
  const [selectedCol, setSelectedCol] = useState(0);
  const [selectedRow, setSelectedRow] = useState(0);

  const getColOrders = (stage: OrderStatus) =>
    orders
      .filter((o) => o.status === stage)
      .sort((a, b) => a.timestamp - b.timestamp);

  const currentStage = KANBAN_STAGES[Math.min(selectedCol, 2)];
  const currentColArr = getColOrders(currentStage);
  const clampedRow = Math.min(
    selectedRow,
    Math.max(0, currentColArr.length - 1),
  );
  const selectedOrder = currentColArr[clampedRow] ?? null;
  const selectedAddedItems = selectedOrder
    ? selectedOrder.items.filter((item) => item.id.startsWith("extra-"))
    : [];
  const selectedRemovedItems = selectedOrder
    ? Object.entries(selectedOrder.removedByItemId ?? {})
        .flatMap(([, removed]) => removed)
        .filter((value, index, arr) => arr.indexOf(value) === index)
    : [];
  const selectedCanAdvance = selectedOrder ? canAdvanceOrder(selectedOrder) : false;

  // Clamp row if orders leave the column after Enter
  useEffect(() => {
    const len = getColOrders(currentStage).length;
    if (len > 0 && selectedRow >= len) setSelectedRow(len - 1);
  }, [orders, selectedCol]);

  const advance = (o: Order) => {
    const nextIdx = STAGE_ORDER.indexOf(o.status) + 1;
    if (nextIdx >= STAGE_ORDER.length) return;
    if (!canAdvanceOrder(o)) return;
    // Deduct stock only when the kitchen accepts the order (recebido → preparo)
    if (o.status === "recebido") deductStock(o);
    updateOrderStatus(o.id, STAGE_ORDER[nextIdx]);
  };

  // Refs so the keydown handler always sees fresh values without re-registering
  const selectedOrderRef = useRef<Order | null>(null);
  selectedOrderRef.current = selectedOrder;

  const getColLenRef = useRef<() => number>(() => 0);
  getColLenRef.current = () => {
    const stage = KANBAN_STAGES[selectedCol];
    return orders.filter((o) => o.status === stage).length;
  };

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = e.code;
      const k = e.key;

      // 4 ← : previous column
      if (c === "Numpad4" || k === "ArrowLeft") {
        e.preventDefault();
        setSelectedCol((col) => Math.max(0, col - 1));
        setSelectedRow(0);

        // 6 → : next column
      } else if (c === "Numpad6" || k === "ArrowRight") {
        e.preventDefault();
        setSelectedCol((col) => Math.min(2, col + 1));
        setSelectedRow(0);

        // 8 ↑ : card above in same column
      } else if (c === "Numpad8" || k === "ArrowUp") {
        e.preventDefault();
        setSelectedRow((r) => Math.max(0, r - 1));

        // 2 ↓ : card below in same column
      } else if (c === "Numpad2" || k === "ArrowDown") {
        e.preventDefault();
        const max = Math.max(0, getColLenRef.current() - 1);
        setSelectedRow((r) => Math.min(max, r + 1));

        // Enter : advance selected order to next stage (ONLY key that changes status)
      } else if (c === "NumpadEnter" || c === "Enter" || k === "Enter") {
        e.preventDefault();
        const order = selectedOrderRef.current;
        if (order) advanceRef.current(order);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // register once only — refs keep values fresh

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <ChefHat
          size={40}
          strokeWidth={1.5}
          style={{ color: VERDE, opacity: 0.18 }}
        />
        <p
          className="text-xs font-black uppercase tracking-widest"
          style={{ color: VERDE, opacity: 0.3 }}
        >
          Nenhum pedido ainda
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* ── 3-Column Kanban ─────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 0,
          minHeight: 280,
          borderBottom: `1px solid ${VERDE}10`,
        }}
      >
        {KANBAN_STAGES.map((stage, colIdx) => {
          const sc = STAGE_COLOR[stage];
          const Icon = STAGE_ICON[stage];
          const colOrders = getColOrders(stage);
          const isActiveCol = colIdx === selectedCol;

          return (
            <div
              key={stage}
              style={{
                display: "flex",
                flexDirection: "column",
                borderRight: colIdx < 2 ? `1px solid ${VERDE}10` : "none",
              }}
            >
              {/* Column header */}
              <div
                style={{
                  padding: "8px 8px 6px",
                  background: sc.bg,
                  borderBottom: `2px solid ${sc.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Icon size={11} strokeWidth={2.5} style={{ color: sc.text }} />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: sc.text,
                    lineHeight: 1,
                  }}
                >
                  {STAGE_LABEL[stage]}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    background: sc.accent,
                    color: "#fff",
                    borderRadius: 999,
                    fontSize: 9,
                    fontWeight: 900,
                    minWidth: 16,
                    height: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                  }}
                >
                  {colOrders.length}
                </span>
              </div>

              {/* Cards */}
              <div
                style={{
                  flex: 1,
                  padding: "6px 6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  overflowY: "auto",
                  maxHeight: 320,
                }}
              >
                <AnimatePresence>
                  {colOrders.map((order, rowIdx) => {
                    const isSelected = isActiveCol && rowIdx === clampedRow;
                    const pay = paymentBadge(order);
                    return (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => {
                          setSelectedCol(colIdx);
                          setSelectedRow(rowIdx);
                        }}
                        style={{
                          background: isSelected ? sc.bg : "#fff",
                          border: `2px solid ${isSelected ? sc.accent : sc.border + "80"}`,
                          borderRadius: 10,
                          padding: "7px 8px",
                          cursor: "pointer",
                          boxShadow: isSelected
                            ? `0 0 0 3px ${sc.accent}30`
                            : "none",
                          transition: "box-shadow 0.2s",
                        }}
                      >
                        {/* Card header */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 3,
                          }}
                        >
                          <span
                            style={{
                              fontFamily:
                                "'Bebas Neue','Arial Black',sans-serif",
                              fontSize: "0.95rem",
                              color: sc.text,
                              lineHeight: 1,
                            }}
                          >
                            {order.id}
                          </span>
                          <span
                            style={{
                              fontSize: 8,
                              color: sc.text,
                              opacity: 0.6,
                            }}
                          >
                            {elapsed(order.timestamp)}
                          </span>
                        </div>
                        {/* Items */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                            marginBottom: 4,
                          }}
                        >
                          {order.items.map((item) => (
                            <span
                              key={item.id}
                              style={{
                                fontSize: 8.5,
                                color: VERDE,
                                opacity: 0.8,
                                lineHeight: 1.3,
                              }}
                            >
                              {item.qty}× {item.name}
                            </span>
                          ))}
                        </div>
                        {/* Delivery badge */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            flexWrap: "wrap",
                          }}
                        >
                          {order.deliveryType === "delivery" ? (
                            <Bike
                              size={9}
                              strokeWidth={2}
                              style={{ color: sc.text, opacity: 0.6 }}
                            />
                          ) : (
                            <Store
                              size={9}
                              strokeWidth={2}
                              style={{ color: sc.text, opacity: 0.6 }}
                            />
                          )}
                          <span
                            style={{
                              fontSize: 8,
                              color: sc.text,
                              opacity: 0.55,
                              fontWeight: 700,
                            }}
                          >
                            {order.deliveryType === "delivery"
                              ? "Delivery"
                              : "Retirada"}
                          </span>
                          <span
                            style={{
                              background: pay.bg,
                              color: pay.text,
                              border: `1px solid ${pay.border}`,
                              borderRadius: 999,
                              fontSize: 7,
                              fontWeight: 900,
                              padding: "1px 5px",
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                            }}
                          >
                            {pay.label}
                          </span>
                          {isSelected && (
                            <span
                              style={{
                                marginLeft: "auto",
                                background: sc.accent,
                                color: "#fff",
                                borderRadius: 999,
                                fontSize: 7,
                                fontWeight: 900,
                                padding: "1px 5px",
                                letterSpacing: "0.06em",
                              }}
                            >
                              SELECIONADO
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {colOrders.length === 0 && (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.2,
                    }}
                  >
                    <Icon
                      size={20}
                      strokeWidth={1.5}
                      style={{ color: sc.text }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Entregues recentes ───────────────────────────── */}
      {orders.filter((o) => o.status === "entregue").length > 0 && (
        <div
          style={{ padding: "8px 10px", borderBottom: `1px solid ${VERDE}08` }}
        >
          <p
            style={{
              fontSize: 8,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: VERDE,
              opacity: 0.3,
              marginBottom: 4,
            }}
          >
            Entregues
          </p>
          <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            {[...orders]
              .filter((o) => o.status === "entregue")
              .reverse()
              .slice(0, 5)
              .map((o) => (
                <div
                  key={o.id}
                  style={{
                    flexShrink: 0,
                    background: `${VERDE}06`,
                    border: `1px solid ${VERDE}10`,
                    borderRadius: 8,
                    padding: "4px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Package
                    size={10}
                    strokeWidth={2}
                    style={{ color: VERDE, opacity: 0.3 }}
                  />
                  <span
                    style={{
                      fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                      fontSize: "0.85rem",
                      color: VERDE,
                      opacity: 0.35,
                    }}
                  >
                    {o.id}
                  </span>
                  <span style={{ fontSize: 8, color: VERDE, opacity: 0.25 }}>
                    {fmt(o.total)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Kitchen Keyboard Controller ─────────────────── */}
      {orders.filter((o) => o.status !== "entregue").length > 0 && (
        <div style={{ background: VERDE, padding: "14px 14px 18px" }}>
          {/* Selected order info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              {selectedOrder ? (
                <>
                  <p
                    style={{
                      color: ROSA,
                      fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                      fontSize: "1.35rem",
                      lineHeight: 1,
                      letterSpacing: "0.07em",
                    }}
                  >
                    {selectedOrder.id} — {STAGE_LABEL[selectedOrder.status]}
                  </p>
                  <p
                    style={{
                      color: `${ROSA}70`,
                      fontSize: 10,
                      marginTop: 3,
                      fontWeight: 700,
                    }}
                  >
                    {selectedOrder.deliveryType === "delivery"
                      ? "Entrega"
                      : "Retirada no balcão"}{" "}
                    · {fmt(selectedOrder.total)}
                  </p>
                </>
              ) : (
                <p style={{ color: `${ROSA}50`, fontSize: 10 }}>
                  Selecione um pedido
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {KANBAN_STAGES.map((s) => {
                const sc = STAGE_COLOR[s];
                const isCurrentStage = selectedOrder?.status === s;
                return (
                  <div
                    key={s}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: isCurrentStage ? sc.accent : `${ROSA}25`,
                      transition: "background 0.3s",
                    }}
                  />
                );
              })}
            </div>
          </div>

          {selectedOrder && (
            <div
              style={{
                background: `${ROSA}14`,
                border: `1.5px solid ${ROSA}35`,
                borderRadius: 12,
                padding: "10px 12px",
                marginBottom: 10,
              }}
            >
              {(() => {
                const pay = paymentBadge(selectedOrder);
                return (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      background: pay.bg,
                      border: `1px solid ${pay.border}`,
                      borderRadius: 10,
                      padding: "8px 10px",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        color: pay.text,
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {pay.label}
                    </span>
                    <span
                      style={{
                        color: pay.text,
                        fontSize: 10,
                        fontWeight: 800,
                        opacity: 0.75,
                      }}
                    >
                      {selectedOrder.paymentMethod === "pix"
                        ? "Pix"
                        : selectedOrder.paymentMethod === "cartao"
                          ? "Cartão"
                          : "Atendimento"}
                    </span>
                  </div>
                );
              })()}
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: ROSA,
                  opacity: 0.9,
                  marginBottom: 8,
                }}
              >
                Detalhes do pedido
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {selectedOrder.items.map((item, idx) => {
                  const removedForItem =
                    selectedOrder.removedByItemId?.[item.id] ?? [];
                  return (
                    <div
                      key={`${item.id}-${idx}`}
                      style={{
                        borderBottom:
                          idx < selectedOrder.items.length - 1
                            ? `1px solid ${ROSA}25`
                            : "none",
                        paddingBottom:
                          idx < selectedOrder.items.length - 1 ? 6 : 0,
                      }}
                    >
                      <p
                        style={{
                          color: ROSA,
                          fontSize: 12,
                          fontWeight: 900,
                          lineHeight: 1.25,
                        }}
                      >
                        {item.qty}× {item.name}
                      </p>
                      {removedForItem.length > 0 && (
                        <p
                          style={{
                            color: `${ROSA}88`,
                            fontSize: 10,
                            marginTop: 2,
                          }}
                        >
                          Retirar: {removedForItem.join(", ")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {(selectedAddedItems.length > 0 ||
                selectedRemovedItems.length > 0) && (
                <div
                  style={{
                    marginTop: 8,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      background: `${ROSA}14`,
                      border: `1px solid ${ROSA}30`,
                      borderRadius: 8,
                      padding: "6px 8px",
                    }}
                  >
                    <p
                      style={{
                        color: ROSA,
                        fontSize: 9,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 3,
                      }}
                    >
                      Adicionados
                    </p>
                    <p
                      style={{
                        color: `${ROSA}90`,
                        fontSize: 10,
                        lineHeight: 1.35,
                      }}
                    >
                      {selectedAddedItems.length > 0
                        ? selectedAddedItems
                            .map((item) => `${item.qty}× ${item.name}`)
                            .join(" · ")
                        : "Nenhum"}
                    </p>
                  </div>
                  <div
                    style={{
                      background: `${ROSA}14`,
                      border: `1px solid ${ROSA}30`,
                      borderRadius: 8,
                      padding: "6px 8px",
                    }}
                  >
                    <p
                      style={{
                        color: ROSA,
                        fontSize: 9,
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 3,
                      }}
                    >
                      Retirados
                    </p>
                    <p
                      style={{
                        color: `${ROSA}90`,
                        fontSize: 10,
                        lineHeight: 1.35,
                      }}
                    >
                      {selectedRemovedItems.length > 0
                        ? selectedRemovedItems.join(" · ")
                        : "Nenhum"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Keyboard layout */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* CONFIRMAR — big button */}
            <motion.button
              whileTap={{ scale: 0.94, y: 3 }}
              onClick={() => selectedOrder && advance(selectedOrder)}
              disabled={!selectedOrder || !selectedCanAdvance}
              style={{
                flex: 1,
                height: 88,
                background: selectedCanAdvance ? ROSA : `${ROSA}30`,
                border: "none",
                borderRadius: 14,
                cursor: selectedCanAdvance ? "pointer" : "default",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                boxShadow: selectedCanAdvance
                  ? `0 6px 0 ${ROSA}60, 0 8px 20px rgba(0,0,0,0.3)`
                  : "none",
                transition: "all 0.2s",
              }}
            >
              <Check
                size={22}
                strokeWidth={3}
                style={{ color: selectedCanAdvance ? VERDE : `${ROSA}50` }}
              />
              <span
                style={{
                  fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                  fontSize: "1.05rem",
                  letterSpacing: "0.12em",
                  color: selectedCanAdvance ? VERDE : `${ROSA}40`,
                  lineHeight: 1,
                }}
              >
                {selectedOrder && !selectedCanAdvance
                  ? "AGUARDANDO PAGAMENTO"
                  : "CONFIRMAR"}
              </span>
              {selectedOrder &&
                selectedCanAdvance &&
                STAGE_ORDER.indexOf(selectedOrder.status) + 1 <
                  STAGE_ORDER.length && (
                  <span
                    style={{
                      fontSize: 8,
                      color: `${VERDE}80`,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                    }}
                  >
                    →{" "}
                    {
                      STAGE_LABEL[
                        STAGE_ORDER[
                          STAGE_ORDER.indexOf(selectedOrder.status) + 1
                        ]
                      ]
                    }
                  </span>
                )}
            </motion.button>
          </div>

          {/* Navigation hint */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 8, color: `${ROSA}40`, fontWeight: 700 }}>
              col {selectedCol + 1}/3 · linha {clampedRow + 1}/
              {Math.max(1, currentColArr.length)}
            </span>
            <span style={{ fontSize: 8, color: `${ROSA}40` }}>
              4/6 coluna · 8/2 linha · Enter avançar
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── DASHBOARD ─────────────────────────────────────── */
function DashboardView({
  orders,
  todayRevenue,
}: {
  orders: Order[];
  todayRevenue: number;
}) {
  const deliveryCount = orders.filter(
    (o) => o.deliveryType === "delivery",
  ).length;
  const retiradaCount = orders.filter(
    (o) => o.deliveryType === "retirada",
  ).length;
  const avgTicket = orders.length ? todayRevenue / orders.length : 0;

  const kpis = [
    {
      label: "Vendas",
      value: fmt(todayRevenue),
      Icon: DollarSign,
      sub: `${orders.length} pedidos`,
    },
    {
      label: "Ticket Médio",
      value: fmt(avgTicket),
      Icon: TrendingUp,
      sub: "por pedido",
    },
    {
      label: "Delivery",
      value: String(deliveryCount),
      Icon: Bike,
      sub: "para entrega",
    },
    {
      label: "Retirada",
      value: String(retiradaCount),
      Icon: Store,
      sub: "no balcão",
    },
  ];

  const pieData = [
    { name: "Retirada", value: Math.max(retiradaCount, 0.01), color: VERDE },
    { name: "Delivery", value: Math.max(deliveryCount, 0.01), color: ROSA },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {kpis.map(({ label, value, Icon, sub }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{
              background: "#fff",
              border: `1.5px solid ${VERDE}10`,
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: VERDE, opacity: 0.4 }}
              >
                {label}
              </span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: ROSA }}
              >
                <Icon size={13} strokeWidth={2} style={{ color: VERDE }} />
              </div>
            </div>
            <p
              className="font-black"
              style={{
                color: VERDE,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "1.25rem",
                lineHeight: 1.1,
              }}
            >
              {value}
            </p>
            <p
              className="text-[10px] mt-1"
              style={{ color: VERDE, opacity: 0.35 }}
            >
              {sub}
            </p>
          </div>
        ))}
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ background: "#fff", border: `1.5px solid ${VERDE}10` }}
      >
        <p
          className="text-[10px] font-black uppercase tracking-widest mb-4"
          style={{ color: VERDE, opacity: 0.4 }}
        >
          Canal de pedidos
        </p>
        <div className="flex items-center gap-4">
          <PieChart width={100} height={100}>
            <Pie
              data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={26}
              outerRadius={48}
              paddingAngle={3}
              strokeWidth={0}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={pieData[i].color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [v, ""]}
              contentStyle={{
                background: "#fff",
                border: `1px solid ${VERDE}20`,
                borderRadius: 8,
                fontSize: 11,
              }}
            />
          </PieChart>
          <div className="flex flex-col gap-3 flex-1">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: d.color }}
                />
                <span className="text-xs flex-1" style={{ color: VERDE }}>
                  {d.name}
                </span>
                <span className="text-xs font-black" style={{ color: VERDE }}>
                  {orders.length
                    ? Math.round((d.value / orders.length) * 100)
                    : 0}
                  %
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {orders.length > 0 && (
        <div>
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-2"
            style={{ color: VERDE, opacity: 0.35 }}
          >
            Últimos pedidos
          </p>
          <div className="flex flex-col gap-2">
            {[...orders]
              .reverse()
              .slice(0, 5)
              .map((o) => {
                const sc = STAGE_COLOR[o.status];
                return (
                  <div
                    key={o.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{
                      background: "#fff",
                      border: `1.5px solid ${VERDE}08`,
                    }}
                  >
                    <span
                      className="font-black shrink-0"
                      style={{
                        color: VERDE,
                        fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                      }}
                    >
                      {o.id}
                    </span>
                    <span
                      className="text-[10px] flex-1 truncate"
                      style={{ color: VERDE, opacity: 0.45 }}
                    >
                      {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                    </span>
                    <span
                      className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase shrink-0"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {STAGE_LABEL[o.status]}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
