import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, X, Trash2, Pencil, AlertTriangle, CheckCircle2,
  XCircle, ArrowUp, ArrowDown, ChevronDown, ChevronUp,
  Calendar, DollarSign, Package, ClipboardList, Clock,
  BookOpen, Save,
} from "lucide-react";
import { VERDE, ROSA } from "./types";

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
export const INITIAL_ITEMS: StockItem[] = [
  { id: "1", name: "Pão Brioche",   unit: "un",  qty: 8,   unitCost: 1.80,  minQty: 20,  entryDate: "2026-05-30", expiryDate: "2026-06-05" },
  { id: "2", name: "Carne 70/30",   unit: "kg",  qty: 5.2, unitCost: 28.00, minQty: 3,   entryDate: "2026-05-29", expiryDate: "2026-06-03" },
  { id: "3", name: "Alface",        unit: "pé",  qty: 12,  unitCost: 2.50,  minQty: 5,   entryDate: "2026-05-31", expiryDate: "2026-06-04" },
  { id: "4", name: "Queijo Coelho", unit: "fts", qty: 3,   unitCost: 4.50,  minQty: 6,   entryDate: "2026-05-28", expiryDate: "2026-06-10" },
  { id: "5", name: "Coca-Cola",     unit: "un",  qty: 24,  unitCost: 3.20,  minQty: 12,  entryDate: "2026-05-25", expiryDate: "2026-12-31" },
  { id: "6", name: "Batata Frita",  unit: "kg",  qty: 2.5, unitCost: 8.00,  minQty: 4,   entryDate: "2026-05-29", expiryDate: "2026-06-15" },
  { id: "7", name: "Molho Menfi's", unit: "ml",  qty: 800, unitCost: 0.02,  minQty: 500, entryDate: "2026-05-20", expiryDate: "2026-09-01" },
];

const UNITS = ["un", "kg", "g", "ml", "l", "fts", "pé", "cx", "pct"];

const fmtR$ = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
const fmtQty = (n: number, u: string) => `${n % 1 === 0 ? n : n.toFixed(1)} ${u}`;
const fmtDate = (d: string) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};
const daysUntil = (d: string) => {
  if (!d) return 9999;
  const diff = new Date(d).getTime() - new Date("2026-06-01").getTime();
  return Math.ceil(diff / 86400000);
};

function getStatus(item: StockItem): "ok" | "atencao" | "baixo" | "zerado" {
  if (item.qty <= 0)           return "zerado";
  if (item.qty < item.minQty)  return "baixo";
  if (item.qty < item.minQty * 1.8) return "atencao";
  return "ok";
}

const STATUS_META = {
  ok:      { label: "OK",      Icon: CheckCircle2,  bg: "#ECFDF5", text: "#065F46", border: "#6EE7B7" },
  atencao: { label: "Atenção", Icon: AlertTriangle,  bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
  baixo:   { label: "Baixo",   Icon: AlertTriangle,  bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
  zerado:  { label: "Zerado",  Icon: XCircle,        bg: "#FEF2F2", text: "#7F1D1D", border: "#FCA5A5" },
};

const MOV_META = {
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

const INITIAL_RECIPE: RecipeItem[] = [
  { id: "r1", stockId: "1", name: "Pão Brioche",   qty: 1,   unit: "un",  note: "Pão selado na manteiga" },
  { id: "r2", stockId: "2", name: "Carne 70/30",   qty: 0.1, unit: "kg",  note: "Burger de 100g do blend da casa" },
  { id: "r3", stockId: "4", name: "Queijo Coelho", qty: 1,   unit: "fts", note: "Queijo derretido" },
  { id: "r4", stockId: "3", name: "Alface",        qty: 0.5, unit: "pé",  note: "Alface crocante" },
  { id: "r5", stockId: "7", name: "Molho Menfi's", qty: 30,  unit: "ml",  note: "Molho da casa" },
];

type ModalMode = "none" | "add" | "edit" | "movimento" | "audit" | "confirmDelete";

interface EstoqueProps {
  items: StockItem[];
  setItems: React.Dispatch<React.SetStateAction<StockItem[]>>;
  movements: Movement[];
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
}

export function EstoqueView({ items, setItems, movements, setMovements }: EstoqueProps) {

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
    setModal("none");
  };

  const handleEdit = () => {
    if (!target || !form.name.trim()) return;
    const old = items.find((i) => i.id === target.id)!;
    setItems((prev) => prev.map((i) => i.id === target.id ? { ...i, ...form } : i));
    if (form.qty !== old.qty) {
      logMovement({ type: "ajuste", itemName: form.name, delta: form.qty - old.qty, qtyBefore: old.qty, qtyAfter: form.qty, note: "Ajuste manual via edição" });
    }
    setModal("none");
  };

  const handleDelete = () => {
    if (!target) return;
    logMovement({ type: "exclusao", itemName: target.name, delta: -target.qty, qtyBefore: target.qty, qtyAfter: 0, note: "Item excluído do estoque" });
    setItems((prev) => prev.filter((i) => i.id !== target.id));
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

      {/* ── Stock list ────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <AnimatePresence>
          {items.map((item) => {
            const status = getStatus(item);
            const sm     = STATUS_META[status];
            const Icon   = sm.Icon;
            const expDays = daysUntil(item.expiryDate);
            const expWarn = expDays <= 7;
            const pct = Math.min(100, (item.qty / (item.minQty * 1.8)) * 100);

            return (
              <motion.div key={item.id} layout
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40 }}
                style={{ padding: "11px 14px", borderBottom: `1px solid ${VERDE}08`, background: "#fff" }}>

                {/* Row 1: name + status */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <p style={{ flex: 1, fontSize: 13, fontWeight: 800, color: VERDE, lineHeight: 1 }}>{item.name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: sm.bg, border: `1px solid ${sm.border}`, borderRadius: 999, padding: "2px 8px" }}>
                    <Icon size={10} strokeWidth={2.5} style={{ color: sm.text }} />
                    <span style={{ fontSize: 8, fontWeight: 900, color: sm.text, textTransform: "uppercase", letterSpacing: "0.08em" }}>{sm.label}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 4, background: `${VERDE}10`, borderRadius: 99, marginBottom: 8, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{ height: "100%", borderRadius: 99, background: status === "ok" ? "#10B981" : status === "atencao" ? "#F59E0B" : "#EF4444" }} />
                </div>

                {/* Row 2: qty + cost + value */}
                <div style={{ display: "flex", gap: 12, marginBottom: 7 }}>
                  <div>
                    <p style={{ fontSize: 8, color: VERDE, opacity: 0.4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Qtd atual</p>
                    <p style={{ fontSize: 13, fontWeight: 900, color: status === "zerado" ? "#DC2626" : status === "baixo" ? "#D97706" : VERDE, fontFamily: "'Bebas Neue','Arial Black',sans-serif" }}>
                      {fmtQty(item.qty, item.unit)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 8, color: VERDE, opacity: 0.4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Mínimo</p>
                    <p style={{ fontSize: 13, fontWeight: 900, color: VERDE, fontFamily: "'Bebas Neue','Arial Black',sans-serif" }}>
                      {fmtQty(item.minQty, item.unit)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 8, color: VERDE, opacity: 0.4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Custo unit.</p>
                    <p style={{ fontSize: 11, fontWeight: 700, color: VERDE }}>{fmtR$(item.unitCost)}/{item.unit}</p>
                  </div>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <p style={{ fontSize: 8, color: VERDE, opacity: 0.4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Valor total</p>
                    <p style={{ fontSize: 13, fontWeight: 900, color: VERDE, fontFamily: "'Bebas Neue','Arial Black',sans-serif" }}>
                      {fmtR$(item.qty * item.unitCost)}
                    </p>
                  </div>
                </div>

                {/* Row 3: dates + action buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <ArrowDown size={9} strokeWidth={2.5} style={{ color: VERDE, opacity: 0.35 }} />
                      <span style={{ fontSize: 9, color: VERDE, opacity: 0.45 }}>{fmtDate(item.entryDate)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Calendar size={9} strokeWidth={2.5} style={{ color: expWarn ? "#D97706" : VERDE, opacity: expWarn ? 1 : 0.35 }} />
                      <span style={{ fontSize: 9, color: expWarn ? "#D97706" : VERDE, opacity: expWarn ? 1 : 0.45, fontWeight: expWarn ? 800 : 400 }}>
                        {fmtDate(item.expiryDate)}{expWarn ? ` (${expDays}d)` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 4 }}>
                    <IconBtn Icon={ArrowDown} color="#065F46"  bg="#ECFDF5" title="Saída"  onClick={() => { openMovimento(item); setMovType("saida"); }} />
                    <IconBtn Icon={ArrowUp}   color="#1D4ED8"  bg="#EFF6FF" title="Entrada" onClick={() => { openMovimento(item); setMovType("entrada"); }} />
                    <IconBtn Icon={Pencil}    color={VERDE}    bg={`${VERDE}10`} title="Editar" onClick={() => openEdit(item)} />
                    <IconBtn Icon={Trash2}    color="#991B1B"  bg="#FEF2F2" title="Excluir" onClick={() => openConfirmDelete(item)} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Audit log ─────────────────────────────────── */}
      <AnimatePresence>
        {auditOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ borderTop: `2px solid ${VERDE}15`, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px 4px", background: `${VERDE}04`, display: "flex", alignItems: "center", gap: 6 }}>
              <ClipboardList size={11} strokeWidth={2} style={{ color: VERDE, opacity: 0.5 }} />
              <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: VERDE, opacity: 0.45 }}>
                Auditoria — {movements.length} movimento{movements.length !== 1 ? "s" : ""}
              </span>
              <button onClick={() => setAuditOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: VERDE, opacity: 0.4 }}>
                <X size={14} strokeWidth={2} />
              </button>
            </div>
            {movements.length === 0 && (
              <p style={{ fontSize: 10, color: VERDE, opacity: 0.3, padding: "12px 14px", fontWeight: 700 }}>Nenhum movimento registrado.</p>
            )}
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              {movements.map((m) => {
                const mm = MOV_META[m.type];
                return (
                  <div key={m.id} style={{ display: "flex", gap: 10, padding: "8px 14px", borderBottom: `1px solid ${VERDE}06`, alignItems: "flex-start" }}>
                    <div style={{ padding: "2px 7px", background: mm.bg, borderRadius: 999, flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 8, fontWeight: 900, color: mm.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{mm.label}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: VERDE, lineHeight: 1 }}>{m.itemName}</p>
                      <p style={{ fontSize: 9, color: VERDE, opacity: 0.5, marginTop: 1 }}>
                        {m.qtyBefore} → {m.qtyAfter} · {m.note}
                      </p>
                    </div>
                    <span style={{ fontSize: 8, color: VERDE, opacity: 0.3, flexShrink: 0, marginTop: 1 }}>
                      {new Date(m.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MODALS ════════════════════════════════════════ */}
      <AnimatePresence>
        {modal !== "none" && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60 }} />

            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 61, background: "#fff", borderRadius: "20px 20px 0 0", maxHeight: "90vh", overflowY: "auto" }}>

              {/* Modal header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px", borderBottom: `1.5px solid ${VERDE}10`, position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                <p style={{ fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: "1.1rem", color: VERDE, letterSpacing: "0.08em" }}>
                  {modal === "add"           && "NOVO ITEM"}
                  {modal === "edit"          && "EDITAR ITEM"}
                  {modal === "movimento"     && `MOVIMENTAÇÃO — ${target?.name}`}
                  {modal === "confirmDelete" && "CONFIRMAR EXCLUSÃO"}
                </p>
                <button onClick={closeModal} style={{ width: 30, height: 30, background: `${VERDE}10`, border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={15} strokeWidth={2.5} style={{ color: VERDE }} />
                </button>
              </div>

              {/* ── Add / Edit form ─────────────────────── */}
              {(modal === "add" || modal === "edit") && (
                <div style={{ padding: "16px 18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

                  <Field label="Nome do item">
                    <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Ex: Pão Brioche" style={inputStyle} />
                  </Field>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Unidade">
                      <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} style={inputStyle}>
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </Field>
                    <Field label="Qtd inicial">
                      <input type="number" min="0" step="0.1" value={form.qty || ""} onChange={(e) => setForm((f) => ({ ...f, qty: parseFloat(e.target.value) || 0 }))}
                        placeholder="0" style={inputStyle} />
                    </Field>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Custo unitário (R$)">
                      <input type="number" min="0" step="0.01" value={form.unitCost || ""} onChange={(e) => setForm((f) => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))}
                        placeholder="0,00" style={inputStyle} />
                    </Field>
                    <Field label="Mínimo viável">
                      <input type="number" min="0" step="0.1" value={form.minQty || ""} onChange={(e) => setForm((f) => ({ ...f, minQty: parseFloat(e.target.value) || 0 }))}
                        placeholder="0" style={inputStyle} />
                    </Field>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Data de entrada">
                      <input type="date" value={form.entryDate} onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))} style={inputStyle} />
                    </Field>
                    <Field label="Validade">
                      <input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} style={inputStyle} />
                    </Field>
                  </div>

                  {/* Value preview */}
                  {form.qty > 0 && form.unitCost > 0 && (
                    <div style={{ background: `${VERDE}06`, border: `1px solid ${VERDE}15`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: VERDE, opacity: 0.6 }}>Valor em estoque</span>
                      <span style={{ fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: "1rem", color: VERDE }}>
                        {fmtR$(form.qty * form.unitCost)}
                      </span>
                    </div>
                  )}

                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={modal === "add" ? handleAdd : handleEdit}
                    style={{ width: "100%", padding: "16px", background: form.name.trim() ? VERDE : `${VERDE}30`, border: "none", borderRadius: 14, color: ROSA, fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: "1rem", letterSpacing: "0.12em", cursor: form.name.trim() ? "pointer" : "default" }}>
                    {modal === "add" ? "CADASTRAR ITEM" : "SALVAR ALTERAÇÕES"}
                  </motion.button>
                </div>
              )}

              {/* ── Movimento form ──────────────────────── */}
              {modal === "movimento" && target && (
                <div style={{ padding: "16px 18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* Current stock info */}
                  <div style={{ background: `${VERDE}06`, border: `1px solid ${VERDE}12`, borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: 8, color: VERDE, opacity: 0.4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Estoque atual</p>
                      <p style={{ fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: "1.4rem", color: VERDE, lineHeight: 1 }}>
                        {fmtQty(target.qty, target.unit)}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 8, color: VERDE, opacity: 0.4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Mínimo viável</p>
                      <p style={{ fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: "1.4rem", color: VERDE, lineHeight: 1 }}>
                        {fmtQty(target.minQty, target.unit)}
                      </p>
                    </div>
                  </div>

                  {/* Type toggle */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {(["entrada", "saida"] as const).map((t) => (
                      <button key={t} onClick={() => setMovType(t)}
                        style={{ padding: "12px", border: `2px solid ${movType === t ? (t === "entrada" ? "#1D4ED8" : "#DC2626") : `${VERDE}15`}`, borderRadius: 12, background: movType === t ? (t === "entrada" ? "#EFF6FF" : "#FEF2F2") : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        {t === "entrada" ? <ArrowUp size={14} strokeWidth={2.5} style={{ color: "#1D4ED8" }} /> : <ArrowDown size={14} strokeWidth={2.5} style={{ color: "#DC2626" }} />}
                        <span style={{ fontSize: 11, fontWeight: 900, color: t === "entrada" ? "#1D4ED8" : "#DC2626", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {t === "entrada" ? "Entrada" : "Saída"}
                        </span>
                      </button>
                    ))}
                  </div>

                  <Field label={`Quantidade (${target.unit})`}>
                    <input type="number" min="0" step="0.1" value={movQty}
                      onChange={(e) => setMovQty(e.target.value)}
                      placeholder="0" style={inputStyle} />
                  </Field>

                  {/* Preview after */}
                  {movQty && parseFloat(movQty) > 0 && (
                    <div style={{ background: movType === "entrada" ? "#EFF6FF" : "#FEF2F2", border: `1px solid ${movType === "entrada" ? "#BFDBFE" : "#FECACA"}`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: VERDE, opacity: 0.7 }}>Novo estoque</span>
                      <span style={{ fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: "1rem", color: movType === "entrada" ? "#1D4ED8" : "#DC2626" }}>
                        {fmtQty(Math.max(0, target.qty + (movType === "entrada" ? 1 : -1) * parseFloat(movQty.replace(",", "."))), target.unit)}
                      </span>
                    </div>
                  )}

                  <Field label="Observação (opcional)">
                    <input value={movNote} onChange={(e) => setMovNote(e.target.value)}
                      placeholder="Ex: Compra do fornecedor X..." style={inputStyle} />
                  </Field>

                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={handleMovimento}
                    style={{ width: "100%", padding: "16px", background: movQty && parseFloat(movQty) > 0 ? (movType === "entrada" ? "#1D4ED8" : "#DC2626") : `${VERDE}25`, border: "none", borderRadius: 14, color: "#fff", fontFamily: "'Bebas Neue','Arial Black',sans-serif", fontSize: "1rem", letterSpacing: "0.12em", cursor: movQty && parseFloat(movQty) > 0 ? "pointer" : "default" }}>
                    REGISTRAR {movType === "entrada" ? "ENTRADA" : "SAÍDA"}
                  </motion.button>
                </div>
              )}

              {/* ── Confirm delete ──────────────────────── */}
              {modal === "confirmDelete" && target && (
                <div style={{ padding: "20px 18px 28px", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
                  <div style={{ width: 52, height: 52, background: "#FEF2F2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 size={22} strokeWidth={2} style={{ color: "#DC2626" }} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: VERDE, marginBottom: 4 }}>Excluir "{target.name}"?</p>
                    <p style={{ fontSize: 12, color: VERDE, opacity: 0.5 }}>
                      {fmtQty(target.qty, target.unit)} em estoque · valor {fmtR$(target.qty * target.unitCost)}<br />
                      Esta ação será registrada na auditoria.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, width: "100%" }}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={closeModal}
                      style={{ flex: 1, padding: "14px", background: `${VERDE}10`, border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 800, fontSize: 13, color: VERDE }}>
                      Cancelar
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleDelete}
                      style={{ flex: 1, padding: "14px", background: "#DC2626", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 800, fontSize: 13, color: "#fff" }}>
                      Excluir
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: VERDE, opacity: 0.45 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function IconBtn({ Icon, color, bg, title, onClick }: {
  Icon: React.ElementType; color: string; bg: string; title: string; onClick: () => void;
}) {
  return (
    <motion.button whileTap={{ scale: 0.88 }} onClick={onClick} title={title}
      style={{ width: 28, height: 28, background: bg, border: "none", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={12} strokeWidth={2.5} style={{ color }} />
    </motion.button>
  );
}

const inputStyle: React.CSSProperties = {
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
