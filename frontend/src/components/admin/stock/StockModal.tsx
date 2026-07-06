import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ArrowDown, ArrowUp, X } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import {
  fmtQty,
  fmtR$,
  inputStyle,
  ModalMode,
  StockItem,
  UNITS,
} from "../EstoqueView";

export function StockModal({
  modal,
  target,
  form,
  movType,
  movQty,
  movNote,
  setForm,
  setMovType,
  setMovQty,
  setMovNote,
  closeModal,
  handleAdd,
  handleEdit,
  handleMovimento,
  handleDelete,
}: {
  modal: ModalMode;
  target: StockItem | null;
  form: Omit<StockItem, "id">;
  movType: "entrada" | "saida";
  movQty: string;
  movNote: string;
  setForm: React.Dispatch<React.SetStateAction<Omit<StockItem, "id">>>;
  setMovType: React.Dispatch<React.SetStateAction<"entrada" | "saida">>;
  setMovQty: React.Dispatch<React.SetStateAction<string>>;
  setMovNote: React.Dispatch<React.SetStateAction<string>>;
  closeModal: () => void;
  handleAdd: () => void;
  handleEdit: () => void;
  handleMovimento: () => void;
  handleDelete: () => void;
}) {
  return (
    <AnimatePresence>
      {modal !== "none" && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60 }}
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 61,
              background: "#fff",
              borderRadius: "20px 20px 0 0",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <ModalHeader modal={modal} target={target} onClose={closeModal} />

            {(modal === "add" || modal === "edit") && (
              <ItemForm
                form={form}
                setForm={setForm}
                onSubmit={modal === "add" ? handleAdd : handleEdit}
                submitLabel={modal === "add" ? "CADASTRAR ITEM" : "SALVAR ALTERAÇÕES"}
              />
            )}

            {modal === "movimento" && target && (
              <MovementForm
                target={target}
                movType={movType}
                movQty={movQty}
                movNote={movNote}
                setMovType={setMovType}
                setMovQty={setMovQty}
                setMovNote={setMovNote}
                onSubmit={handleMovimento}
              />
            )}

            {modal === "confirmDelete" && target && (
              <DeleteConfirm target={target} onDelete={handleDelete} />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ModalHeader({
  modal,
  target,
  onClose,
}: {
  modal: ModalMode;
  target: StockItem | null;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 18px 12px",
        borderBottom: `1.5px solid ${VERDE}10`,
        position: "sticky",
        top: 0,
        background: "#fff",
        zIndex: 1,
      }}
    >
      <p style={{ fontFamily: "var(--menfis-font-display)", fontSize: "1.1rem", color: VERDE, letterSpacing: "0.08em" }}>
        {modal === "add" && "NOVO ITEM"}
        {modal === "edit" && "EDITAR ITEM"}
        {modal === "movimento" && `MOVIMENTAÇÃO - ${target?.name}`}
        {modal === "confirmDelete" && "CONFIRMAR EXCLUSÃO"}
      </p>
      <button onClick={onClose} style={{ width: 30, height: 30, background: `${VERDE}10`, border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <X size={15} strokeWidth={2.5} style={{ color: VERDE }} />
      </button>
    </div>
  );
}

function ItemForm({
  form,
  setForm,
  onSubmit,
  submitLabel,
}: {
  form: Omit<StockItem, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<StockItem, "id">>>;
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <div style={{ padding: "16px 18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="Nome do item">
        <input value={form.name} onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))} placeholder="Ex: Pão Brioche" style={inputStyle} />
      </Field>

      <Field label="Categoria">
        <input value={form.category ?? ""} onChange={(event) => setForm((f) => ({ ...f, category: event.target.value }))} placeholder="Carne, pão, bebida, embalagem..." style={inputStyle} />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Unidade">
          <select value={form.unit} onChange={(event) => setForm((f) => ({ ...f, unit: event.target.value }))} style={inputStyle}>
            {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
          </select>
        </Field>
        <NumberField label="Qtd inicial" value={form.qty} onChange={(qty) => setForm((f) => ({ ...f, qty }))} step="0.1" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <NumberField label="Custo unitário (R$)" value={form.unitCost} onChange={(unitCost) => setForm((f) => ({ ...f, unitCost }))} step="0.01" />
        <NumberField label="Mínimo viável" value={form.minQty} onChange={(minQty) => setForm((f) => ({ ...f, minQty }))} step="0.1" />
      </div>

      <NumberField label="Estoque base do mês" value={form.monthlyBaseStock ?? 0} onChange={(monthlyBaseStock) => setForm((f) => ({ ...f, monthlyBaseStock }))} step="0.1" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Data de entrada">
          <input type="date" value={form.entryDate} onChange={(event) => setForm((f) => ({ ...f, entryDate: event.target.value }))} style={inputStyle} />
        </Field>
        <Field label="Validade">
          <input type="date" value={form.expiryDate} onChange={(event) => setForm((f) => ({ ...f, expiryDate: event.target.value }))} style={inputStyle} />
        </Field>
      </div>

      {form.qty > 0 && form.unitCost > 0 && (
        <div style={{ background: `${VERDE}06`, border: `1px solid ${VERDE}15`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: VERDE, opacity: 0.6 }}>Valor em estoque</span>
          <span style={{ fontFamily: "var(--menfis-font-display)", fontSize: "1rem", color: VERDE }}>{fmtR$(form.qty * form.unitCost)}</span>
        </div>
      )}

      <SubmitButton enabled={Boolean(form.name.trim())} label={submitLabel} onClick={onSubmit} />
    </div>
  );
}

function MovementForm({
  target,
  movType,
  movQty,
  movNote,
  setMovType,
  setMovQty,
  setMovNote,
  onSubmit,
}: {
  target: StockItem;
  movType: "entrada" | "saida";
  movQty: string;
  movNote: string;
  setMovType: React.Dispatch<React.SetStateAction<"entrada" | "saida">>;
  setMovQty: React.Dispatch<React.SetStateAction<string>>;
  setMovNote: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
}) {
  const parsedQty = parseFloat(movQty.replace(",", "."));
  const enabled = movQty !== "" && !Number.isNaN(parsedQty) && parsedQty > 0;

  return (
    <div style={{ padding: "16px 18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: `${VERDE}06`, border: `1px solid ${VERDE}12`, borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between" }}>
        <StockMetric label="Estoque atual" value={fmtQty(target.qty, target.unit)} />
        <StockMetric label="Mínimo viável" value={fmtQty(target.minQty, target.unit)} alignRight />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {(["entrada", "saida"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setMovType(type)}
            style={{
              padding: "12px",
              border: `2px solid ${movType === type ? (type === "entrada" ? "#1D4ED8" : "#DC2626") : `${VERDE}15`}`,
              borderRadius: 12,
              background: movType === type ? (type === "entrada" ? "#EFF6FF" : "#FEF2F2") : "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {type === "entrada" ? <ArrowUp size={14} strokeWidth={2.5} style={{ color: "#1D4ED8" }} /> : <ArrowDown size={14} strokeWidth={2.5} style={{ color: "#DC2626" }} />}
            <span style={{ fontSize: 11, fontWeight: 900, color: type === "entrada" ? "#1D4ED8" : "#DC2626", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {type === "entrada" ? "Entrada" : "Saída"}
            </span>
          </button>
        ))}
      </div>

      <Field label={`Quantidade (${target.unit})`}>
        <input type="number" min="0" step="0.1" value={movQty} onChange={(event) => setMovQty(event.target.value)} placeholder="0" style={inputStyle} />
      </Field>

      {enabled && (
        <div style={{ background: movType === "entrada" ? "#EFF6FF" : "#FEF2F2", border: `1px solid ${movType === "entrada" ? "#BFDBFE" : "#FECACA"}`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: VERDE, opacity: 0.7 }}>Novo estoque</span>
          <span style={{ fontFamily: "var(--menfis-font-display)", fontSize: "1rem", color: movType === "entrada" ? "#1D4ED8" : "#DC2626" }}>
            {fmtQty(Math.max(0, target.qty + (movType === "entrada" ? 1 : -1) * parsedQty), target.unit)}
          </span>
        </div>
      )}

      <Field label="Observação (opcional)">
        <input value={movNote} onChange={(event) => setMovNote(event.target.value)} placeholder="Ex: Compra do fornecedor X..." style={inputStyle} />
      </Field>

      <SubmitButton enabled={enabled} label={`REGISTRAR ${movType === "entrada" ? "ENTRADA" : "SAÍDA"}`} onClick={onSubmit} color={movType === "entrada" ? "#1D4ED8" : "#DC2626"} />
    </div>
  );
}

function DeleteConfirm({ target, onDelete }: { target: StockItem; onDelete: () => void }) {
  return (
    <div style={{ padding: "20px 18px 28px", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
      <div style={{ width: 52, height: 52, background: "#FEF2F2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <AlertTriangle size={28} strokeWidth={2.5} style={{ color: "#DC2626" }} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 800, color: VERDE, textAlign: "center", lineHeight: 1.4 }}>
        Excluir <strong>{target.name}</strong>?<br />
        <span style={{ opacity: 0.55, fontWeight: 600 }}>{fmtQty(target.qty, target.unit)} em estoque · valor {fmtR$(target.qty * target.unitCost)}</span>
      </p>
      <button onClick={onDelete} style={{ width: "100%", padding: "14px", background: "#DC2626", border: "none", borderRadius: 14, color: "#fff", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Excluir item
      </button>
    </div>
  );
}

function NumberField({ label, value, onChange, step }: { label: string; value: number; onChange: (value: number) => void; step: string }) {
  return (
    <Field label={label}>
      <input type="number" min="0" step={step} value={value || ""} onChange={(event) => onChange(parseFloat(event.target.value) || 0)} placeholder="0" style={inputStyle} />
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: VERDE, opacity: 0.45 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function StockMetric({ label, value, alignRight = false }: { label: string; value: string; alignRight?: boolean }) {
  return (
    <div style={{ textAlign: alignRight ? "right" : "left" }}>
      <p style={{ fontSize: 8, color: VERDE, opacity: 0.4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <p style={{ fontFamily: "var(--menfis-font-display)", fontSize: "1.4rem", color: VERDE, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

function SubmitButton({ enabled, label, onClick, color = VERDE }: { enabled: boolean; label: string; onClick: () => void; color?: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        width: "100%",
        padding: "16px",
        background: enabled ? color : `${VERDE}30`,
        border: "none",
        borderRadius: 14,
        color: color === VERDE ? ROSA : "#fff",
        fontFamily: "var(--menfis-font-display)",
        fontSize: "1rem",
        letterSpacing: "0.12em",
        cursor: enabled ? "pointer" : "default",
      }}
    >
      {label}
    </motion.button>
  );
}
