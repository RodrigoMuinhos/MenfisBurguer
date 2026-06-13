import { FlaskConical, RotateCcw, Table2 } from "lucide-react";
import { MENU_ITEMS } from "@/features/catalog/menu";
import { ROSA, VERDE } from "@/utils/theme";
import { PayOnDeliverySettings } from "../AdminChrome";

export function ConfigView({
  payOnDeliveryEnabled,
  testModeEnabled,
  demoTableEnabled,
  featuredProductId,
  saving,
  disabled,
  onTogglePayOnDelivery,
  onToggleTestMode,
  onToggleDemoTable,
  onFeaturedProductChange,
  onResetRealOperation,
}: {
  payOnDeliveryEnabled: boolean;
  testModeEnabled: boolean;
  demoTableEnabled: boolean;
  featuredProductId: string;
  saving: boolean;
  disabled: boolean;
  onTogglePayOnDelivery: () => void;
  onToggleTestMode: () => void;
  onToggleDemoTable: () => void;
  onFeaturedProductChange: (productId: string) => void;
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
        <div className="grid gap-3 md:grid-cols-[1fr_320px] md:items-center">
          <div>
            <p className="text-sm font-black uppercase" style={{ color: VERDE }}>Destaque do cardápio</p>
            <p className="mt-1 text-xs font-bold opacity-60">
              Escolha o produto principal que aparece no banner inicial do cliente.
            </p>
          </div>
          <select
            value={featuredProductId}
            onChange={(event) => onFeaturedProductChange(event.target.value)}
            disabled={saving || disabled}
            className="min-h-12 rounded-2xl px-4 text-sm font-black outline-none"
            style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#FFF8F2" }}
          >
            {MENU_ITEMS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </section>

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

      <section className="rounded-2xl p-4" style={{ background: "#fff", border: `1.5px solid ${VERDE}18` }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: ROSA, color: VERDE }}>
              <Table2 size={19} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-black uppercase" style={{ color: VERDE }}>Tabela teste</p>
              <p className="mt-1 text-xs font-bold opacity-55" style={{ color: VERDE }}>
                Liga um mock demonstrativo com 70 pedidos, clientes e montagem na cozinha sem gravar na operação real.
              </p>
            </div>
          </div>
          <button
            onClick={onToggleDemoTable}
            disabled={saving || disabled}
            className="min-w-24 rounded-full px-4 py-3 text-xs font-black uppercase"
            style={{
              background: demoTableEnabled ? VERDE : "#E5E7EB",
              color: demoTableEnabled ? ROSA : "#4B5563",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {demoTableEnabled ? "Tabela ligada" : "Tabela desligada"}
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
