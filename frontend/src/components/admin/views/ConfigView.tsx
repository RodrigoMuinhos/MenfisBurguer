import { FlaskConical, RotateCcw } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import { PayOnDeliverySettings } from "../AdminChrome";

export function ConfigView({
  payOnDeliveryEnabled,
  testModeEnabled,
  saving,
  disabled,
  onTogglePayOnDelivery,
  onToggleTestMode,
  onResetRealOperation,
}: {
  payOnDeliveryEnabled: boolean;
  testModeEnabled: boolean;
  saving: boolean;
  disabled: boolean;
  onTogglePayOnDelivery: () => void;
  onToggleTestMode: () => void;
  onResetRealOperation: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <PayOnDeliverySettings
        enabled={payOnDeliveryEnabled}
        saving={saving}
        disabled={disabled}
        onToggle={onTogglePayOnDelivery}
      />

      <section className="rounded-2xl p-4" style={{ background: "#fff", border: `1.5px solid ${VERDE}18` }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: ROSA, color: VERDE }}>
              <FlaskConical size={19} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-black uppercase" style={{ color: VERDE }}>Modo teste</p>
              <p className="mt-1 text-xs font-bold opacity-55" style={{ color: VERDE }}>
                Quando ligado, pedidos, estoque e cupons de simulação ficam separados da operação real.
              </p>
            </div>
          </div>
          <button
            onClick={onToggleTestMode}
            disabled={saving || disabled}
            className="min-w-24 rounded-full px-4 py-3 text-xs font-black uppercase"
            style={{
              background: testModeEnabled ? "#F59E0B" : "#E5E7EB",
              color: testModeEnabled ? "#fff" : "#4B5563",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {testModeEnabled ? "Teste ligado" : "Teste desligado"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl p-4" style={{ background: "#fff", border: "1.5px solid #FCA5A5" }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase" style={{ color: "#991B1B" }}>Zerar operação real</p>
            <p className="mt-1 text-xs font-bold opacity-70" style={{ color: "#991B1B" }}>
              Remove histórico real de vendas, cupons reais e quantidades de estoque real. Use só no início da operação.
            </p>
          </div>
          <button
            onClick={onResetRealOperation}
            disabled={saving || disabled}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
            style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5" }}
          >
            <RotateCcw size={15} />
            Zerar real
          </button>
        </div>
      </section>
    </div>
  );
}
