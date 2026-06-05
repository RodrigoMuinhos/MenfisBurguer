import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  Minus,
  Plus,
  MessageSquare,
  X,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  Loader2,
  QrCode,
  CreditCard,
  Clock,
  MapPin,
  ReceiptText,
  LockKeyhole,
  ShoppingBag,
  Store,
  Bike,
  Trash2,
} from "lucide-react";
import { CartItem, Order, VERDE, ROSA } from "./types";
import logoSkull from "@/imports/image-1.png";

type DeliveryType = "retirada" | "delivery";
type PaymentMethod = "pix" | "cartao";
type CheckoutStep = "bag" | "delivery" | "payment" | "review";

const REMOVE_OPTIONS = [
  "Alface Crocante",
  "Queijo",
  "Carne",
  "Cebola Caramelizada",
  "Molho",
];

const ITEM_DESC: Record<string, string> = {
  burger:
    "Pão brioche · Burger 100g · Queijo · Alface Crocante · Cebola Caramelizada · Molho Menfi's",
  "double-burger":
    "Pão brioche · 2 burgers · Queijo · Alface Crocante · Cebola Caramelizada · Molho Menfi's",
  combo: "Menfi's Burger · Coca-Cola 350ml · Batata Frita 250g",
  "double-combo": "Double Menfi's · Coca-Cola 350ml · Batata Frita 250g",
  "combo-upgrade": "Batata frita 250g · Coca-Cola 350ml",
  "extra-queijo": "Queijo extra derretido",
  "extra-ovo": "Ovo adicional no burger",
  "extra-molho": "Porção extra do molho Menfi's",
  "extra-maionese-barbecue": "Porção extra de maionese barbecue",
  "extra-maionese-alho-frito": "Porção extra de maionese alho frito",
  batata: "Batata frita 250g",
  cola: "Coca-Cola 350ml gelada",
  "coca-zero": "Coca-Cola Zero gelada",
  "guarana-zero": "Guaraná Zero gelado",
  "agua-com-gas": "Água com gás gelada",
};

const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
const deliveryEta = "25-45 min";
const PICKUP_ADDRESS = "Rua Doutor Gilberto Studart, 728";
const SERVICE_FEE = 0.99;

/* ── Masks ────────────────────────────────────────── */
function maskPhone(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function maskCEP(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

/* ── CEP Lookup ───────────────────────────────────── */
async function lookupCEP(cep: string): Promise<{
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
} | null> {
  try {
    const res = await fetch(
      `https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`,
    );
    const data = await res.json();
    return data.erro ? null : data;
  } catch {
    return null;
  }
}

interface Props {
  cart: CartItem[];
  updateQty: (id: string, delta: number) => void;
  onPlaceOrder: (
    deliveryType: "retirada" | "delivery",
    phone?: string,
    address?: string,
    removedByItemId?: Record<string, string[]>,
    createdOrder?: Order,
  ) => void | Promise<void>;
  goToMenu: () => void;
}

const STORAGE_KEY = "menfis_cliente";
const MEMBER_KEY = "menfis_member";
const COUPON_STORAGE_KEY = "menfis_coupons";
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

type Coupon = {
  code: string;
  label: string;
  type: "percent" | "fixed_total";
  value: number;
  active: boolean;
};

const DEFAULT_COUPONS: Coupon[] = [
  {
    code: "mob10",
    label: "10% de desconto",
    type: "percent",
    value: 10,
    active: true,
  },
  {
    code: "marianazinha",
    label: "Pedido por R$ 1,00 para teste",
    type: "fixed_total",
    value: 1,
    active: true,
  },
];

function registerMemberOrder() {
  try {
    const raw = localStorage.getItem(MEMBER_KEY);
    if (!raw) return;
    const member = JSON.parse(raw);
    const counted = Number(member.orders ?? 0) + 1;
    localStorage.setItem(
      MEMBER_KEY,
      JSON.stringify({
        ...member,
        orders: counted,
        rewards: Math.floor(counted / 10),
      }),
    );
  } catch {
    // perfil local opcional
  }
}

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function loadCoupons(): Coupon[] {
  try {
    const stored = JSON.parse(localStorage.getItem(COUPON_STORAGE_KEY) ?? "[]");
    const custom = Array.isArray(stored) ? stored : [];
    const byCode = new Map<string, Coupon>();
    [...DEFAULT_COUPONS, ...custom].forEach((coupon) => {
      byCode.set(coupon.code.toLowerCase(), coupon);
    });
    return [...byCode.values()].filter((coupon) => coupon.active);
  } catch {
    return DEFAULT_COUPONS;
  }
}

function findCoupon(code: string) {
  const normalized = code.trim().toLowerCase();
  if (!normalized) return null;
  return loadCoupons().find((coupon) => coupon.code.toLowerCase() === normalized) ?? null;
}

function couponDiscount(coupon: Coupon | null, grossTotal: number) {
  if (!coupon) return 0;
  if (coupon.type === "percent") return Math.round(grossTotal * (coupon.value / 100) * 100) / 100;
  if (coupon.type === "fixed_total") return Math.max(0, Math.round((grossTotal - coupon.value) * 100) / 100);
  return 0;
}

export function CartScreen({ cart, updateQty, onPlaceOrder, goToMenu }: Props) {
  const [delivery, setDelivery] = useState<DeliveryType>("delivery");
  const [obsOpen, setObsOpen] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Record<string, Set<string>>>({});
  const [savedBadge, setSavedBadge] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("bag");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSlow, setPaymentSlow] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  /* Delivery form — pre-fill from localStorage */
  const saved = loadSaved();
  const [cep, setCep] = useState<string>(saved.cep ?? "");
  const [street, setStreet] = useState<string>(saved.street ?? "");
  const [number, setNumber] = useState<string>(saved.number ?? "");
  const [complement, setComplement] = useState<string>(saved.complement ?? "");
  const [phone, setPhone] = useState<string>(saved.phone ?? "");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState(false);

  /* Persist to localStorage whenever any field changes */
  useEffect(() => {
    setFreeShipping(Boolean(localStorage.getItem(MEMBER_KEY)));
  }, []);

  useEffect(() => {
    if (!cep && !phone) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ cep, street, number, complement, phone }),
    );
    setSavedBadge(true);
    const t = setTimeout(() => setSavedBadge(false), 2000);
    return () => clearTimeout(t);
  }, [cep, street, number, complement, phone]);

  const toggleRemove = (itemId: string, opt: string) =>
    setRemoved((prev) => {
      const s = new Set(prev[itemId] ?? []);
      s.has(opt) ? s.delete(opt) : s.add(opt);
      return { ...prev, [itemId]: s };
    });

  /* CEP auto-lookup */
  useEffect(() => {
    const nums = cep.replace(/\D/g, "");
    if (nums.length !== 8) {
      setCepError(false);
      return;
    }
    setCepLoading(true);
    setCepError(false);
    lookupCEP(nums).then((data) => {
      setCepLoading(false);
      if (data) {
        setStreet(
          `${data.logradouro}, ${data.bairro} — ${data.localidade}/${data.uf}`,
        );
        setCepError(false);
      } else {
        setCepError(true);
        setStreet("");
      }
    });
  }, [cep]);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const fee = delivery === "delivery" && !freeShipping ? 5.1 : 0;
  const serviceFee = subtotal > 0 ? SERVICE_FEE : 0;
  const grossTotal = subtotal + fee + serviceFee;
  const discount = couponDiscount(appliedCoupon, grossTotal);
  const total = Math.max(1, grossTotal - discount);

  const deliveryValid =
    phone.replace(/\D/g, "").length >= 10 &&
    (delivery === "retirada" ||
      (cep.replace(/\D/g, "").length === 8 &&
        !cepError &&
        street.length > 0 &&
        number.trim().length > 0));

  const missingDelivery = [
    delivery === "delivery" && (cep.replace(/\D/g, "").length !== 8 || cepError) ? "CEP válido" : "",
    delivery === "delivery" && !street.length ? "endereço" : "",
    delivery === "delivery" && !number.trim().length ? "número" : "",
    phone.replace(/\D/g, "").length < 10 ? "WhatsApp" : "",
  ].filter(Boolean);

  const canCreatePayment =
    deliveryValid && Boolean(payment) && checkoutStep === "review";

  const applyCoupon = () => {
    const coupon = findCoupon(couponCode);
    if (!coupon) {
      setAppliedCoupon(null);
      setCouponError("Cupom inválido ou inativo.");
      return;
    }
    setAppliedCoupon(coupon);
    setCouponCode(coupon.code);
    setCouponError("");
  };

  const handleFinalize = async () => {
    if (paying) return;

    setSubmitAttempted(true);
    setPaymentError("");

    if (checkoutStep === "bag") {
      setCheckoutStep("delivery");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (checkoutStep === "delivery") {
      if (!deliveryValid) return;
      setCheckoutStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (checkoutStep === "payment") {
      if (!payment) return;
      setCheckoutStep("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!canCreatePayment) return;

    const removedByItemId = Object.fromEntries(
      Object.entries(removed)
        .map(([itemId, opts]) => [itemId, [...opts]])
        .filter(([, opts]) => opts.length > 0),
    ) as Record<string, string[]>;

    const address =
      delivery === "retirada"
        ? `Retirada na loja - ${PICKUP_ADDRESS}`
        : `${street}, ${number}${complement ? ` ${complement}` : ""}`;

    let slowTimer: number | null = null;
    try {
      setPaying(true);
      setPaymentSlow(false);
      slowTimer = window.setTimeout(() => setPaymentSlow(true), 3500);
      const orderRes = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.qty,
          })),
          deliveryType: delivery.toUpperCase(),
          paymentMethod: payment.toUpperCase(),
          customerPhone: phone || undefined,
          customerAddress: address,
          idempotencyKey: `${phone.replace(/\D/g, "")}-${Date.now()}`,
          couponCode: appliedCoupon?.code,
          couponDiscount: appliedCoupon ? discount : 0,
        }),
      });

      const createdOrder = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok || !createdOrder?.id) {
        throw new Error(createdOrder?.error || "order_creation_failed");
      }

      const paymentRes = await fetch(`${API_URL}/payments/pix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: createdOrder.id }),
      });

      const data = await paymentRes.json().catch(() => ({}));
      if (payment === "pix" && (data?.qrCode || data?.qrCodeBase64 || data?.ticketUrl)) {
        await onPlaceOrder(delivery, phone || undefined, address, removedByItemId, {
          id: String(createdOrder.id),
          number: Number(createdOrder.number ?? String(createdOrder.id).replace(/\D/g, "")),
          items: cart.map((item) => ({ ...item })),
          removedByItemId,
          deliveryType: delivery,
          customerPhone: phone || undefined,
          customerAddress: address,
          total: Number(createdOrder.total ?? total),
          paymentProvider: "mercado_pago",
          paymentMethod: "pix",
          paymentStatus: String(data.status ?? createdOrder.paymentStatus ?? "action_required"),
          paymentId: String(data.paymentId ?? data.mercadoPagoOrderId ?? createdOrder.paymentId ?? ""),
          pixQrCode: typeof data.qrCode === "string" ? data.qrCode : undefined,
          pixQrCodeBase64: typeof data.qrCodeBase64 === "string" ? data.qrCodeBase64 : undefined,
          pixTicketUrl: typeof data.ticketUrl === "string" ? data.ticketUrl : undefined,
          timestamp: Date.now(),
          status: "aguardando_pagamento",
        });
        return;
      }

      const checkoutUrl =
        typeof data.checkoutUrl === "string" && data.checkoutUrl
          ? data.checkoutUrl
          : typeof data.sandboxCheckoutUrl === "string" &&
              data.sandboxCheckoutUrl
            ? data.sandboxCheckoutUrl
            : "";

      if (!paymentRes.ok || !checkoutUrl) {
        throw new Error(data?.error || "checkout_creation_failed");
      }

      registerMemberOrder();
      localStorage.setItem("menfis_pending_order_id", String(createdOrder.id));
      window.location.assign(checkoutUrl);
      return;
    } catch {
      setPaymentError(
        "Não foi possível iniciar o checkout Mercado Pago. Verifique os dados e tente novamente.",
      );
    } finally {
      if (slowTimer) window.clearTimeout(slowTimer);
      setPaymentSlow(false);
      setPaying(false);
    }
  };

  const handleBack = () => {
    if (checkoutStep === "review") {
      setCheckoutStep("payment");
      return;
    }
    if (checkoutStep === "payment") {
      setCheckoutStep("delivery");
      return;
    }
    if (checkoutStep === "delivery") {
      setCheckoutStep("bag");
      return;
    }
    goToMenu();
  };

  const inputStyle = (err?: boolean) => ({
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    outline: "none",
    background: "#fff",
    border: `1.5px solid ${err ? "#DC2626" : ROSA}`,
    color: VERDE,
    fontFamily: "inherit",
    fontSize: "0.82rem",
    boxSizing: "border-box" as const,
  });

  const Label = ({ children }: { children: React.ReactNode }) => (
    <p
      className="text-[10px] font-black uppercase tracking-widest mb-1.5"
      style={{ color: VERDE, opacity: 0.4 }}
    >
      {children}
    </p>
  );

  const stepLabel =
    checkoutStep === "bag"
      ? "Sacola"
      : checkoutStep === "delivery"
        ? "Dados"
        : checkoutStep === "payment"
        ? "Pagamento"
        : "Pagamento";

  const nextActionLabel =
    checkoutStep === "review" ? "Fazer pagamento" : "Continuar";

  const clearCart = () => {
    cart.forEach((item) => updateQty(item.id, -item.qty));
  };

  const SuggestedCard = ({
    name,
    price,
    description,
    image,
  }: {
    name: string;
    price: number;
    description: string;
    image: string;
  }) => (
    <button
      onClick={goToMenu}
      className="min-w-[142px] text-left rounded-2xl p-3"
      style={{
        background: "#fff",
        border: `1px solid ${VERDE}10`,
        boxShadow: "0 10px 24px rgba(101,0,31,0.06)",
      }}
    >
      <div
        className="relative mb-3 h-24 overflow-hidden rounded-2xl"
        style={{ background: `${ROSA}55` }}
      >
        <Image
          src={image}
          alt={name}
          fill
          sizes="142px"
          style={{ objectFit: "cover" }}
        />
        <span
          className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full"
          style={{
            background: "#fff",
            color: VERDE,
            boxShadow: "0 8px 18px rgba(0,0,0,0.14)",
          }}
        >
          <Plus size={20} strokeWidth={2.7} />
        </span>
      </div>
      <p className="text-sm font-black" style={{ color: VERDE }}>
        {fmt(price)}
      </p>
      <p className="mt-1 text-xs font-bold leading-snug" style={{ color: "#222" }}>
        {name}
      </p>
      <p className="mt-1 text-[10px] leading-snug" style={{ color: VERDE, opacity: 0.52 }}>
        {description}
      </p>
    </button>
  );

  /* ── Empty ── */
  if (cart.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-5 p-8 text-center"
        style={{ minHeight: 460, background: "#fff" }}
      >
        <Image
          src={logoSkull}
          alt="Mascote"
          width={80}
          height={80}
          style={{ mixBlendMode: "multiply", opacity: 0.18 }}
        />
        <div>
          <p
            className="font-black uppercase tracking-widest"
            style={{
              color: VERDE,
              fontFamily: "'Bebas Neue','Arial Black',sans-serif",
              fontSize: "1.1rem",
              letterSpacing: "0.15em",
            }}
          >
            Pedido vazio
          </p>
          <p className="text-xs mt-1" style={{ color: VERDE, opacity: 0.4 }}>
            Adicione itens do cardápio
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider"
          style={{
            background: ROSA,
            color: VERDE,
            border: "none",
            cursor: "pointer",
          }}
        >
          Ver cardápio
        </motion.button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#FFF8F2",
        fontFamily: "'Inter', system-ui, sans-serif",
        minHeight: "100%",
      }}
    >
      {/* ══ HEADER ════════════════════════════════════════ */}
      <div
        className="px-4 pt-5 pb-4 flex items-center gap-3"
        style={{
          background: VERDE,
          borderBottom: `1px solid ${ROSA}30`,
          boxShadow: "0 16px 40px rgba(31,61,46,0.18)",
        }}
      >
        <button
          onClick={goToMenu}
          className="flex items-center justify-center rounded-full"
          style={{
            width: 36,
            height: 36,
            background: ROSA,
            border: "none",
            color: VERDE,
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <div className="flex-1">
          <p
            className="font-black uppercase"
            style={{
              color: ROSA,
              fontFamily: "'Bebas Neue','Arial Black',sans-serif",
              fontSize: "1.4rem",
              letterSpacing: "0.12em",
              lineHeight: 1,
            }}
          >
            SEU PEDIDO
          </p>
          <p
            className="text-[10px] mt-0.5"
            style={{ color: ROSA, opacity: 0.68 }}
          >
            {cart.reduce((s, i) => s + i.qty, 0)}{" "}
            {cart.reduce((s, i) => s + i.qty, 0) === 1 ? "item" : "itens"}
          </p>
        </div>
        <Image
          src={logoSkull}
          alt="Menfi's"
          width={44}
          height={44}
          style={{ mixBlendMode: "screen" }}
        />
      </div>
      <div
        className="px-4 py-3"
        style={{ background: VERDE, color: ROSA }}
      >
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Sacola", active: ["bag", "delivery", "payment", "review"].includes(checkoutStep) },
            { label: "Dados", active: ["delivery", "payment", "review"].includes(checkoutStep) },
            { label: "Forma de pagamento", active: ["payment", "review"].includes(checkoutStep) },
            { label: "Fazer pagamento", active: checkoutStep === "review" },
          ].map((step, index) => (
            <div key={step.label}>
              <div
                className="h-1.5 rounded-full"
                style={{
                  background: step.active ? ROSA : `${ROSA}24`,
                }}
              />
              <p
                className="mt-1 text-[9px] font-black uppercase tracking-wider"
                style={{ opacity: step.active ? 0.9 : 0.36 }}
              >
                {index + 1}. {step.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ══ BODY ══════════════════════════════════════════ */}
      <div className="px-4 pt-5 pb-32 flex flex-col gap-5">
        <div
          className="rounded-2xl p-4"
          style={{
            background: "#fff",
            border: `1px solid ${VERDE}12`,
            boxShadow: "0 14px 36px rgba(31,61,46,0.07)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: `${ROSA}85`, color: VERDE }}
            >
              <ReceiptText size={20} strokeWidth={2.3} />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: VERDE }}
              >
                Checkout Menfi's
              </p>
              <p
                className="mt-1 text-[11px] leading-relaxed"
                style={{ color: VERDE, opacity: 0.62 }}
              >
                Etapa atual: {stepLabel}. Continue até abrir o pagamento no Mercado
                Pago.
              </p>
            </div>
          </div>
        </div>

        {checkoutStep === "bag" && (
          <div
            className="rounded-[26px] p-4"
            style={{
              background: "#fff",
              border: `1px solid ${VERDE}10`,
              boxShadow: "0 14px 36px rgba(31,61,46,0.06)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Image
                  src={logoSkull}
                  alt="Menfi's"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <p className="text-lg font-black" style={{ color: "#18181B" }}>
                    Menfi's Burger
                  </p>
                  <button
                    onClick={goToMenu}
                    className="mt-0.5 text-left text-sm font-black"
                    style={{ color: VERDE, border: 0, background: "transparent", padding: 0 }}
                  >
                    Adicionar mais itens
                  </button>
                </div>
              </div>
              <button
                onClick={clearCart}
                className="text-sm font-bold"
                style={{ color: VERDE, background: "transparent", border: 0 }}
              >
                Limpar
              </button>
            </div>
          </div>
        )}

        {checkoutStep === "delivery" && submitAttempted && missingDelivery.length > 0 && (
          <div
            className="rounded-2xl p-3 text-[11px] font-bold leading-relaxed"
            style={{ background: `${ROSA}70`, color: VERDE, border: `1px solid ${ROSA}` }}
          >
            Falta preencher: {missingDelivery.join(", ")}.
          </div>
        )}
        {/* ── Itens ── */}
        {(checkoutStep === "bag" || checkoutStep === "review") && (
        <div>
          <Label>{checkoutStep === "bag" ? "Itens adicionados" : "Revise seu pedido"}</Label>
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {cart.map((item) => {
                const itemRemoved = removed[item.id] ?? new Set();
                const isObsOpen = obsOpen === item.id;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      border: `1.5px solid ${ROSA}`,
                      background: "#fff",
                    }}
                  >
                    {/* Item info */}
                    <div className="flex items-start gap-3 px-4 pt-4 pb-2">
                      <div
                        className="relative flex items-center justify-center rounded-2xl shrink-0"
                        style={{ width: 58, height: 58, background: `${ROSA}80` }}
                      >
                        <UtensilsCrossed
                          size={22}
                          strokeWidth={2}
                          style={{ color: VERDE }}
                        />
                        <button
                          onClick={() => setObsOpen(isObsOpen ? null : item.id)}
                          className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full"
                          style={{
                            background: "#fff",
                            color: VERDE,
                            border: `1px solid ${VERDE}10`,
                            boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
                          }}
                          aria-label="Editar item"
                        >
                          <MessageSquare size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-black uppercase tracking-wide"
                          style={{ color: VERDE }}
                        >
                          {item.name}
                        </p>
                        <p
                          className="text-[10px] mt-1 leading-relaxed"
                          style={{ color: VERDE, opacity: 0.4 }}
                        >
                          {ITEM_DESC[item.id] ?? ""}
                        </p>
                        {itemRemoved.size > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {[...itemRemoved].map((opt) => (
                              <span
                                key={opt}
                                className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide"
                                style={{ background: ROSA, color: VERDE }}
                              >
                                Sem {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Qty + price */}
                    <div className="flex items-center gap-3 px-4 pb-3">
                      <div
                        className="flex items-center gap-0 rounded-xl overflow-hidden"
                        style={{ border: `1.5px solid ${ROSA}` }}
                      >
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="flex items-center justify-center"
                          style={{
                            width: 36,
                            height: 36,
                            background: ROSA,
                            border: "none",
                            color: VERDE,
                            cursor: "pointer",
                          }}
                        >
                          {item.qty === 1 ? <Trash2 size={13} strokeWidth={2.5} /> : <Minus size={13} strokeWidth={2.5} />}
                        </button>
                        <span
                          className="w-8 text-center font-black text-sm"
                          style={{ color: VERDE }}
                        >
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="flex items-center justify-center"
                          style={{
                            width: 36,
                            height: 36,
                            background: ROSA,
                            border: "none",
                            color: VERDE,
                            cursor: "pointer",
                          }}
                        >
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                      <span
                        className="flex-1 font-black text-right"
                        style={{
                          color: VERDE,
                          fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                          fontSize: "1.1rem",
                        }}
                      >
                        {fmt(item.price * item.qty)}
                      </span>
                    </div>

                    {/* Observação trigger */}
                    <button
                      onClick={() => setObsOpen(isObsOpen ? null : item.id)}
                      className="w-full flex items-center gap-2 px-4 py-2.5"
                      style={{
                        background: VERDE,
                        borderTop: `1px solid ${VERDE}`,
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                      }}
                    >
                      <MessageSquare
                        size={12}
                        strokeWidth={2}
                        style={{ color: ROSA, opacity: 0.85 }}
                      />
                      <span
                        className="text-[10px] font-black uppercase tracking-wider flex-1 text-left"
                        style={{ color: ROSA, opacity: 0.9 }}
                      >
                        {isObsOpen ? "Fechar" : "Adicionar observação"}
                      </span>
                      {itemRemoved.size > 0 && !isObsOpen && (
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full"
                          style={{ background: VERDE, color: ROSA }}
                        >
                          {itemRemoved.size} remoção
                          {itemRemoved.size > 1 ? "ões" : ""}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {isObsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div
                            className="px-4 py-3"
                            style={{ borderTop: `1px solid ${ROSA}` }}
                          >
                            <p
                              className="text-[9px] font-black uppercase tracking-widest mb-2"
                              style={{ color: VERDE, opacity: 0.4 }}
                            >
                              Quero remover:
                            </p>
                            <div className="flex flex-col">
                              {REMOVE_OPTIONS.map((opt, i) => {
                                const active = itemRemoved.has(opt);
                                return (
                                  <motion.button
                                    key={opt}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => toggleRemove(item.id, opt)}
                                    className="flex items-center gap-3 py-2.5 w-full text-left"
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      borderTop:
                                        i > 0 ? `1px solid ${ROSA}50` : "none",
                                    }}
                                  >
                                    <div
                                      className="flex items-center justify-center rounded-md shrink-0"
                                      style={{
                                        width: 20,
                                        height: 20,
                                        background: active ? ROSA : "#fff",
                                        border: `1.5px solid ${ROSA}`,
                                        transition: "all 0.15s",
                                      }}
                                    >
                                      {active && (
                                        <X
                                          size={10}
                                          strokeWidth={3}
                                          style={{ color: VERDE }}
                                        />
                                      )}
                                    </div>
                                    <span
                                      className="text-xs font-bold"
                                      style={{
                                        color: VERDE,
                                        opacity: active ? 1 : 0.55,
                                        textDecoration: active
                                          ? "line-through"
                                          : "none",
                                      }}
                                    >
                                      Sem {opt}
                                    </span>
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {checkoutStep === "bag" && (
            <button
              onClick={goToMenu}
              className="mt-5 w-full text-center text-base font-black"
              style={{ color: VERDE, background: "transparent", border: 0 }}
            >
              Adicionar mais itens
            </button>
          )}
        </div>
        )}

        {checkoutStep === "bag" && (
          <div>
            <h3 className="mb-3 text-xl font-black" style={{ color: "#1F1F1F" }}>
              Peça também
            </h3>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
              <SuggestedCard name="Coca-Cola Zero" price={8.9} description="Lata 350ml gelada" image="/EXTRAS/cocazero.jpg" />
              <SuggestedCard name="Guaraná Zero" price={8.9} description="Lata 350ml gelada" image="/EXTRAS/Gurarana.jpg" />
              <SuggestedCard name="Água com gás" price={5.9} description="Garrafa gelada" image="/EXTRAS/aguaComGas.png" />
              <SuggestedCard name="Batata frita" price={15.9} description="Porção crocante" image="/EXTRAS/batata.jpg" />
            </div>
          </div>
        )}

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
              <p className="text-[11px] mt-1" style={{ color: VERDE, opacity: 0.62 }}>
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
                {delivery === "retirada"
                  ? "Retirada na loja"
                  : freeShipping
                    ? "Frete grátis Clube Menfi's"
                    : "Taxa de entrega"}
              </span>
              <span>{delivery === "retirada" || freeShipping ? "Grátis" : fmt(fee)}</span>
            </div>
            <div
              className="flex justify-between text-xs"
              style={{ color: VERDE, opacity: 0.64 }}
            >
              <span>Taxa de serviço</span>
              <span>{fmt(serviceFee)}</span>
            </div>
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

        {/* ── Entrega ── */}
        {checkoutStep === "delivery" && (
        <div>
          <Label>Entrega</Label>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {([
              { id: "delivery", label: "Entrega", copy: `${deliveryEta} · ${freeShipping ? "grátis" : fmt(5.1)}`, Icon: Bike },
              { id: "retirada", label: "Retirada", copy: "Buscar na loja · grátis", Icon: Store },
            ] as { id: DeliveryType; label: string; copy: string; Icon: React.ElementType }[]).map(({ id, label, copy, Icon }) => {
              const active = delivery === id;
              return (
                <button
                  key={id}
                  onClick={() => setDelivery(id)}
                  className="rounded-2xl p-3 text-left"
                  style={{
                    background: active ? ROSA : "#fff",
                    border: `1.5px solid ${active ? VERDE : `${VERDE}14`}`,
                    color: VERDE,
                  }}
                >
                  <Icon size={17} strokeWidth={2.4} />
                  <p className="mt-2 text-xs font-black uppercase tracking-wide">{label}</p>
                  <p className="mt-1 text-[10px] font-semibold opacity-60">{copy}</p>
                </button>
              );
            })}
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2" style={{ color: VERDE }}>
            <div
              className="rounded-xl px-3 py-2"
              style={{ background: `${VERDE}08`, border: `1px solid ${VERDE}12` }}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                <Clock size={12} strokeWidth={2.2} />
                Prazo médio
              </div>
              <p className="text-xs font-bold mt-1">{deliveryEta}</p>
            </div>
            <div
              className="rounded-xl px-3 py-2"
              style={{ background: `${VERDE}08`, border: `1px solid ${VERDE}12` }}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                <MapPin size={12} strokeWidth={2.2} />
                {delivery === "retirada" ? "Retirada" : "Delivery"}
              </div>
              <p className="text-xs font-bold mt-1">
                {delivery === "retirada" ? "Grátis na loja" : freeShipping ? "Frete grátis" : `${fmt(fee)} de taxa`}
              </p>
            </div>
          </div>
          {delivery === "retirada" && (
            <div
              className="rounded-2xl p-4"
              style={{ background: "#fff", border: `1px solid ${VERDE}14`, color: VERDE }}
            >
              <p className="text-xs font-black uppercase tracking-wide">Endereço para retirada</p>
              <p className="mt-1 text-sm font-bold">{PICKUP_ADDRESS}</p>
              <p className="mt-1 text-[11px] opacity-60">
                Avise no WhatsApp quando chegar. Seu pedido entra na fila após confirmação do pagamento.
              </p>
            </div>
          )}
        </div>
        )}

        {/* ── Pagamento ── */}
        <AnimatePresence>
          {checkoutStep === "payment" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div>
                <Label>Como vai pagar?</Label>
                <div
                  className="mb-3 rounded-2xl p-3"
                  style={{ background: `${VERDE}08`, border: `1px solid ${VERDE}14` }}
                >
                  <div className="flex items-start gap-2">
                    <LockKeyhole size={16} strokeWidth={2.2} style={{ color: VERDE }} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide" style={{ color: VERDE }}>
                        Pagamento seguro
                      </p>
                      <p className="text-[11px] leading-relaxed mt-1" style={{ color: VERDE, opacity: 0.62 }}>
                        Você finaliza pelo Mercado Pago e acompanha a confirmação do pedido.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "pix", label: "Pix", copy: "Aprovação rápida", Icon: QrCode },
                      { id: "cartao", label: "Cartão", copy: "Crédito ou débito", Icon: CreditCard },
                    ] as {
                      id: PaymentMethod;
                      label: string;
                      copy: string;
                      Icon: React.ElementType;
                    }[]
                  ).map(({ id, label, copy, Icon }) => {
                    const active = payment === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setPayment(id)}
                        className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider"
                        style={{
                          background: active ? ROSA : "#fff",
                          color: VERDE,
                          border: `1.5px solid ${ROSA}`,
                          cursor: "pointer",
                          transition:
                            "background 0.2s, color 0.2s, border-color 0.2s",
                        }}
                      >
                        <Icon size={17} strokeWidth={2.2} />
                        {label}
                        <span
                          className="text-[9px] normal-case tracking-normal font-bold"
                          style={{ opacity: 0.58 }}
                        >
                          {copy}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            <Label>Cupom</Label>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value);
                  setCouponError("");
                }}
                placeholder="Digite seu cupom"
                style={inputStyle(Boolean(couponError))}
              />
              <button
                onClick={applyCoupon}
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
            className="rounded-2xl p-4"
            style={{ background: "#fff", border: `1.5px solid ${VERDE}20` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: ROSA, color: VERDE }}
              >
                <QrCode size={18} strokeWidth={2.4} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-wide" style={{ color: VERDE }}>
                  Tudo pronto para pagar
                </p>
                <p className="mt-1 text-[11px] leading-relaxed" style={{ color: VERDE, opacity: 0.65 }}>
                  Ao continuar, o pedido será registrado no backend e você
                  será enviado para o Mercado Pago para pagar com Pix ou cartão.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setCheckoutStep("bag")}
                className="rounded-xl px-3 py-3 text-xs font-black uppercase tracking-wide"
                style={{ background: `${VERDE}08`, color: VERDE, border: `1px solid ${VERDE}14` }}
              >
                Alterar pedido
              </button>
              <button
                onClick={() => setCheckoutStep("delivery")}
                className="rounded-xl px-3 py-3 text-xs font-black uppercase tracking-wide"
                style={{ background: `${VERDE}08`, color: VERDE, border: `1px solid ${VERDE}14` }}
              >
                Alterar entrega
              </button>
            </div>
          </div>
        )}

        {paymentSlow && (
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
            Conectando com o Mercado Pago. Seu pedido ainda não foi enviado para a cozinha.
          </motion.div>
        )}

        {/* ── Formulário delivery ── */}
        <AnimatePresence>
          {checkoutStep === "delivery" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden flex flex-col gap-4"
            >
              {/* Header do form */}
              <div className="flex items-center justify-between">
                <Label>Dados de entrega</Label>
                <AnimatePresence>
                  {savedBadge && (
                    <motion.span
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
                      style={{ background: ROSA, color: VERDE }}
                    >
                      <CheckCircle2 size={9} strokeWidth={3} /> Dados salvos
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {delivery === "delivery" && (
                <>
                  {/* CEP */}
                  <div>
                    <Label>CEP</Label>
                    <div className="relative">
                      <input
                        value={cep}
                        onChange={(e) => setCep(maskCEP(e.target.value))}
                        placeholder="00000-000"
                        style={inputStyle(cepError)}
                      />
                      {cepLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2
                            size={16}
                            strokeWidth={2}
                            style={{
                              color: VERDE,
                              opacity: 0.4,
                              animation: "spin 1s linear infinite",
                            }}
                          />
                        </div>
                      )}
                      {!cepLoading && cep.replace(/\D/g, "").length === 8 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {cepError ? (
                            <AlertCircle
                              size={16}
                              strokeWidth={2}
                              style={{ color: "#DC2626" }}
                            />
                          ) : (
                            <CheckCircle2
                              size={16}
                              strokeWidth={2}
                              style={{ color: "#16a34a" }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    {cepError && (
                      <p className="text-[10px] mt-1" style={{ color: "#DC2626" }}>
                        CEP não encontrado
                      </p>
                    )}
                  </div>

                  {/* Endereço (preenchido pelo CEP) */}
                  {street.length > 0 && (
                    <div>
                      <Label>Endereço</Label>
                      <input
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        style={inputStyle()}
                      />
                    </div>
                  )}

                  {/* Número + Complemento */}
                  {street.length > 0 && (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Label>Número</Label>
                        <input
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          placeholder="Ex: 42"
                          style={inputStyle(
                            !number && street.length > 0 ? false : undefined,
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <Label>Complemento</Label>
                        <input
                          value={complement}
                          onChange={(e) => setComplement(e.target.value)}
                          placeholder="Apto, bloco..."
                          style={inputStyle()}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* WhatsApp */}
              <div>
                <Label>WhatsApp</Label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  style={inputStyle()}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {paying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ background: "rgba(255,248,242,0.92)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ y: 12, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 12, scale: 0.98 }}
              className="w-full max-w-sm rounded-[28px] p-6 text-center"
              style={{
                background: "#fff",
                border: `1px solid ${ROSA}`,
                boxShadow: "0 24px 70px rgba(101,0,31,0.16)",
                color: VERDE,
              }}
            >
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: ROSA }}
              >
                <Loader2 size={30} strokeWidth={2.8} style={{ animation: "spin 1s linear infinite" }} />
              </div>
              <p className="text-sm font-black uppercase tracking-wide">
                Conectando ao pagamento
              </p>
              <p className="mt-2 text-xs leading-relaxed opacity-65">
                Estamos registrando seu pedido e abrindo o Mercado Pago. Se demorar, aguarde mais alguns segundos.
              </p>
              {paymentSlow && (
                <p className="mt-3 rounded-xl px-3 py-2 text-[11px] font-bold" style={{ background: `${ROSA}70` }}>
                  A conexão está mais lenta que o normal, mas ainda estamos tentando.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ CTA sticky ════════════════════════════════════ */}
      <div
        className="px-4 py-4"
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 10,
          background: "#fff",
          borderTop: `1.5px solid ${ROSA}`,
          boxShadow: "0 -8px 24px rgba(0,0,0,0.06)",
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: VERDE, opacity: 0.42 }}
            >
              Próxima etapa
            </p>
            <p className="text-xs font-bold" style={{ color: VERDE }}>
              {checkoutStep === "bag"
                ? "Ir para entrega"
                : checkoutStep === "delivery"
                  ? missingDelivery.length > 0
                  ? "Conferir dados de entrega"
                  : "Escolher pagamento"
                : checkoutStep === "payment"
                  ? "Conferir antes de pagar"
                  : "Fazer pagamento"}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: VERDE, opacity: 0.42 }}
            >
              Total
            </p>
            <p
              className="font-black"
              style={{
                color: VERDE,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "1.45rem",
                lineHeight: 1,
              }}
            >
              {fmt(total)}
            </p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleFinalize}
          disabled={paying}
          className="w-full py-4 rounded-2xl font-black uppercase tracking-widest disabled:opacity-55"
          style={{
            background: ROSA,
            color: VERDE,
            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
            fontSize: "1.1rem",
            letterSpacing: "0.2em",
            border: "none",
            cursor: paying ? "default" : "pointer",
          }}
        >
          <span className="inline-flex items-center justify-center gap-2">
            {paying && (
              <Loader2
                size={18}
                strokeWidth={2.6}
                style={{ animation: "spin 1s linear infinite" }}
              />
            )}
            {paying
              ? "INICIANDO PAGAMENTO"
              : nextActionLabel}{" "}
            - {fmt(total)}
          </span>
        </motion.button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
