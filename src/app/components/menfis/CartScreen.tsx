import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  Minus,
  Plus,
  MessageSquare,
  X,
  Store,
  Bike,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  Loader2,
  QrCode,
  CreditCard,
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
  combo: "Menfi's Burger · Coca-Cola 350ml · Batata Frita 250g",
};

const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

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
async function lookupCEP(
  cep: string,
): Promise<{
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
  ) => void;
  goToMenu: () => void;
}

const STORAGE_KEY = "menfis_cliente";

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function CartScreen({ cart, updateQty, onPlaceOrder, goToMenu }: Props) {
  const [delivery, setDelivery] = useState<DeliveryType>("retirada");
  const [obsOpen, setObsOpen] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Record<string, Set<string>>>({});
  const [savedBadge, setSavedBadge] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod | null>(null);

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
  const fee = delivery === "delivery" ? 5.1 : 0;
  const total = subtotal + fee;

  const deliveryValid =
    delivery === "retirada" ||
    (cep.replace(/\D/g, "").length === 8 &&
      !cepError &&
      street.length > 0 &&
      number.trim().length > 0 &&
      cpfRaw.replace(/\D/g, "").length === 11 &&
      cpfValid === true &&
      phone.replace(/\D/g, "").length >= 10);

  const handleFinalize = () => {
    if (!deliveryValid) return;
    if (!paymentOpen) {
      setPaymentOpen(true);
      return;
    }
    if (!payment) return;

    const removedByItemId = Object.fromEntries(
      Object.entries(removed)
        .map(([itemId, opts]) => [itemId, [...opts]])
        .filter(([, opts]) => opts.length > 0),
    ) as Record<string, string[]>;

    onPlaceOrder(
      delivery,
      phone || undefined,
      delivery === "delivery"
        ? `${street}, ${number}${complement ? ` ${complement}` : ""}`
        : undefined,
      Object.keys(removedByItemId).length > 0 ? removedByItemId : undefined,
    );
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

  /* ── Empty ── */
  if (cart.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-5 p-8 text-center"
        style={{ minHeight: 460, background: "#fff" }}
      >
        <img
          src={logoSkull.src}
          alt="Mascote"
          className="w-20 h-20 object-contain"
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
        background: "#fff",
        fontFamily: "'Inter', system-ui, sans-serif",
        minHeight: "100%",
      }}
    >
      {/* ══ HEADER ════════════════════════════════════════ */}
      <div
        className="px-4 pt-5 pb-4 flex items-center gap-3"
        style={{ background: "#fff", borderBottom: `1px solid ${ROSA}` }}
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
              color: VERDE,
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
            style={{ color: VERDE, opacity: 0.45 }}
          >
            {cart.reduce((s, i) => s + i.qty, 0)}{" "}
            {cart.reduce((s, i) => s + i.qty, 0) === 1 ? "item" : "itens"}
          </p>
        </div>
        <img
          src={logoSkull.src}
          alt="Menfi's"
          className="h-11 w-11 object-contain"
          style={{ mixBlendMode: "multiply" }}
        />
      </div>

      {/* ══ BODY ══════════════════════════════════════════ */}
      <div className="px-4 pt-5 pb-32 flex flex-col gap-5">
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
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-3"
            style={{ color: VERDE, opacity: 0.4 }}
          >
            Resumo do pedido
          </p>
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
          {delivery === "delivery" && (
            <div
              className="flex justify-between text-xs py-1"
              style={{ color: VERDE, opacity: 0.5 }}
            >
              <span>Taxa de entrega</span>
              <span>{fmt(fee)}</span>
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

        {/* ── Tipo de pedido ── */}
        <div>
          <Label>Tipo de pedido</Label>
          <div
            className="flex rounded-2xl overflow-hidden"
            style={{ border: `1.5px solid ${ROSA}` }}
          >
            {(
              [
                { id: "retirada", label: "Retirada", Icon: Store },
                { id: "delivery", label: "Delivery", Icon: Bike },
              ] as {
                id: DeliveryType;
                label: string;
                Icon: React.ElementType;
              }[]
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setDelivery(id)}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wider"
                style={{
                  background: delivery === id ? ROSA : "#fff",
                  color: VERDE,
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                <Icon size={14} strokeWidth={2} />
                {label}
              </button>
            ))}
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
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "pix", label: "Pix", Icon: QrCode },
                      { id: "cartao", label: "Cartão", Icon: CreditCard },
                    ] as {
                      id: PaymentMethod;
                      label: string;
                      Icon: React.ElementType;
                    }[]
                  ).map(({ id, label, Icon }) => {
                    const active = payment === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setPayment(id)}
                        className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black uppercase tracking-wider"
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
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleFinalize}
          disabled={!deliveryValid || (paymentOpen && !payment)}
          className="w-full py-4 rounded-2xl font-black uppercase tracking-widest disabled:opacity-30"
          style={{
            background: ROSA,
            color: VERDE,
            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
            fontSize: "1.1rem",
            letterSpacing: "0.2em",
            border: "none",
            cursor:
              deliveryValid && (!paymentOpen || payment)
                ? "pointer"
                : "default",
          }}
        >
          {paymentOpen ? "CONFIRMAR PEDIDO" : "FINALIZAR PEDIDO"} — {fmt(total)}
        </motion.button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
