import { CartItem } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import {
  CheckoutStep,
  Coupon,
  DeliveryType,
  ITEM_DESC,
  deliveryEta,
  fmt,
} from "./checkout";

export function OrderSummarySection({
  checkoutStep,
  cart,
  delivery,
  fee,
  serviceFee,
  subtotal,
  appliedCoupon,
  discount,
  total,
}: {
  checkoutStep: CheckoutStep;
  cart: CartItem[];
  delivery: DeliveryType;
  fee: number;
  serviceFee: number;
  subtotal: number;
  appliedCoupon: Coupon | null;
  discount: number;
  total: number;
}) {
  return (
    <>
      
              {/* ── Resumo do pedido ── */}
              {(checkoutStep === "bag" || checkoutStep === "review") && (
                <div
                  className="rounded-2xl p-4"
                  style={{ background: `${ROSA}25`, border: `1.5px solid ${ROSA}` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p
                        className="text-[10px] font-black uppercase tracking-widest"
                        style={{ color: VERDE, opacity: 0.4 }}
                      >
                        Resumo do pedido
                      </p>
                      <p
                        className="text-[11px] mt-1"
                        style={{ color: VERDE, opacity: 0.62 }}
                      >
                        Revise os itens antes de seguir para o pagamento.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="text-[9px] font-black uppercase tracking-widest"
                        style={{ color: VERDE, opacity: 0.42 }}
                      >
                        Prazo
                      </p>
                      <p
                        className="font-black uppercase"
                        style={{
                          color: VERDE,
                          fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                          fontSize: "1.05rem",
                          lineHeight: 1,
                        }}
                      >
                        {deliveryEta}
                      </p>
                    </div>
                  </div>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="mb-2 pb-2"
                      style={{ borderBottom: `1px solid ${ROSA}` }}
                    >
                      <div className="flex justify-between items-start">
                        <p
                          className="text-xs font-black uppercase"
                          style={{ color: VERDE }}
                        >
                          {item.qty}× {item.name}
                        </p>
                        <p
                          className="text-xs font-black ml-2 shrink-0"
                          style={{
                            color: VERDE,
                            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                            fontSize: "0.95rem",
                          }}
                        >
                          {fmt(item.price * item.qty)}
                        </p>
                      </div>
                      <p
                        className="text-[10px] mt-0.5 leading-relaxed"
                        style={{ color: VERDE, opacity: 0.4 }}
                      >
                        {ITEM_DESC[item.id] ?? ""}
                      </p>
                    </div>
                  ))}
                  <div className="mt-3 space-y-2">
                    <div
                      className="flex justify-between text-xs"
                      style={{ color: VERDE, opacity: 0.64 }}
                    >
                      <span>Subtotal dos itens</span>
                      <span>{fmt(subtotal)}</span>
                    </div>
                    <div
                      className="flex justify-between text-xs"
                      style={{ color: VERDE, opacity: 0.64 }}
                    >
                      <span>
                        Taxa de entrega
                      </span>
                      <span>
                        {delivery === "retirada" ? "Sem frete" : fmt(fee)}
                      </span>
                    </div>
                    {serviceFee > 0 && (
                      <div
                        className="flex justify-between text-xs"
                        style={{ color: VERDE, opacity: 0.64 }}
                      >
                        <span>Taxa de serviço</span>
                        <span>{fmt(serviceFee)}</span>
                      </div>
                    )}
                  </div>
                  {appliedCoupon && discount > 0 && (
                    <div
                      className="flex justify-between text-xs py-2 font-bold"
                      style={{ color: VERDE }}
                    >
                      <span>Desconto {appliedCoupon.code}</span>
                      <span>- {fmt(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 mt-1">
                    <span
                      className="font-black uppercase tracking-wider text-sm"
                      style={{ color: VERDE }}
                    >
                      Total
                    </span>
                    <span
                      className="font-black"
                      style={{
                        color: VERDE,
                        fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                        fontSize: "1.6rem",
                      }}
                    >
                      {fmt(total)}
                    </span>
                  </div>
                </div>
              )}
    </>
  );
}
