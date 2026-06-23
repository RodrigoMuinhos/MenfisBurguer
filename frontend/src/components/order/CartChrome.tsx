import Image from "next/image";
import { motion } from "motion/react";
import { ChevronLeft, ReceiptText } from "lucide-react";
import { CartItem } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { BUSINESS_HOURS_LABEL, CheckoutStep } from "./checkout";

export function EmptyCartState({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-5 p-8 text-center"
      style={{ minHeight: 460, background: "#fff" }}
    >
      <Image
        src="/logo_M.jpeg"
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
          Adicione itens do cardapio
        </p>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
        className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider"
        style={{
          background: ROSA,
          color: VERDE,
          border: "none",
          cursor: "pointer",
        }}
      >
        Ver cardapio
      </motion.button>
    </div>
  );
}

export function CartHeader({
  cart,
  onBack,
}: {
  cart: CartItem[];
  onBack: () => void;
}) {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div
      className="px-4 pt-5 pb-4 flex items-center gap-3"
      style={{
        background: VERDE,
        borderBottom: `1px solid ${ROSA}30`,
        boxShadow: "0 16px 40px rgba(31,61,46,0.18)",
      }}
    >
      <button
        onClick={onBack}
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
        <p className="text-[10px] mt-0.5" style={{ color: ROSA, opacity: 0.68 }}>
          {totalItems} {totalItems === 1 ? "item" : "itens"}
        </p>
      </div>
      <div
        className="h-11 w-11 shrink-0 overflow-hidden rounded-full"
        style={{ background: "#fff", border: `2px solid ${ROSA}` }}
      >
        <Image
          src="/logo_M.jpeg"
          alt="Menfi's"
          width={44}
          height={44}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

export function CheckoutProgress({
  checkoutStep,
  kioskMode,
  counterServiceMode = false,
}: {
  checkoutStep: CheckoutStep;
  kioskMode: boolean;
  counterServiceMode?: boolean;
}) {
  const counterFlow = kioskMode || counterServiceMode;
  const steps = counterFlow
    ? [
        { label: "Sacola", active: true },
        {
          label: "Dados",
          active: counterServiceMode || ["customer", "review", "payment"].includes(checkoutStep),
        },
        {
          label: "Balcão",
          active: ["payment", "review"].includes(checkoutStep),
        },
        {
          label: "Enviar pedido",
          active: checkoutStep === "payment",
        },
      ]
    : [
        {
          label: "Sacola",
          active: ["bag", "delivery", "payment", "review"].includes(checkoutStep),
        },
        {
          label: "Dados",
          active: ["delivery", "payment", "review"].includes(checkoutStep),
        },
        { label: "Finalizar", active: checkoutStep === "review" },
      ];

  return (
    <div className="px-4 py-3" style={{ background: VERDE, color: ROSA }}>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => (
          <div key={step.label}>
            <div
              className="h-1.5 rounded-full"
              style={{ background: step.active ? ROSA : `${ROSA}24` }}
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
  );
}

export function CheckoutIntro({
  kioskMode,
  counterServiceMode = false,
  stepLabel,
}: {
  kioskMode: boolean;
  counterServiceMode?: boolean;
  stepLabel: string;
}) {
  return (
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
            {counterServiceMode
              ? `Etapa atual: ${stepLabel}. O pagamento será feito no balcão e o pedido será enviado para a cozinha.`
              : kioskMode
              ? `Etapa atual: ${stepLabel}. Primeiro informe os dados, depois revise e siga para o pagamento.`
              : `Etapa atual: ${stepLabel}. ${BUSINESS_HOURS_LABEL}`}
          </p>
        </div>
      </div>
    </div>
  );
}
