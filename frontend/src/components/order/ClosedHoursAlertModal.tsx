import { Clock3 } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";

interface Props {
  message: string;
  onReturnToMenu: () => void;
}

export function ClosedHoursAlertModal({ message, onReturnToMenu }: Props) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="closed-hours-title"
      style={{ background: "rgba(22, 8, 13, 0.68)" }}
    >
      <div
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl"
        style={{ border: `1px solid ${ROSA}` }}
      >
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: `${ROSA}55`, color: VERDE }}
        >
          <Clock3 size={24} aria-hidden="true" />
        </div>
        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#b26c80]">
          Atendimento indisponível
        </p>
        <h2
          id="closed-hours-title"
          className="text-2xl font-black leading-tight"
          style={{ color: VERDE }}
        >
          Estamos fechados no momento
        </h2>
        <p className="mt-4 rounded-2xl p-4 text-sm font-semibold leading-relaxed" style={{ background: "#fff3f6", color: VERDE }}>
          {message || "Assim que abrirmos, você será informado e poderá finalizar seu pedido."}
        </p>
        <p className="mt-4 text-xs font-semibold leading-relaxed text-[#875364]">
          Seu carrinho foi mantido. Volte ao cardápio para continuar escolhendo seus produtos.
        </p>
        <button
          type="button"
          onClick={onReturnToMenu}
          className="mt-6 w-full rounded-2xl py-4 text-sm font-black uppercase tracking-wide text-white"
          style={{ background: VERDE }}
        >
          Voltar ao cardápio
        </button>
      </div>
    </div>
  );
}
