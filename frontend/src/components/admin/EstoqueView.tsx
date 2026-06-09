import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, X, Trash2, Pencil, AlertTriangle, CheckCircle2,
  XCircle, ArrowUp, ArrowDown, ChevronDown, ChevronUp,
  Calendar, DollarSign, Package, ClipboardList, Clock,
  BookOpen, Save,
} from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import { AuditHistory } from "./stock/AuditHistory";
import { StockList } from "./stock/StockList";
import { StockModal } from "./stock/StockModal";

/* ─── Types ─────────────────────────────────────────── */
export interface StockItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  unitCost: number;
  minQty: number;
  entryDate: string;   // YYYY-MM-DD
  expiryDate: string;  // YYYY-MM-DD
}

export interface Movement {
  id: string;
  timestamp: number;
  type: "entrada" | "saida" | "ajuste" | "cadastro" | "exclusao";
  itemName: string;
  delta: number;
  qtyBefore: number;
  qtyAfter: number;
  note: string;
}

interface RecipeItem {
  id: string;
  stockId: string;
  name: string;
  qty: number;
  unit: string;
  note: string;
}

/* ─── Initial data ───────────────────────────────────── */
export const INITIAL_ITEMS: StockItem[] = [];

export const UNITS = ["un", "kg", "g", "ml", "l", "fts", "pé", "cx", "pct"];

export const fmtR$ = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
export const fmtQty = (n: number, u: string) => `${n % 1 === 0 ? n : n.toFixed(1)} ${u}`;
export const fmtDate = (d: string) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};
export const daysUntil = (d: string) => {
  if (!d) return 9999;
  const diff = new Date(d).getTime() - new Date("2026-06-01").getTime();
  return Math.ceil(diff / 86400000);
};

export function getStatus(item: StockItem): "ok" | "atencao" | "baixo" | "zerado" {
  if (item.qty <= 0)           return "zerado";
  if (item.qty < item.minQty)  return "baixo";
  if (item.qty < item.minQty * 1.8) return "atencao";
  return "ok";
}

export const STATUS_META = {
  ok:      { label: "OK",      Icon: CheckCircle2,  bg: "#ECFDF5", text: "#065F46", border: "#6EE7B7" },
  atencao: { label: "Atenção", Icon: AlertTriangle,  bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
  baixo:   { label: "Baixo",   Icon: AlertTriangle,  bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
  zerado:  { label: "Zerado",  Icon: XCircle,        bg: "#FEF2F2", text: "#7F1D1D", border: "#FCA5A5" },
};

export const MOV_META = {
  entrada:  { label: "Entrada",  color: "#065F46", bg: "#ECFDF5" },
  saida:    { label: "Saída",    color: "#991B1B", bg: "#FEF2F2" },
  ajuste:   { label: "Ajuste",   color: "#1D4ED8", bg: "#EFF6FF" },
  cadastro: { label: "Cadastro", color: "#6B21A8", bg: "#FAF5FF" },
  exclusao: { label: "Exclusão", color: "#374151", bg: "#F9FAFB" },
};

function uid() { return Math.random().toString(36).slice(2, 10); }
function today() { return "2026-06-01"; }

/* ─── Blank form ─────────────────────────────────────── */
const BLANK_FORM: Omit<StockItem, "id"> = {
  name: "", unit: "un", qty: 0, unitCost: 0, minQty: 0,
  entryDate: today(), expiryDate: "",
};

const INITIAL_RECIPE: RecipeItem[] = [];

export type ModalMode = "none" | "add" | "edit" | "movimento" | "audit" | "confirmDelete";

interface EstoqueProps {
  items: StockItem[];
  setItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
  movements: Movement[];
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
  onSaveItem?: (item: StockItem) => void | Promise<void>;
  onMoveItem?: (
    item: StockItem,
    type: "entrada" | "saida",
    quantity: number,
    note: string,
  ) => void | Promise<void>;
  onDeleteItem?: (item: StockItem) => void | Promise<void>;
}

export function EstoqueView({
  items,
  setItems,
  movements,
  setMovements,
  onSaveItem,
  onMoveItem,
  onDeleteItem,
}: EstoqueProps) {

  const [modal, setModal]         = useState<ModalMode>("none");
  const [target, setTarget]       = useState<StockItem | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipe, setRecipe] = useState<RecipeItem[]>(INITIAL_RECIPE);
  const [recipeForm, setRecipeForm] = useState({ stockId: INITIAL_ITEMS[0]?.id ?? "", qty: "1", note: "" });

  /* form for add/edit */
  const [form, setForm] = useState<Omit<StockItem, "id">>(BLANK_FORM);

  /* form for movimentação */
  const [movType, setMovType] = useState<"entrada" | "saida">("entrada");
  const [movQty,  setMovQty]  = useState("");
  const [movNote, setMovNote] = useState("");

  /* ── helpers ─────────────────────────────────────── */
  const totalValue    = items.reduce((s, i) => s + i.qty * i.unitCost, 0);
  const alertItems    = items.filter((i) => getStatus(i) === "baixo" || getStatus(i) === "zerado");
  const expiringItems = items.filter((i) => daysUntil(i.expiryDate) <= 7 && daysUntil(i.expiryDate) >= 0);

  const logMovement = (m: Omit<Movement, "id" | "timestamp">) =>
    setMovements((prev) => [{ ...m, id: uid(), timestamp: Date.now() }, ...prev]);

  /* ── CRUD ─────────────────────────────────────────── */
  const openAdd = () => {
    setForm(BLANK_FORM);
    setModal("add");
  };

  const openEdit = (item: StockItem) => {
    setTarget(item);
    setForm({ name: item.name, unit: item.unit, qty: item.qty, unitCost: item.unitCost, minQty: item.minQty, entryDate: item.entryDate, expiryDate: item.expiryDate });
    setModal("edit");
  };

  const openMovimento = (item: StockItem) => {
    setTarget(item);
    setMovType("entrada");
    setMovQty("");
    setMovNote("");
    setModal("movimento");
  };

  const openConfirmDelete = (item: StockItem) => {
    setTarget(item);
    setModal("confirmDelete");
  };

  const handleAdd = () => {
    if (!form.name.trim()) return;
    const newItem: StockItem = { ...form, id: uid() };
    setItems((prev) => [...prev, newItem]);
    logMovement({ type: "cadastro", itemName: form.name, delta: form.qty, qtyBefore: 0, qtyAfter: form.qty, note: "Item cadastrado" });
    void onSaveItem?.(newItem);
    setModal("none");
  };

  const handleEdit = () => {
    if (!target || !form.name.trim()) return;
    const old = items.find((i) => i.id === target.id)!;
    const updatedItem = { ...old, ...form };
    setItems((prev) => prev.map((i) => i.id === target.id ? updatedItem : i));
    if (form.qty !== old.qty) {
      logMovement({ type: "ajuste", itemName: form.name, delta: form.qty - old.qty, qtyBefore: old.qty, qtyAfter: form.qty, note: "Ajuste manual via edição" });
    }
    void onSaveItem?.(updatedItem);
    setModal("none");
  };

  const handleDelete = () => {
    if (!target) return;
    logMovement({ type: "exclusao", itemName: target.name, delta: -target.qty, qtyBefore: target.qty, qtyAfter: 0, note: "Item excluído do estoque" });
    setItems((prev) => prev.filter((i) => i.id !== target.id));
    void onDeleteItem?.(target);
    setModal("none");
  };

  const handleMovimento = () => {
    if (!target) return;
    const delta = parseFloat(movQty.replace(",", "."));
    if (isNaN(delta) || delta <= 0) return;
    const realDelta = movType === "saida" ? -delta : delta;
    const newQty = Math.max(0, target.qty + realDelta);
    setItems((prev) => prev.map((i) => i.id === target.id ? { ...i, qty: newQty } : i));
    logMovement({ type: movType, itemName: target.name, delta: realDelta, qtyBefore: target.qty, qtyAfter: newQty, note: movNote || "—" });
    void onMoveItem?.(target, movType, delta, movNote || "Movimento ADM");
    setModal("none");
  };

  const closeModal = () => setModal("none");

  const recipeCost = recipe.reduce((sum, item) => {
    const stock = items.find((i) => i.id === item.stockId);
    return sum + item.qty * (stock?.unitCost ?? 0);
  }, 0);

  const handleAddRecipeItem = () => {
    const stock = items.find((i) => i.id === recipeForm.stockId);
    const qty = parseFloat(recipeForm.qty.replace(",", "."));
    if (!stock || isNaN(qty) || qty <= 0) return;
    const existing = recipe.find((i) => i.stockId === stock.id);
    if (existing) {
      setRecipe((prev) => prev.map((i) => i.stockId === stock.id ? { ...i, qty, note: recipeForm.note } : i));
    } else {
      setRecipe((prev) => [...prev, { id: uid(), stockId: stock.id, name: stock.name, qty, unit: stock.unit, note: recipeForm.note }]);
    }
    setRecipeForm({ stockId: stock.id, qty: "1", note: "" });
  };

  const updateRecipeItem = (id: string, patch: Partial<RecipeItem>) =>
    setRecipe((prev) => prev.map((item) => item.id === id ? { ...item, ...patch } : item));

  const removeRecipeItem = (id: string) =>
    setRecipe((prev) => prev.filter((item) => item.id !== id));

  /* ─── Render ──────────────────────────────────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Alert banner ──────────────────────────────── */}
      <AnimatePresence>
        {(alertItems.length > 0 || expiringItems.length > 0) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ background: "#FEF2F2", borderBottom: "1.5px solid #FECACA", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
            {alertItems.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={13} strokeWidth={2.5} style={{ color: "#DC2626", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#991B1B" }}>
                  {alertItems.length} iten{alertItems.length > 1 ? "s" : ""} em estoque crítico:{" "}
                  <span style={{ fontWeight: 900 }}>{alertItems.map((i) => i.name).join(", ")}</span>
                </span>
              </div>
            )}
            {expiringItems.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={13} strokeWidth={2.5} style={{ color: "#D97706", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#92400E" }}>
                  Validade próxima:{" "}
                  <span style={{ fontWeight: 900 }}>
                    {expiringItems.map((i) => `${i.name} (${daysUntil(i.expiryDate)}d)`).join(", ")}
                  </span>
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header / KPIs ─────────────────────────────── */}
      <div style={{ padding: "12px 14px 8px", background: `${VERDE}05`, borderBottom: `1px solid ${VERDE}10` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: VERDE, opacity: 0.4 }}>
              Valor total em estoque
            </p>
            <p style={{ fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: "1.6rem", color: VERDE, lineHeight: 1, marginTop: 2 }}>
              {fmtR$(totalValue)}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <motion.button whileTap={{ scale: 0.94 }}
              onClick={() => setAuditOpen((v) => !v)}
              style={{ height: 36, padding: "0 12px", background: `${VERDE}10`, border: `1.5px solid ${VERDE}20`, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: VERDE, fontSize: 10, fontWeight: 800 }}>
              <ClipboardList size={13} strokeWidth={2} />
              Auditoria
            </motion.button>
            <motion.button whileTap={{ scale: 0.94 }}
              onClick={() => setRecipeOpen((v) => !v)}
              style={{ height: 36, padding: "0 12px", background: recipeOpen ? VERDE : `${VERDE}10`, border: `1.5px solid ${recipeOpen ? VERDE : `${VERDE}20`}`, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: recipeOpen ? ROSA : VERDE, fontSize: 10, fontWeight: 800 }}>
              <BookOpen size={13} strokeWidth={2} />
              Ficha Técnica
            </motion.button>
            <motion.button whileTap={{ scale: 0.94 }}
              onClick={openAdd}
              style={{ height: 36, padding: "0 14px", background: VERDE, border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: ROSA, fontSize: 10, fontWeight: 900 }}>
              <Plus size={14} strokeWidth={2.5} />
              Novo Item
            </motion.button>
          </div>
        </div>

        {/* Mini KPI strip */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { label: "Itens",   value: String(items.length),   Icon: Package },
            { label: "Crítico", value: String(alertItems.length), Icon: AlertTriangle, red: alertItems.length > 0 },
            { label: "Movimentos", value: String(movements.length), Icon: ClipboardList },
          ].map(({ label, value, Icon, red }) => (
            <div key={label} style={{ flex: 1, background: red ? "#FEF2F2" : "#fff", border: `1px solid ${red ? "#FECACA" : `${VERDE}12`}`, borderRadius: 8, padding: "5px 8px", display: "flex", alignItems: "center", gap: 5 }}>
              <Icon size={10} strokeWidth={2} style={{ color: red ? "#DC2626" : VERDE, opacity: red ? 1 : 0.4 }} />
              <span style={{ fontSize: 9, color: red ? "#991B1B" : VERDE, opacity: red ? 1 : 0.5, fontWeight: 700 }}>{label}</span>
              <span style={{ fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: "0.9rem", color: red ? "#DC2626" : VERDE, lineHeight: 1, marginLeft: "auto" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Ficha técnica ─────────────────────────────── */}
      <AnimatePresence>
        {recipeOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ borderBottom: `2px solid ${VERDE}12`, overflow: "hidden", background: "#fff" }}>
            <div style={{ padding: "12px 14px", background: `${VERDE}04`, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BookOpen size={14} strokeWidth={2.3} style={{ color: VERDE }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 900, color: VERDE, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Ficha técnica — Menfi's Burger
                  </p>
                  <p style={{ fontSize: 10, color: VERDE, opacity: 0.45 }}>
                    Custo estimado por unidade: <strong>{fmtR$(recipeCost)}</strong>
                  </p>
                </div>
                <button onClick={() => setRecipeOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: VERDE, opacity: 0.45 }}>
                  <X size={15} strokeWidth={2.4} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 8 }}>
                <select value={recipeForm.stockId} onChange={(e) => setRecipeForm((f) => ({ ...f, stockId: e.target.value }))}
                  style={inputStyle}>
                  {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <input value={recipeForm.qty} onChange={(e) => setRecipeForm((f) => ({ ...f, qty: e.target.value }))}
                  placeholder="Qtd" style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                <input value={recipeForm.note} onChange={(e) => setRecipeForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Informação técnica: ponto, preparo, observação..." style={inputStyle} />
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddRecipeItem}
                  style={{ height: 40, padding: "0 14px", background: VERDE, color: ROSA, border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <Plus size={14} strokeWidth={2.6} />
                  Criar
                </motion.button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {recipe.map((item) => {
                const stock = items.find((i) => i.id === item.stockId);
                const cost = item.qty * (stock?.unitCost ?? 0);
                return (
                  <div key={item.id} style={{ padding: "10px 14px", borderTop: `1px solid ${VERDE}08`, display: "grid", gridTemplateColumns: "1fr 82px 82px auto", gap: 8, alignItems: "center" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 900, color: VERDE, lineHeight: 1 }}>{item.name}</p>
                      <input value={item.note} onChange={(e) => updateRecipeItem(item.id, { note: e.target.value })}
                        placeholder="Adicionar informação técnica" style={{ ...inputStyle, marginTop: 6, padding: "8px 10px", fontSize: 11 }} />
                    </div>
                    <input value={String(item.qty)} onChange={(e) => updateRecipeItem(item.id, { qty: parseFloat(e.target.value.replace(",", ".")) || 0 })}
                      style={{ ...inputStyle, textAlign: "center" }} />
                    <div>
                      <p style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", color: VERDE, opacity: 0.35 }}>Custo</p>
                      <p style={{ fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: "0.95rem", color: VERDE }}>{fmtR$(cost)}</p>
                    </div>
                    <button onClick={() => removeRecipeItem(item.id)}
                      style={{ width: 32, height: 32, border: "none", borderRadius: 9, background: "#FEF2F2", color: "#991B1B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={13} strokeWidth={2.4} />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <StockList
        items={items}
        onEdit={openEdit}
        onMove={(item, type) => {
          openMovimento(item);
          setMovType(type);
        }}
        onDelete={openConfirmDelete}
      />

      <AuditHistory
        open={auditOpen}
        movements={movements}
        onClose={() => setAuditOpen(false)}
      />
      <StockModal
        modal={modal}
        target={target}
        form={form}
        movType={movType}
        movQty={movQty}
        movNote={movNote}
        setForm={setForm}
        setMovType={setMovType}
        setMovQty={setMovQty}
        setMovNote={setMovNote}
        closeModal={closeModal}
        handleAdd={handleAdd}
        handleEdit={handleEdit}
        handleMovimento={handleMovimento}
        handleDelete={handleDelete}
      />
    </div>
  );
}

export function IconBtn({ Icon, color, bg, title, onClick }: {
  Icon: React.ElementType; color: string; bg: string; title: string; onClick: () => void;
}) {
  return (
    <motion.button whileTap={{ scale: 0.88 }} onClick={onClick} title={title}
      style={{ width: 28, height: 28, background: bg, border: "none", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={12} strokeWidth={2.5} style={{ color }} />
    </motion.button>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: `1.5px solid ${VERDE}20`,
  borderRadius: 10,
  fontSize: 13,
  color: VERDE,
  fontFamily: "'Inter', system-ui, sans-serif",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
};
