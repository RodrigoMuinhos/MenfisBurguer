import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  Minus,
  Plus,
  MessageSquare,
  X,
  Bike,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  Loader2,
  QrCode,
  CreditCard,
  ShieldCheck,
  Clock,
  MapPin,
  ReceiptText,
  LockKeyhole,
} from "lucide-react";
import { CartItem, VERDE, ROSA } from "./types";
import logoSkull from "@/imports/image-1.png";

type DeliveryType = "retirada" | "delivery";
type PaymentMethod = "pix" | "cartao";

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
  batata: "Batata frita 250g",
  cola: "Coca-Cola 350ml gelada",
};

const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
const deliveryEta = "25-45 min";

const LGPD_COPY =
  "Usamos CPF, telefone e endereço somente para identificar o pedido, emitir registros fiscais quando necessário, entregar corretamente e tratar suporte. O pagamento é processado pelo Mercado Pago.";

/* ── Masks ────────────────────────────────────────── */
function maskCPF(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function hideCPF(v: string) {
  const n = v.replace(/\D/g, "");
  if (n.length !== 11) return maskCPF(v);
  return `${n.slice(0, 3)}.***.***-${n.slice(9)}`;
}

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

/* ── CPF Validator ────────────────────────────────── */
function validateCPF(raw: string): boolean {
  const n = raw.replace(/\D/g, "");
  if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false;
  const calc = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += parseInt(n[i]) * (len + 1 - i);
    const r = (s * 10) % 11;
    return r >= 10 ? 0 : r;
  };
  return calc(9) === parseInt(n[9]) && calc(10) === parseInt(n[10]);
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
  ) => void | Promise<void>;
  goToMenu: () => void;
}

const STORAGE_KEY = "menfis_cliente";
const MEMBER_KEY = "menfis_member";
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

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

export function CartScreen({ cart, updateQty, onPlaceOrder, goToMenu }: Props) {
  const delivery: DeliveryType = "delivery";
  const [obsOpen, setObsOpen] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Record<string, Set<string>>>({});
  const [savedBadge, setSavedBadge] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSlow, setPaymentSlow] = useState(false);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);

  /* Delivery form — pre-fill from localStorage */
  const saved = loadSaved();
  const [cep, setCep] = useState<string>(saved.cep ?? "");
  const [street, setStreet] = useState<string>(saved.street ?? "");
  const [number, setNumber] = useState<string>(saved.number ?? "");
  const [complement, setComplement] = useState<string>(saved.complement ?? "");
  const [cpfRaw, setCpfRaw] = useState<string>(saved.cpfRaw ?? saved.cpf ?? "");
  const [cpf, setCpf] = useState<string>(
    saved.cpfRaw || saved.cpf ? hideCPF(saved.cpfRaw ?? saved.cpf) : "",
  );
  const [phone, setPhone] = useState<string>(saved.phone ?? "");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState(false);
  const [cpfValid, setCpfValid] = useState<boolean | null>(
    saved.cpf ? (validateCPF(saved.cpf) ? true : null) : null,
  );

  /* Persist to localStorage whenever any field changes */
  useEffect(() => {
    setFreeShipping(Boolean(localStorage.getItem(MEMBER_KEY)));
  }, []);

  useEffect(() => {
    if (!cep && !cpf && !phone) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ cep, street, number, complement, cpfRaw, phone }),
    );
    setSavedBadge(true);
    const t = setTimeout(() => setSavedBadge(false), 2000);
    return () => clearTimeout(t);
  }, [cep, street, number, complement, cpfRaw, phone]);

  useEffect(() => {
    const cpfDigits = cpfRaw.replace(/\D/g, "");
    const phoneDigits = phone.replace(/\D/g, "");
    if (cpfDigits.length !== 11 || phoneDigits.length < 10) return;
    if (!validateCPF(cpfDigits)) return;

    const controller = new AbortController();
    const t = setTimeout(() => {
      fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpf: cpfDigits,
          phone,
          cep,
          street,
          number,
          complement,
        }),
        signal: controller.signal,
      }).catch(() => undefined);
    }, 700);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [cep, street, number, complement, cpfRaw, phone]);

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

  /* CPF live validation */
  const handleCPF = (v: string) => {
    const masked = maskCPF(v);
    setCpfRaw(masked);
    setCpf(masked);
    if (masked.replace(/\D/g, "").length === 11)
      setCpfValid(validateCPF(masked));
    else setCpfValid(null);
  };

  const handleCpfFocus = () => {
    setCpf(maskCPF(cpfRaw));
  };

  const handleCpfBlur = () => {
    if (cpfRaw.replace(/\D/g, "").length === 11 && cpfValid) {
      setCpf(hideCPF(cpfRaw));
    }
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const fee = freeShipping ? 0 : 5.1;
  const total = subtotal + fee;

  const deliveryValid =
    cep.replace(/\D/g, "").length === 8 &&
    !cepError &&
    street.length > 0 &&
    number.trim().length > 0 &&
    cpfRaw.replace(/\D/g, "").length === 11 &&
    cpfValid === true &&
    phone.replace(/\D/g, "").length >= 10;

  const handleFinalize = async () => {
    if (!deliveryValid) return;
    if (paying) return;

    if (!paymentOpen) {
      setPaymentOpen(true);
      return;
    }
    if (!payment) return;

    setPaymentError("");

    const removedByItemId = Object.fromEntries(
      Object.entries(removed)
        .map(([itemId, opts]) => [itemId, [...opts]])
        .filter(([, opts]) => opts.length > 0),
    ) as Record<string, string[]>;

    const address = `${street}, ${number}${complement ? ` ${complement}` : ""}`;

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
          cpf: cpfRaw.replace(/\D/g, ""),
          idempotencyKey: `${cpfRaw.replace(/\D/g, "")}-${Date.now()}`,
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

  const canSubmit =
    deliveryValid && lgpdAccepted && (!paymentOpen || Boolean(payment));

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
          onClick={goToMenu}
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
            { label: "Conferir", active: true },
            { label: "Entrega", active: deliveryValid },
            { label: "Pagamento", active: paymentOpen && Boolean(payment) },
            { label: "Cozinha", active: false },
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
                Revise itens, confirme seus dados de entrega e escolha a forma
                de pagamento.
              </p>
            </div>
          </div>
        </div>
        {/* ── Itens ── */}
        <div>
          <Label>Itens do pedido</Label>
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
                        className="flex items-center justify-center rounded-xl shrink-0"
                        style={{ width: 40, height: 40, background: ROSA }}
                      >
                        <UtensilsCrossed
                          size={18}
                          strokeWidth={2}
                          style={{ color: VERDE }}
                        />
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
                          <Minus size={13} strokeWidth={2.5} />
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
        </div>

        {/* ── Resumo do pedido ── */}
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
                Conferência final antes de enviar para a cozinha.
              </p>
            </div>
            <span
              className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider"
              style={{ background: VERDE, color: ROSA }}
            >
              {deliveryEta}
            </span>
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
          <div
            className="flex justify-between text-xs py-1"
            style={{ color: VERDE, opacity: 0.5 }}
          >
            <span>{freeShipping ? "Frete grátis Clube Menfi's" : "Taxa de entrega"}</span>
            <span>{fmt(fee)}</span>
          </div>
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

        {/* ── Entrega ── */}
        <div>
          <Label>Entrega</Label>
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
                Delivery
              </div>
              <p className="text-xs font-bold mt-1">
                {freeShipping ? "Frete grátis" : `${fmt(fee)} de taxa`}
              </p>
            </div>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{
              background: "#fff",
              border: `1.5px solid ${ROSA}`,
              color: VERDE,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: ROSA }}
              >
                <Bike size={18} strokeWidth={2.4} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-wider">
                  Somente delivery
                </p>
                <p className="mt-1 text-[11px] leading-relaxed opacity-65">
                  Taxa de R$ 5,10 e prazo médio de 25-45 min, sujeito à
                  distância e fila da cozinha.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["Conferimos", "Cozinha", "Saiu para entrega"].map((step, index) => (
                <div key={step}>
                  <div className="flex items-center">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black"
                      style={{ background: index === 0 ? VERDE : ROSA, color: index === 0 ? ROSA : VERDE }}
                    >
                      {index + 1}
                    </span>
                    {index < 2 && (
                      <span
                        className="h-1 flex-1 rounded-full"
                        style={{ background: ROSA }}
                      />
                    )}
                  </div>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-wider opacity-55">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Pagamento ── */}
        <AnimatePresence>
          {paymentOpen && (
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

        <div
          className="rounded-2xl p-4"
          style={{ background: "#fff", border: `1.5px solid ${VERDE}18` }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ width: 36, height: 36, background: `${VERDE}10` }}
            >
              <ReceiptText size={17} strokeWidth={2.1} style={{ color: VERDE }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black uppercase tracking-wide" style={{ color: VERDE }}>
                Informações do atendimento
              </p>
              <div className="mt-2 grid gap-1.5 text-[11px] leading-relaxed" style={{ color: VERDE, opacity: 0.68 }}>
                <p>
                  Delivery:{" "}
                  {freeShipping
                    ? "frete grátis aplicado pelo Clube Menfi's"
                    : `taxa de ${fmt(fee || 5.1)}`}{" "}
                  e prazo médio de {deliveryEta}, sujeito à distância e fila da cozinha.
                </p>
                <p>Conferimos itens, remoções e dados antes de enviar o pedido para produção.</p>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLgpdAccepted((v) => !v)}
          className="w-full rounded-2xl p-4 text-left"
          style={{
            background: lgpdAccepted ? `${ROSA}55` : "#fff",
            border: `1.5px solid ${lgpdAccepted ? ROSA : `${VERDE}18`}`,
            cursor: "pointer",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center rounded-lg shrink-0"
              style={{
                width: 24,
                height: 24,
                marginTop: 1,
                background: lgpdAccepted ? VERDE : "#fff",
                border: `1.5px solid ${lgpdAccepted ? VERDE : `${VERDE}28`}`,
              }}
            >
              {lgpdAccepted && (
                <CheckCircle2 size={14} strokeWidth={2.8} style={{ color: ROSA }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} strokeWidth={2.2} style={{ color: VERDE }} />
                <p className="text-xs font-black uppercase tracking-wide" style={{ color: VERDE }}>
                  LGPD e dados do pedido
                </p>
              </div>
              <p className="text-[11px] leading-relaxed mt-1.5" style={{ color: VERDE, opacity: 0.65 }}>
                {LGPD_COPY}
              </p>
              <p className="text-[10px] font-black uppercase tracking-wider mt-2" style={{ color: VERDE, opacity: lgpdAccepted ? 0.7 : 0.45 }}>
                {lgpdAccepted ? "Consentimento confirmado" : "Toque para confirmar antes de pagar"}
              </p>
            </div>
          </div>
        </button>

        {/* ── Formulário delivery ── */}
        <AnimatePresence>
          {delivery === "delivery" && (
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
                  {!savedBadge && saved.cpf && (
                    <span
                      className="text-[9px]"
                      style={{ color: VERDE, opacity: 0.4 }}
                    >
                      Dados carregados automaticamente
                    </span>
                  )}
                </AnimatePresence>
              </div>

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

              {/* CPF */}
              <div>
                <Label>CPF</Label>
                <div className="relative">
                  <input
                    value={cpf}
                    onChange={(e) => handleCPF(e.target.value)}
                    onFocus={handleCpfFocus}
                    onBlur={handleCpfBlur}
                    placeholder="000.000.000-00"
                    style={inputStyle(cpfValid === false)}
                  />
                  {cpfValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {cpfValid ? (
                        <CheckCircle2
                          size={16}
                          strokeWidth={2}
                          style={{ color: "#16a34a" }}
                        />
                      ) : (
                        <AlertCircle
                          size={16}
                          strokeWidth={2}
                          style={{ color: "#DC2626" }}
                        />
                      )}
                    </div>
                  )}
                </div>
                {cpfValid === false && (
                  <p className="text-[10px] mt-1" style={{ color: "#DC2626" }}>
                    CPF inválido
                  </p>
                )}
              </div>

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
              {!deliveryValid
                ? "Complete os dados obrigatórios"
                : !lgpdAccepted
                  ? "Confirme o uso dos dados"
                  : !paymentOpen
                    ? "Escolher pagamento"
                    : !payment
                      ? "Selecione Pix ou cartão"
                      : "Ir para o Mercado Pago"}
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
          disabled={paying || !canSubmit}
          className="w-full py-4 rounded-2xl font-black uppercase tracking-widest disabled:opacity-30"
          style={{
            background: ROSA,
            color: VERDE,
            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
            fontSize: "1.1rem",
            letterSpacing: "0.2em",
            border: "none",
            cursor: canSubmit ? "pointer" : "default",
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
              : paymentOpen
                ? "PAGAR ONLINE"
                : "FINALIZAR PEDIDO"}{" "}
            - {fmt(total)}
          </span>
        </motion.button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
