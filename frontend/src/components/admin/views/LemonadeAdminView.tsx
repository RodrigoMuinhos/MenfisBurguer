import { ChevronDown, ChevronUp, CupSoda, Save } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import type { LemonadeSettings } from "@/components/product/LemonadeShowcase";

const FLAVORS = [
  { id: "pink-lemonade", label: "Pink Lemonade" },
  { id: "purple-lemonade", label: "Purple Lemonade" },
  { id: "sunset-lemonade", label: "Sunset Lemonade" },
];

const HERO_LABELS: Record<string, string> = {
  "hero.png": "Hero geral",
  "hero2.png": "Hero Sunset",
  "hero3.png": "Hero Purple",
};

export function LemonadeAdminView({
  settings,
  onChange,
  onSave,
  saving,
}: {
  settings: LemonadeSettings;
  onChange: (settings: LemonadeSettings) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const move = (key: "flavorOrder" | "heroOrder", index: number, direction: number) => {
    const list = [...settings[key]];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    onChange({ ...settings, [key]: list });
  };

  return (
    <section className="mx-auto max-w-5xl" style={{ color: VERDE }}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><CupSoda size={20} /><p className="text-xs font-black uppercase tracking-[.18em]">Kiosk</p></div>
          <h1 className="mt-2 text-3xl font-black uppercase">Menu Lemonade</h1>
          <p className="mt-2 text-sm font-bold opacity-60">Organize o selo, sabores e carrossel exibidos para a conta KIOSK-MOB.</p>
        </div>
        <button onClick={onSave} disabled={saving} className="flex h-12 items-center gap-2 rounded-2xl px-5 text-xs font-black uppercase disabled:opacity-50" style={{ background: VERDE, color: ROSA }}>
          <Save size={17} /> {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Selo por sabor">
          <div className="grid gap-3">
            {FLAVORS.map((flavor) => (
              <label key={flavor.id} className="block">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{flavor.label}</span>
                <input
                  value={settings.badgeLabels[flavor.id] ?? ""}
                  onChange={(event) => onChange({ ...settings, badgeLabels: { ...settings.badgeLabels, [flavor.id]: event.target.value } })}
                  className="mt-1 h-11 w-full rounded-xl px-4 text-sm font-bold outline-none"
                  style={{ border: `1px solid ${VERDE}20` }}
                  placeholder="Sem selo"
                />
              </label>
            ))}
          </div>
        </Card>

        <Card title="Sabores visíveis">
          <div className="grid gap-2">
            {FLAVORS.map((flavor) => {
              const enabled = settings.enabledFlavors.includes(flavor.id);
              return <button key={flavor.id} onClick={() => onChange({ ...settings, enabledFlavors: enabled ? settings.enabledFlavors.filter((id) => id !== flavor.id) : [...settings.enabledFlavors, flavor.id] })} className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-black" style={{ background: enabled ? `${ROSA}55` : "#F8F4F5", border: `1px solid ${enabled ? VERDE : `${VERDE}10`}` }}><span>{flavor.label}</span><span>{enabled ? "Ativo" : "Oculto"}</span></button>;
            })}
          </div>
        </Card>

        <Card title="Ordem dos sabores">
          <OrderList items={settings.flavorOrder} label={(id) => FLAVORS.find((flavor) => flavor.id === id)?.label ?? id} onMove={(index, direction) => move("flavorOrder", index, direction)} />
        </Card>

        <Card title="Ordem dos heros">
          <OrderList items={settings.heroOrder} label={(id) => HERO_LABELS[id] ?? id} onMove={(index, direction) => move("heroOrder", index, direction)} />
        </Card>
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-3xl bg-white p-5" style={{ border: `1px solid ${VERDE}18` }}><h2 className="mb-4 text-sm font-black uppercase tracking-wider">{title}</h2>{children}</div>;
}

function OrderList({ items, label, onMove }: { items: string[]; label: (id: string) => string; onMove: (index: number, direction: number) => void }) {
  return <div className="grid gap-2">{items.map((id, index) => <div key={id} className="flex items-center gap-3 rounded-xl bg-[#FFF8F2] px-4 py-3"><span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black" style={{ background: ROSA }}>{index + 1}</span><span className="flex-1 text-sm font-black">{label(id)}</span><button onClick={() => onMove(index, -1)} disabled={index === 0} className="p-2 disabled:opacity-20"><ChevronUp size={17} /></button><button onClick={() => onMove(index, 1)} disabled={index === items.length - 1} className="p-2 disabled:opacity-20"><ChevronDown size={17} /></button></div>)}</div>;
}
