import { CalendarClock, FlaskConical, PackageX, RotateCcw, Save, Table2 } from "lucide-react";
import { MENU_ITEMS } from "@/features/catalog/menu";
import { ROSA, VERDE } from "@/utils/theme";
import { OperatingHoursConfig, normalizeOperatingHours } from "@/components/order/checkout";
import { PayOnDeliverySettings } from "../AdminChrome";

export function ConfigView({
  payOnDeliveryEnabled,
  testModeEnabled,
  demoTableEnabled,
  soldOutEnabled,
  featuredProductId,
  operatingHours,
  hasUnsavedOperatingHours,
  saving,
  disabled,
  onTogglePayOnDelivery,
  onToggleTestMode,
  onToggleDemoTable,
  onToggleSoldOut,
  onFeaturedProductChange,
  onOperatingHoursChange,
  onSaveOperatingHours,
  onResetRealOperation,
}: {
  payOnDeliveryEnabled: boolean;
  testModeEnabled: boolean;
  demoTableEnabled: boolean;
  soldOutEnabled: boolean;
  featuredProductId: string;
  operatingHours: OperatingHoursConfig;
  hasUnsavedOperatingHours: boolean;
  saving: boolean;
  disabled: boolean;
  onTogglePayOnDelivery: () => void;
  onToggleTestMode: () => void;
  onToggleDemoTable: () => void;
  onToggleSoldOut: () => void;
  onFeaturedProductChange: (productId: string) => void;
  onOperatingHoursChange: (config: OperatingHoursConfig) => void;
  onSaveOperatingHours: () => void;
  onResetRealOperation: () => void;
}) {
  const normalizedOperatingHours = normalizeOperatingHours(operatingHours);
  const changeOperatingDay = (
    dayNumber: number,
    patch: Partial<OperatingHoursConfig["days"][number]>,
  ) => {
    onOperatingHoursChange({
      days: normalizedOperatingHours.days.map((day) =>
        day.day === dayNumber ? { ...day, ...patch } : day,
      ),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <PayOnDeliverySettings
        enabled={payOnDeliveryEnabled}
        saving={saving}
        disabled={disabled}
        onToggle={onTogglePayOnDelivery}
      />

      <section
        className="rounded-2xl p-4"
        style={{
          background: soldOutEnabled ? "#FEF2F2" : "#fff",
          border: `1.5px solid ${soldOutEnabled ? "#EF4444" : `${VERDE}18`}`,
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: soldOutEnabled ? "#EF4444" : ROSA, color: soldOutEnabled ? "#fff" : VERDE }}
            >
              <PackageX size={19} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-black uppercase" style={{ color: soldOutEnabled ? "#991B1B" : VERDE }}>
                SOLD OUT
              </p>
              <p className="mt-1 text-xs font-bold leading-relaxed opacity-70" style={{ color: soldOutEnabled ? "#991B1B" : VERDE }}>
                Quando ligado, o cardápio continua visível, novos pedidos são bloqueados e o cliente vê o aviso de estoque esgotado com cadastro para ser avisado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleSoldOut}
            disabled={saving || disabled}
            className="min-h-12 min-w-36 rounded-full px-5 text-xs font-black uppercase tracking-wide"
            style={{
              background: soldOutEnabled ? "#EF4444" : "#E5E7EB",
              color: soldOutEnabled ? "#fff" : "#4B5563",
              opacity: saving || disabled ? 0.6 : 1,
            }}
          >
            {soldOutEnabled ? "SOLD OUT ligado" : "SOLD OUT desligado"}
          </button>
        </div>
      </section>

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
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: ROSA, color: VERDE }}>
            <CalendarClock size={19} strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-sm font-black uppercase" style={{ color: VERDE }}>Horários de atendimento</p>
            <p className="mt-1 text-xs font-bold opacity-55" style={{ color: VERDE }}>
              Fora dos dias e horários ativos, o cliente vê o aviso configurado e não consegue enviar pedidos. A regra também é validada no backend.
            </p>
          </div>
        </div>
        <div className="grid gap-2">
          {normalizedOperatingHours.days.map((day) => (
            <div
              key={day.day}
              className="grid gap-3 rounded-xl p-3 md:grid-cols-[120px_130px_1fr] md:items-center"
              style={{ background: "#FFF8F2", border: `1px solid ${VERDE}12` }}
            >
              <p className="text-sm font-black" style={{ color: VERDE }}>{day.label}</p>
              <button
                type="button"
                onClick={() => changeOperatingDay(day.day, { open: !day.open })}
                disabled={saving || disabled}
                className="rounded-full px-4 py-2 text-xs font-black uppercase"
                style={{
                  background: day.open ? VERDE : "#E5E7EB",
                  color: day.open ? ROSA : "#4B5563",
                  opacity: saving || disabled ? 0.6 : 1,
                }}
              >
                {day.open ? "Aberto" : "Fechado"}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
                  Abre
                  <input
                    type="time"
                    value={day.start}
                    onChange={(event) => changeOperatingDay(day.day, { start: event.target.value })}
                    disabled={saving || disabled || !day.open}
                    className="min-h-11 rounded-xl px-3 text-sm font-black outline-none"
                    style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#fff" }}
                  />
                </label>
                <label className="grid gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: `${VERDE}99` }}>
                  Fecha
                  <input
                    type="time"
                    value={day.end}
                    onChange={(event) => changeOperatingDay(day.day, { end: event.target.value })}
                    disabled={saving || disabled || !day.open}
                    className="min-h-11 rounded-xl px-3 text-sm font-black outline-none"
                    style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#fff" }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: `${VERDE}12` }}>
          <p className="text-xs font-bold" style={{ color: hasUnsavedOperatingHours ? "#B45309" : `${VERDE}99` }}>
            {hasUnsavedOperatingHours
              ? "Há alterações de horário que ainda não foram salvas."
              : "Horários salvos e ativos no sistema."}
          </p>
          <button
            type="button"
            onClick={onSaveOperatingHours}
            disabled={saving || disabled || !hasUnsavedOperatingHours}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-xs font-black uppercase"
            style={{
              background: hasUnsavedOperatingHours ? VERDE : "#E5E7EB",
              color: hasUnsavedOperatingHours ? ROSA : "#6B7280",
              opacity: saving || disabled ? 0.6 : 1,
            }}
          >
            <Save size={15} />
            {saving ? "Salvando..." : "Salvar horários"}
          </button>
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
