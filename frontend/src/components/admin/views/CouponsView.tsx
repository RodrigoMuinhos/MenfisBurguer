import { Check, Pencil, Power, TicketPercent, Trash2, X } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import { Coupon, DEFAULT_COUPONS } from "../shared";
export function CouponsView({
  coupons,
  couponCode,
  couponValue,
  couponType,
  couponMaxUsesPerDay,
  couponMaxUsesTotal,
  couponStartsAt,
  couponEndsAt,
  couponProductIds,
  couponOncePerCustomer,
  couponBlockSamePhone,
  editingCouponCode,
  setCouponCode,
  setCouponValue,
  setCouponType,
  setCouponMaxUsesPerDay,
  setCouponMaxUsesTotal,
  setCouponStartsAt,
  setCouponEndsAt,
  setCouponProductIds,
  setCouponOncePerCustomer,
  setCouponBlockSamePhone,
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
  couponMaxUsesPerDay: string;
  couponMaxUsesTotal: string;
  couponStartsAt: string;
  couponEndsAt: string;
  couponProductIds: string;
  couponOncePerCustomer: boolean;
  couponBlockSamePhone: boolean;
  editingCouponCode: string;
  setCouponCode: (value: string) => void;
  setCouponValue: (value: string) => void;
  setCouponType: (value: "percent" | "fixed_total") => void;
  setCouponMaxUsesPerDay: (value: string) => void;
  setCouponMaxUsesTotal: (value: string) => void;
  setCouponStartsAt: (value: string) => void;
  setCouponEndsAt: (value: string) => void;
  setCouponProductIds: (value: string) => void;
  setCouponOncePerCustomer: (value: boolean) => void;
  setCouponBlockSamePhone: (value: boolean) => void;
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
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={couponMaxUsesPerDay}
            onChange={(event) => setCouponMaxUsesPerDay(event.target.value.replace(/\D/g, ""))}
            placeholder="Usos max. por dia"
            className="rounded-xl px-3 py-3 text-sm outline-none"
            style={{ border: `1.5px solid ${VERDE}14`, color: VERDE }}
          />
          <input
            value={couponMaxUsesTotal}
            onChange={(event) => setCouponMaxUsesTotal(event.target.value.replace(/\D/g, ""))}
            placeholder="Usos max. total"
            className="rounded-xl px-3 py-3 text-sm outline-none"
            style={{ border: `1.5px solid ${VERDE}14`, color: VERDE }}
          />
          <input
            type="date"
            value={couponStartsAt}
            onChange={(event) => setCouponStartsAt(event.target.value)}
            className="rounded-xl px-3 py-3 text-sm outline-none"
            style={{ border: `1.5px solid ${VERDE}14`, color: VERDE }}
          />
          <input
            type="date"
            value={couponEndsAt}
            onChange={(event) => setCouponEndsAt(event.target.value)}
            className="rounded-xl px-3 py-3 text-sm outline-none"
            style={{ border: `1.5px solid ${VERDE}14`, color: VERDE }}
          />
        </div>
        <input
          value={couponProductIds}
          onChange={(event) => setCouponProductIds(event.target.value)}
          placeholder="Produtos participantes: burger, combo2, coca-zero"
          className="mt-2 w-full rounded-xl px-3 py-3 text-sm outline-none"
          style={{ border: `1.5px solid ${VERDE}14`, color: VERDE }}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <label
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black uppercase"
            style={{ border: `1px solid ${VERDE}14`, color: VERDE }}
          >
            <input
              type="checkbox"
              checked={couponOncePerCustomer}
              onChange={(event) => setCouponOncePerCustomer(event.target.checked)}
            />
            Uma vez por cliente
          </label>
          <label
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black uppercase"
            style={{ border: `1px solid ${VERDE}14`, color: VERDE }}
          >
            <input
              type="checkbox"
              checked={couponBlockSamePhone}
              onChange={(event) => setCouponBlockSamePhone(event.target.checked)}
            />
            Bloquear mesmo telefone
          </label>
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
                  <p className="mt-1 text-[11px] font-bold" style={{ color: VERDE, opacity: 0.62 }}>
                    {[
                      coupon.oncePerCustomer ? "1x por cliente" : "",
                      coupon.blockSamePhone ? "bloqueia telefone repetido" : "",
                      coupon.maxUsesPerDay ? `${coupon.maxUsesPerDay}/dia` : "",
                      coupon.maxUsesTotal ? `${coupon.maxUsesTotal} total` : "",
                      coupon.startsAt ? `inicio ${coupon.startsAt}` : "",
                      coupon.endsAt ? `fim ${coupon.endsAt}` : "",
                      coupon.productIds?.length ? `produtos: ${coupon.productIds.join(", ")}` : "",
                    ].filter(Boolean).join(" · ") || "Sem limites adicionais"}
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

