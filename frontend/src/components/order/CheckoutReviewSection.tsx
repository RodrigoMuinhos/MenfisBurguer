import { Loader2, MessageCircle, QrCode } from "lucide-react";
import { motion } from "motion/react";
import { CartItem } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import {
  CheckoutStep,
  Coupon,
  KioskKeyboardTarget,
  PaymentMethod,
  DELIVERY_FEE,
  SUPPORT_WHATSAPP_URL,
  fmt,
} from "./checkout";
import { buildWhatsappReceipt } from "./whatsappReceipt";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-2 text-[10px] font-black uppercase tracking-widest"
      style={{ color: VERDE, opacity: 0.55 }}
    >
      {children}
    </p>
  );
}

export function CheckoutReviewSection({
  checkoutStep,
  kioskMode,
  counterServiceMode = false,
  payment,
  paymentError,
  paymentSlow,
  couponCode,
  setCouponCode,
  couponError,
  setCouponError,
  appliedCoupon,
  setAppliedCoupon,
  applyCoupon,
  inputStyle,
  setCheckoutStep,
  setKioskKeyboardTarget,
  cart,
  subtotal,
  fee,
  serviceFee,
  discount,
  total,
}: {
  checkoutStep: CheckoutStep;
  kioskMode: boolean;
  counterServiceMode?: boolean;
  payment: PaymentMethod;
  paymentError: string;
  paymentSlow: boolean;
  couponCode: string;
  setCouponCode: (value: string) => void;
  couponError: string;
  setCouponError: (value: string) => void;
  appliedCoupon: Coupon | null;
  setAppliedCoupon: (coupon: Coupon | null) => void;
  applyCoupon: () => void | Promise<void>;
  inputStyle: (err?: boolean) => React.CSSProperties;
  setCheckoutStep: (step: CheckoutStep) => void;
  setKioskKeyboardTarget: (target: KioskKeyboardTarget) => void;
  cart: CartItem[];
  subtotal: number;
  fee: number;
  serviceFee: number;
  discount: number;
  total: number;
}) {
  const counterFlow = kioskMode || counterServiceMode;
  const supportText = encodeURIComponent(
    buildWhatsappReceipt({
      items: cart,
      subtotal,
      deliveryFee: fee,
      serviceFee,
      discount,
      total,
      paymentMethod: payment,
    }),
  );

  return (
    <>
      {paymentError && (
        <div
          className="rounded-xl px-3 py-2 text-[11px] font-semibold"
          style={{ background: `${ROSA}80`, color: VERDE }}
        >
          {paymentError}
        </div>
      )}

      {(checkoutStep === "bag" || checkoutStep === "review") && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "#fff", border: `1.5px solid ${ROSA}` }}
        >
          <SectionLabel>Cupom</SectionLabel>
          <div className="flex gap-2">
            <input
              value={couponCode}
              onFocus={() => {
                if (kioskMode) setKioskKeyboardTarget("coupon");
              }}
              onClick={() => {
                if (kioskMode) setKioskKeyboardTarget("coupon");
              }}
              onChange={(event) => {
                setCouponCode(event.target.value);
                setCouponError("");
              }}
              placeholder="Digite seu cupom"
              inputMode={kioskMode ? "none" : "text"}
              autoComplete="off"
              style={inputStyle(Boolean(couponError))}
            />
            <button
              onClick={() => void applyCoupon()}
              className="rounded-xl px-4 text-xs font-black uppercase tracking-wider"
              style={{ background: VERDE, color: ROSA }}
            >
              Aplicar
            </button>
          </div>
          {couponError && (
            <p className="mt-2 text-[11px] font-bold" style={{ color: "#B91C1C" }}>
              {couponError}
            </p>
          )}
          {appliedCoupon && (
            <div
              className="mt-3 flex items-center justify-between rounded-xl px-3 py-2"
              style={{ background: `${ROSA}45`, color: VERDE }}
            >
              <div>
                <p className="text-xs font-black uppercase tracking-wide">
                  {appliedCoupon.code}
                </p>
                <p className="text-[11px] opacity-65">{appliedCoupon.label}</p>
              </div>
              <button
                onClick={() => {
                  setAppliedCoupon(null);
                  setCouponCode("");
                  setCouponError("");
                }}
                className="text-[10px] font-black uppercase tracking-wider"
                style={{ color: VERDE }}
              >
                Remover
              </button>
            </div>
          )}
        </div>
      )}

      {checkoutStep === "review" && (
        <div
          className={`rounded-2xl p-5 ${counterFlow ? "" : "mx-auto max-w-3xl"}`}
          style={{ background: "#fff", border: `1.5px solid ${VERDE}20` }}
        >
          <div
            className={`flex items-start gap-3 ${counterFlow ? "" : "justify-center text-center"}`}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: ROSA, color: VERDE }}
            >
              <QrCode size={18} strokeWidth={2.4} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-wide" style={{ color: VERDE }}>
                {counterFlow ? "Envio direto para cozinha" : "Tudo pronto para pagar"}
              </p>
              <p
                className="mt-1 text-[11px] leading-relaxed"
                style={{ color: VERDE, opacity: 0.65 }}
              >
                {counterFlow
                  ? "Ao confirmar, o pedido será enviado para a cozinha e o pagamento será feito no balcão."
                  : payment === "pagar_na_entrega"
                    ? "Ao continuar, o pedido será enviado para a cozinha e o pagamento será feito no recebimento."
                    : payment === "whatsapp"
                      ? "Ao continuar, o pedido será enviado ao atendimento. A equipe chamará no WhatsApp, receberá o pagamento e liberará para a cozinha."
                      : "Ao continuar, o pedido será registrado no backend e você será enviado para o Mercado Pago para pagar com Pix ou cartão."}
              </p>
            </div>
          </div>
          {!counterFlow && (
            <div
              className="mt-4 rounded-2xl px-4 py-3 text-left"
              style={{ background: `${ROSA}22`, color: VERDE }}
            >
              <div className="flex justify-between gap-3 text-[11px] font-bold">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="mt-1 flex justify-between gap-3 text-[11px] font-bold">
                <span>Frete delivery</span>
                <span>{fee > 0 ? fmt(fee) : `Grátis (taxa ${fmt(DELIVERY_FEE)})`}</span>
              </div>
              {serviceFee > 0 && (
                <div className="mt-1 flex justify-between gap-3 text-[11px] font-bold">
                  <span>Taxa de serviço</span>
                  <span>{fmt(serviceFee)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="mt-1 flex justify-between gap-3 text-[11px] font-bold">
                  <span>Desconto aplicado</span>
                  <span>- {fmt(discount)}</span>
                </div>
              )}
              <div
                className="mt-2 flex justify-between gap-3 border-t pt-2 text-sm font-black uppercase"
                style={{ borderColor: ROSA }}
              >
                <span>Total final</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
          )}
          <div className={`mt-4 grid gap-2 ${counterFlow ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            <button
              onClick={() => setCheckoutStep("bag")}
              className="rounded-xl px-3 py-3 text-xs font-black uppercase tracking-wide"
              style={{
                background: `${VERDE}08`,
                color: VERDE,
                border: `1px solid ${VERDE}14`,
              }}
            >
              Alterar pedido
            </button>
            {counterFlow ? (
              <button
                onClick={() => setCheckoutStep(kioskMode ? "customer" : "payment")}
                className="rounded-xl px-3 py-3 text-xs font-black uppercase tracking-wide"
                style={{
                  background: `${VERDE}08`,
                  color: VERDE,
                  border: `1px solid ${VERDE}14`,
                }}
              >
                Alterar pagamento
              </button>
            ) : (
              <button
                onClick={() => setCheckoutStep("delivery")}
                className="rounded-xl px-3 py-3 text-xs font-black uppercase tracking-wide"
                style={{
                  background: `${VERDE}08`,
                  color: VERDE,
                  border: `1px solid ${VERDE}14`,
                }}
              >
                Alterar entrega
              </button>
            )}
            {!counterFlow && (
              <a
                href={`${SUPPORT_WHATSAPP_URL}?text=${supportText}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-black uppercase tracking-wide"
                style={{
                  background: "#fff",
                  color: VERDE,
                  border: `1px solid ${VERDE}24`,
                }}
              >
                <MessageCircle size={15} strokeWidth={2.4} />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      {paymentSlow && !counterFlow && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold"
          style={{ background: `${ROSA}80`, color: VERDE }}
        >
          <Loader2
            size={15}
            strokeWidth={2.4}
            style={{ animation: "spin 1s linear infinite" }}
          />
          Conectando com o Mercado Pago. Seu pedido ainda não foi enviado para a
          cozinha.
        </motion.div>
      )}
    </>
  );
}
