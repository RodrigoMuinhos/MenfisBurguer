import { Check, Pencil, Power, TicketPercent, Trash2, X } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import { Coupon, DEFAULT_COUPONS, couponLabel, fmt } from "../shared";
export function CouponsView({
  coupons,
  couponCode,
  couponValue,
  couponType,
  editingCouponCode,
  setCouponCode,
  setCouponValue,
  setCouponType,
  onSave,
  onCancelEdit,
  onEdit,
  onToggle,
  onDelete,
}: {
  coupons: Coupon[];
  couponCode: string;
  couponValue: string;
  couponType: "percent" | "fixed_total";
  editingCouponCode: string;
  setCouponCode: (value: string) => void;
  setCouponValue: (value: string) => void;
  setCouponType: (value: "percent" | "fixed_total") => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onEdit: (coupon: Coupon) => void;
  onToggle: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
}) {
  const editing = Boolean(editingCouponCode);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-2xl p-4"
        style={{ background: "#fff", border: `1.5px solid ${VERDE}10` }}
      >
        <p
          className="text-xs font-black uppercase tracking-wider"
          style={{ color: VERDE }}
        >
          {editing ? `Editando ${editingCouponCode}` : "Novo cupom"}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px_140px_auto]">
          <input
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            placeholder="Código do cupom"
            disabled={editing}
            className="rounded-xl px-3 py-3 text-sm outline-none"
            style={{
              border: `1.5px solid ${VERDE}14`,
              color: VERDE,
              opacity: editing ? 0.62 : 1,
            }}
          />
          <input
            value={couponValue}
            onChange={(event) => setCouponValue(event.target.value)}
            placeholder="Valor"
            className="rounded-xl px-3 py-3 text-sm outline-none"
            style={{ border: `1.5px solid ${VERDE}14`, color: VERDE }}
          />
          <select
            value={couponType}
            onChange={(event) =>
              setCouponType(event.target.value as "percent" | "fixed_total")
            }
            className="rounded-xl px-3 py-3 text-sm outline-none"
            style={{
              border: `1.5px solid ${VERDE}14`,
              color: VERDE,
              background: "#fff",
            }}
          >
            <option value="percent">% desconto</option>
            <option value="fixed_total">total fixo</option>
          </select>
          <button
            onClick={onSave}
            className="rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider"
            style={{ background: VERDE, color: ROSA }}
          >
            {editing ? "Salvar" : "Inserir"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-[11px]" style={{ color: VERDE, opacity: 0.55 }}>
            Cupons desativados não aparecem no checkout.
          </p>
          {editing && (
            <button
              onClick={onCancelEdit}
              className="text-[10px] font-black uppercase tracking-wider"
              style={{ color: VERDE }}
            >
              Cancelar edição
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {coupons.map((coupon) => {
          const isDefault = DEFAULT_COUPONS.some(
            (item) => item.code.toLowerCase() === coupon.code.toLowerCase(),
          );
          const active = coupon.active !== false;
          return (
            <div
              key={coupon.code}
              className="rounded-2xl p-4"
              style={{
                background: active ? "#fff" : "#F8F4F5",
                border: `1.5px solid ${active ? ROSA : `${VERDE}18`}`,
                opacity: active ? 1 : 0.78,
              }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: ROSA, color: VERDE }}
                >
                  <TicketPercent size={18} strokeWidth={2.4} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black" style={{ color: VERDE }}>
                    {coupon.code}
                  </p>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: VERDE, opacity: 0.58 }}
                  >
                    {coupon.label}
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider"
                  style={{
                    background: active ? "#ECFDF5" : "#E5E7EB",
                    color: active ? "#065F46" : "#4B5563",
                  }}
                >
                  {active ? "Ativo" : "Desligado"}
                </span>
                {isDefault && (
                  <span
                    className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider"
                    style={{ background: `${VERDE}08`, color: VERDE }}
                  >
                    Padrão
                  </span>
                )}
                <div className="ml-auto flex flex-wrap gap-2">
                  <button
                    onClick={() => onEdit(coupon)}
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider"
                    style={{
                      background: `${VERDE}08`,
                      color: VERDE,
                      border: `1px solid ${VERDE}14`,
                    }}
                  >
                    <Pencil size={13} strokeWidth={2.4} />
                    Editar
                  </button>
                  <button
                    onClick={() => onToggle(coupon)}
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider"
                    style={{
                      background: active ? "#FEF3C7" : "#ECFDF5",
                      color: active ? "#92400E" : "#065F46",
                      border: `1px solid ${active ? "#FDE68A" : "#6EE7B7"}`,
                    }}
                  >
                    <Power size={13} strokeWidth={2.4} />
                    {active ? "Desligar" : "Ativar"}
                  </button>
                  <button
                    onClick={() => onDelete(coupon)}
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider"
                    style={{
                      background: "#FEE2E2",
                      color: "#991B1B",
                      border: "1px solid #FCA5A5",
                    }}
                  >
                    <Trash2 size={13} strokeWidth={2.4} />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

