import { useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Download,
  Filter,
  Image as ImageIcon,
  LayoutGrid,
  PackageSearch,
  Pencil,
  Plus,
  Sheet,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
} from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import { MENU_ITEMS } from "@/features/catalog/menu";
import { API_URL, fmt } from "../shared";
import { deletePricingProduct, fetchPricingProducts, savePricingProduct } from "../adminBackend";
import { imageSrc } from "@/components/product/shared";

type PricingKind = "sandwich" | "combo" | "side" | "drink";
type PricingStatus = "saudavel" | "atencao" | "ruim";
type PricingFilter = "todos" | PricingKind | PricingStatus | "ativo" | "inativo";
type PricingCategoryFilter = "todos" | "Burgers" | "Bebidas" | "Fries" | "Extras" | "Sweet";

export type PricingRow = {
  id: string;
  code: string;
  name: string;
  category: string;
  kind: PricingKind;
  baseCost: number;
  friesCost: number;
  defaultDrinkCost: number;
  alternativeDrinkCost: number;
  drinkSurcharge: number;
  salePrice: number;
  targetCmv: number;
  active: boolean;
  notes: string;
  imageUrl?: string;
  originalPrice?: number;
  updatedAt: string;
};

type CalculatedPricingRow = PricingRow & {
  totalCost: number;
  priceWithAlternativeDrink: number;
  grossProfit: number;
  cmv: number;
  grossMargin: number;
  recommendedPrice: number;
  status: PricingStatus;
};

const STORAGE_KEY = "menfis_pricing_table_v1";

const DEFAULT_ROWS: PricingRow[] = [
  simple("burger", "MENFIS", "Menfi's Burguer", "Burgers", 8.85, 25.9),
  simple("double-burger", "BIG-MENFIS", "Big Menfi's Burguer", "Burgers", 12, 29.9),
  simple("menfis-chicken", "CHICKEN", "Menfi's Chicken", "Burgers", 6.3, 24.9),
  simple("double-menfis-chicken", "BIG-CHICKEN", "Big Chicken", "Burgers", 9.8, 32.9),
  simple("menfis-bacon", "BACON", "Menfi's Bacon", "Burgers", 9.8, 27.9),
  simple("double-menfis-bacon", "BIG-BACON", "Big Menfi's Bacon", "Burgers", 14.7, 35.9),
  drink("guarana-zero", "GUARANA", "Guarana Zero", 2.89, 6.9),
  drink("guarana", "GUARANA-TRADICIONAL", "Guaraná", 2.89, 6.9),
  drink("coca-zero", "COCA", "Coca-Cola Zero", 3.89, 9.9, 2),
  combo("combo", "COMBO-MENFIS", "Combo Menfi's", 8.85, 34.9),
  combo("double-combo", "COMBO-BIG", "Combo Big Menfi's", 12, 42.9),
  combo("triple-combo", "TRIPLE-MENFIS", "Combo Triple Menfi's", 17.7, 65.9),
  combo("chicken-combo", "COMBO-CHICKEN", "Combo Chicken", 6.3, 38.9),
  combo("double-chicken-combo", "COMBO-BIG-CHICKEN", "Combo Big Chicken", 9.8, 46.9),
  combo("bacon-combo", "COMBO-BACON", "Combo Bacon", 9.8, 40.9),
  combo("double-bacon-combo", "COMBO-BIG-BACON", "Combo Big Bacon", 14.7, 48.9),
  combo("combo2", "SUPER-MENFIS", "Super Combo Menfi's", 17.7, 59.9, 5.78, 7.78),
  combo("chicken-super-combo", "SUPER-CHICKEN", "Super Combo Menfi's Chicken", 12.6, 64.9, 5.78, 7.78),
  combo("bacon-super-combo", "SUPER-BACON", "Super Combo Menfi's Bacon", 19.6, 71.9, 5.78, 7.78),
  side("batata-pequena", "BATATA-P", "Batata Frita Pequena", 1.33, 9.9, "Fries"),
  side("batata-media", "BATATA-M", "Batata Frita Média", 2.66, 14.9, "Fries"),
  side("batata", "BATATA-G", "Batata Frita Grande", 4.00, 19.9, "Fries"),
  side("nuggets-90g", "NUGGETS-90G", "Menfi's Nuggets 90g", 2.82, 12.9, "Extras"),
  side("nuggets-180g", "NUGGETS-180G", "Menfi's Nuggets 180g", 5.63, 18.9, "Extras"),
  side("nuggets-grande", "NUGGETS-270G", "Menfi's Nuggets 270g", 8.45, 29.9, "Extras"),
  side("sweet-menfis-classic", "SWEET-CLASSIC", "Sweet Menfi's Classic", 3.1, 8.9, "Sweet / Classic"),
  side("sweet-menfis-plus", "SWEET-PLUS", "Sweet Menfi's Plus", 4.2, 12.9, "Sweet / Plus"),
  side("smash-nutella-marshmallow", "SMOORE", "Smoore Menfi's", 0, 21.9, "Sweet"),
  simple("tropikal-menfis", "TROPIKAL-MENFIS", "Tropikal Menfi's", "SUPER", 0, 42.9),
  simple("tropikal-barbecue", "TROPIKAL-BBQ", "Chilli Menfi's", "SUPER", 0, 42.9),
];

export function PricingView({ adminToken = "" }: { adminToken?: string }) {
  const [rows, setRows] = useState<PricingRow[]>(loadRows);
  const [syncError, setSyncError] = useState("");
  const [filter, setFilter] = useState<PricingFilter>("todos");
  const [categoryFilter, setCategoryFilter] = useState<PricingCategoryFilter>("todos");
  const [viewMode, setViewMode] = useState<"cards" | "sheet">("cards");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PricingRow | null>(null);

  const calculated = useMemo(() => rows.map(calculateRow), [rows]);
  const filtered = calculated.filter((row) => {
    const matchesFilter =
      filter === "todos" ||
      row.kind === filter ||
      row.status === filter ||
      (filter === "ativo" && row.active) ||
      (filter === "inativo" && !row.active);
    const matchesCategory =
      categoryFilter === "todos" || normalizePricingCategory(row) === categoryFilter;
    const matchesQuery = `${row.code} ${row.name} ${row.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesCategory && matchesQuery;
  });
  const activeRows = calculated.filter((row) => row.active);
  const categorySummaries = buildCategorySummaries(activeRows);
  const avgCmv = average(activeRows.map((row) => row.cmv));
  const worst = [...activeRows].sort((a, b) => b.cmv - a.cmv)[0];
  const best = [...activeRows].sort((a, b) => a.cmv - b.cmv)[0];
  const mostProfitable = [...activeRows].sort((a, b) => b.grossProfit - a.grossProfit)[0];
  const badCount = activeRows.filter((row) => row.status === "ruim").length;

  const saveRows = (next: PricingRow[]) => {
    setRows(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  useEffect(() => {
    if (!API_URL) return;
    fetchPricingProducts(API_URL, adminToken)
      .then((next) => {
        if (next.length > 0) saveRows(next);
        setSyncError("");
      })
      .catch(() => setSyncError("Nao foi possivel carregar a tabela de custos do backend."));
  }, [adminToken]);

  const persistRow = async (row: PricingRow) => {
    if (!API_URL) return;
    try {
      await savePricingProduct(API_URL, adminToken, row);
      setSyncError("");
    } catch {
      setSyncError("Alteracao salva localmente, mas o backend nao recebeu.");
    }
  };

  const startEdit = (row: PricingRow) => {
    setEditingId(row.id);
    setDraft({ ...row });
  };

  const saveDraft = () => {
    if (!draft) return;
    const next = rows.map((row) =>
      row.id === draft.id ? { ...draft, updatedAt: new Date().toISOString() } : row,
    );
    saveRows(next);
    persistRow(next.find((row) => row.id === draft.id)!);
    setEditingId(null);
    setDraft(null);
  };

  const duplicateRow = (row: PricingRow) => {
    const nextRow = {
      ...row,
      id: `${row.id}-${Date.now()}`,
      code: `${row.code}-COPIA`,
      name: `${row.name} copia`,
      updatedAt: new Date().toISOString(),
    };
    saveRows([...rows, nextRow]);
    persistRow(nextRow);
    startEdit(nextRow);
  };

  const toggleActive = (row: PricingRow) => {
    const next = rows.map((item) =>
        item.id === row.id
          ? { ...item, active: !item.active, updatedAt: new Date().toISOString() }
          : item,
      );
    saveRows(next);
    persistRow(next.find((item) => item.id === row.id)!);
  };

  const exportCsv = () => {
    const header = [
      "codigo",
      "produto",
      "categoria",
      "tipo",
      "custo_unitario",
      "custo_total",
      "preco_venda",
      "preco_de",
      "imagem",
      "preco_coca",
      "lucro_bruto",
      "cmv",
      "margem",
      "preco_recomendado",
      "status",
    ];
    const lines = filtered.map((row) =>
      [
        row.code,
        row.name,
        row.category,
        labelKind(row.kind),
        row.totalCost.toFixed(2),
        row.totalCost.toFixed(2),
        row.salePrice.toFixed(2),
        row.originalPrice?.toFixed(2) ?? "",
        row.imageUrl ?? "",
        row.priceWithAlternativeDrink.toFixed(2),
        row.grossProfit.toFixed(2),
        `${(row.cmv * 100).toFixed(2)}%`,
        `${(row.grossMargin * 100).toFixed(2)}%`,
        row.recommendedPrice.toFixed(2),
        statusLabel(row.status),
      ].join(";"),
    );
    const blob = new Blob([[header.join(";"), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "menfis-custos-precificacao.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto grid max-w-[1600px] gap-5" style={{ color: VERDE }}>
      <section className="rounded-3xl p-5" style={{ background: VERDE, color: "#fff" }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: ROSA }}>
              Custos e Precificacao
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-wide">
              Tabela de Custos
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed opacity-80">
              Controle custo, preco, lucro, CMV e preco recomendado. Dados editaveis ficam separados dos calculos automaticos.
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black uppercase"
            style={{ background: ROSA, color: VERDE }}
          >
            <Download size={15} /> Exportar CSV
          </button>
        </div>
      </section>
      {syncError && (
        <div className="rounded-2xl px-4 py-3 text-xs font-black" style={{ background: "#FEF3C7", color: "#92400E" }}>
          {syncError}
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="CMV medio" value={`${Math.round(avgCmv * 100)}%`} help="Media dos produtos ativos" icon={Calculator} />
        <Metric title="Melhor margem" value={best?.name ?? "-"} help={best ? `${Math.round(best.cmv * 100)}% CMV` : "-"} icon={CheckCircle2} />
        <Metric title="Pior margem" value={worst?.name ?? "-"} help={worst ? `${Math.round(worst.cmv * 100)}% CMV` : "-"} icon={AlertTriangle} />
        <Metric title="Mais lucrativo" value={mostProfitable?.name ?? "-"} help={mostProfitable ? fmt(mostProfitable.grossProfit) : "-"} icon={TrendingUp} />
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <Summary label="Produtos ativos" value={String(activeRows.length)} />
        <Summary label="Margem ruim" value={String(badCount)} alert={badCount > 0} />
        <Summary label="Preco medio" value={fmt(average(activeRows.map((row) => row.salePrice)))} />
        <Summary label="Lucro medio" value={fmt(average(activeRows.map((row) => row.grossProfit)))} />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {categorySummaries.map((summary) => (
          <Summary
            key={summary.category}
            label={`${summary.category} · CMV`}
            value={`${Math.round(summary.cmv * 100)}%`}
            alert={summary.cmv > 0.4}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl bg-white p-4" style={{ border: `1px solid ${ROSA}` }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black uppercase">Tabela principal</h2>
              <p className="mt-1 text-xs font-bold opacity-55">Produtos simples, bebidas, acompanhamentos e combos.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton active={viewMode === "cards"} onClick={() => setViewMode("cards")} icon={LayoutGrid}>Como está</FilterButton>
              <FilterButton active={viewMode === "sheet"} onClick={() => setViewMode("sheet")} icon={Sheet}>Planilha</FilterButton>
              <FilterButton active={filter === "todos"} onClick={() => setFilter("todos")}>Todos</FilterButton>
              <FilterButton active={filter === "sandwich"} onClick={() => setFilter("sandwich")}>Sanduiches</FilterButton>
              <FilterButton active={filter === "combo"} onClick={() => setFilter("combo")}>Combos</FilterButton>
              <FilterButton active={filter === "ruim"} onClick={() => setFilter("ruim")}>Ruim</FilterButton>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["todos", "Burgers", "Bebidas", "Fries", "Extras", "Sweet"] as PricingCategoryFilter[]).map((category) => (
              <FilterButton
                key={category}
                active={categoryFilter === category}
                onClick={() => setCategoryFilter(category)}
              >
                {category === "todos" ? "Todas categorias" : category}
              </FilterButton>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar produto, codigo ou categoria"
              className="min-h-11 flex-1 rounded-2xl px-4 text-sm font-bold outline-none"
              style={{ border: `1.5px solid ${VERDE}18`, color: VERDE }}
            />
            <button
              type="button"
              onClick={() => {
                const row = blankRow();
                saveRows([...rows, row]);
                persistRow(row);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-xs font-black uppercase"
              style={{ background: VERDE, color: ROSA }}
            >
              <Plus size={15} /> Novo produto
            </button>
          </div>

          {viewMode === "sheet" && (
          <div className="mt-4 overflow-x-auto rounded-2xl" style={{ border: `1px solid ${VERDE}10` }}>
            <table className="w-full min-w-[1380px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[104px]" />
                <col className="w-[230px]" />
                <col className="w-[120px]" />
                <col className="w-[92px]" />
                <col className="w-[92px]" />
                <col className="w-[92px]" />
                <col className="w-[104px]" />
                <col className="w-[104px]" />
                <col className="w-[104px]" />
                <col className="w-[88px]" />
                <col className="w-[124px]" />
                <col className="w-[112px]" />
                <col className="w-[220px]" />
              </colgroup>
              <thead className="bg-white text-[10px] uppercase tracking-widest opacity-55">
                <tr>
                  <th className="px-3 py-3 whitespace-nowrap">Foto</th>
                  <th className="px-3 py-3 whitespace-nowrap">Produto</th>
                  <th className="px-3 py-3 whitespace-nowrap">Tipo</th>
                  <th className="px-3 py-3 whitespace-nowrap text-right">Custo base</th>
                  <th className="px-3 py-3 whitespace-nowrap text-right">Batata</th>
                  <th className="px-3 py-3 whitespace-nowrap text-right">Bebida</th>
                  <th className="px-3 py-3 whitespace-nowrap text-right">Custo/un</th>
                  <th className="px-3 py-3 whitespace-nowrap text-right">Venda</th>
                  <th className="px-3 py-3 whitespace-nowrap text-right">Lucro/un</th>
                  <th className="px-3 py-3 whitespace-nowrap text-right">CMV</th>
                  <th className="px-3 py-3 whitespace-nowrap text-right">Recomendado</th>
                  <th className="px-3 py-3 whitespace-nowrap">Status</th>
                  <th className="sticky right-0 z-10 px-3 py-3 whitespace-nowrap bg-white">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: `${VERDE}10` }}>
                {filtered.map((row) => (
                  <PricingTableRow
                    key={row.id}
                    row={row}
                    editing={editingId === row.id}
                    draft={draft}
                    setDraft={setDraft}
                    onEdit={() => startEdit(row)}
                    onSave={saveDraft}
                    onDuplicate={() => duplicateRow(row)}
                    onToggle={() => toggleActive(row)}
                    onDelete={() => {
                      const next = rows.filter((item) => item.id !== row.id);
                      saveRows(next);
                      if (API_URL) deletePricingProduct(API_URL, adminToken, row.id).catch(() => setSyncError("Nao foi possivel remover no backend."));
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
          )}

          {viewMode === "cards" && (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((row) => (
              <PricingCard
                key={row.id}
                row={row}
                onEdit={() => {
                  setViewMode("sheet");
                  startEdit(row);
                }}
                onDuplicate={() => duplicateRow(row)}
                onToggle={() => toggleActive(row)}
                onDelete={() => {
                  const next = rows.filter((item) => item.id !== row.id);
                  saveRows(next);
                  if (API_URL) deletePricingProduct(API_URL, adminToken, row.id).catch(() => setSyncError("Nao foi possivel remover no backend."));
                }}
              />
            ))}
          </div>
          )}
        </div>

        <div className="grid gap-4">
          <Panel title="Combos com bebida" icon={PackageSearch}>
            <div className="grid gap-3">
              {calculated.filter((row) => row.kind === "combo").map((row) => (
                <ComboLine key={row.id} row={row} />
              ))}
            </div>
          </Panel>

          <Panel title="Simulador rapido" icon={Calculator}>
            <Simulator rows={calculated} />
          </Panel>

          <Panel title="Alertas automaticos" icon={AlertTriangle}>
            <div className="grid gap-2">
              {calculated.filter((row) => row.status === "ruim").map((row) => (
                <div key={row.id} className="rounded-2xl p-3 text-xs font-black" style={{ background: "#FEF2F2", color: "#991B1B" }}>
                  {row.name}: Produto com margem baixa. Reavaliar preco de venda ou custo de producao.
                </div>
              ))}
              {calculated.every((row) => row.status !== "ruim") && (
                <div className="rounded-2xl p-3 text-xs font-black" style={{ background: "#ECFDF5", color: "#065F46" }}>
                  Nenhum produto em margem ruim.
                </div>
              )}
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function PricingTableRow({
  row,
  editing,
  draft,
  setDraft,
  onEdit,
  onSave,
  onDuplicate,
  onToggle,
  onDelete,
}: {
  row: CalculatedPricingRow;
  editing: boolean;
  draft: PricingRow | null;
  setDraft: (row: PricingRow) => void;
  onEdit: () => void;
  onSave: () => void;
  onDuplicate: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const current = editing && draft ? draft : row;
  return (
    <tr className="align-middle hover:bg-[#FFF8F2]">
      <td className="px-3 py-4">
        <ProductThumb
          row={current}
          editable={editing}
          onUpload={(imageUrl) => setDraft({ ...current, imageUrl })}
        />
      </td>
      <td className="px-3 py-4">
        {editing ? (
          <div className="grid gap-2">
            <EditField value={current.name} onChange={(name) => setDraft({ ...current, name })} />
            <EditField value={current.imageUrl ?? ""} onChange={(imageUrl) => setDraft({ ...current, imageUrl })} placeholder="URL da foto" />
          </div>
        ) : (
          <>
            <p className="line-clamp-2 font-black leading-tight">{row.name}</p>
            <p className="mt-1 text-[10px] font-black uppercase opacity-50">{row.code}</p>
          </>
        )}
      </td>
      <td className="px-3 py-4 whitespace-nowrap">{labelKind(row.kind)}</td>
      <td className="px-3 py-4 text-right"><MoneyCell row={current} field="baseCost" editing={editing} setDraft={setDraft} /></td>
      <td className="px-3 py-4 text-right"><MoneyCell row={current} field="friesCost" editing={editing} setDraft={setDraft} /></td>
      <td className="px-3 py-4 text-right"><MoneyCell row={current} field="defaultDrinkCost" editing={editing} setDraft={setDraft} /></td>
      <td className="px-3 py-4 whitespace-nowrap text-right font-black">{fmt(row.totalCost)}</td>
      <td className="px-3 py-4 text-right"><MoneyCell row={current} field="salePrice" editing={editing} setDraft={setDraft} /></td>
      <td className="px-3 py-4 whitespace-nowrap text-right font-black">{fmt(row.grossProfit)}</td>
      <td className="px-3 py-4 whitespace-nowrap text-right font-black">{percent(row.cmv)}</td>
      <td className="px-3 py-4 whitespace-nowrap text-right font-black">{fmt(row.recommendedPrice)}</td>
      <td className="px-3 py-4"><StatusPill status={row.status} /></td>
      <td className="sticky right-0 bg-white px-3 py-4 shadow-[-12px_0_18px_rgba(255,255,255,0.92)]">
        <div className="flex items-center gap-2 whitespace-nowrap">
          {editing ? (
            <ActionButton onClick={onSave} tone="save">Salvar preco</ActionButton>
          ) : (
            <ActionButton onClick={onEdit}><Pencil size={14} /></ActionButton>
          )}
          <ActionButton onClick={onDuplicate}>Duplicar</ActionButton>
          <ActionButton onClick={onToggle}>{row.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}</ActionButton>
          <ActionButton onClick={onDelete}>Remover</ActionButton>
        </div>
      </td>
    </tr>
  );
}

function PricingCard({
  row,
  onEdit,
  onDuplicate,
  onToggle,
  onDelete,
}: {
  row: CalculatedPricingRow;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-3xl" style={{ border: `1px solid ${ROSA}`, background: "#FFF8F2" }}>
      <div className="relative h-44 bg-white">
        {row.imageUrl ? (
          <img src={row.imageUrl} alt={row.name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center" style={{ color: `${VERDE}55` }}>
            <ImageIcon size={38} />
          </div>
        )}
      </div>
      <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-black">{row.name}</p>
          <p className="mt-1 text-[10px] font-black uppercase opacity-50">{row.code} · {labelKind(row.kind)}</p>
        </div>
        <StatusPill status={row.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Info label="Preco" value={fmt(row.salePrice)} />
        <Info label="Custo/un" value={fmt(row.totalCost)} />
        <Info label="Lucro/un" value={fmt(row.grossProfit)} />
        <Info label="CMV" value={percent(row.cmv)} />
        <Info label="Preco recomendado" value={fmt(row.recommendedPrice)} />
      </div>
      <div className="mt-3 flex gap-2">
        <ActionButton onClick={onEdit}>Editar</ActionButton>
        <ActionButton onClick={onDuplicate}>Duplicar</ActionButton>
        <ActionButton onClick={onToggle}>{row.active ? "Ativo" : "Inativo"}</ActionButton>
        <ActionButton onClick={onDelete}>Remover</ActionButton>
      </div>
      </div>
    </div>
  );
}

function Simulator({ rows }: { rows: CalculatedPricingRow[] }) {
  const [productId, setProductId] = useState(rows[0]?.id ?? "");
  const selected = rows.find((row) => row.id === productId) ?? rows[0];
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  if (!selected) return null;
  const simulatedPrice = Number(price || selected.salePrice);
  const simulatedCost = Number(cost || selected.totalCost);
  const simulatedProfit = simulatedPrice - simulatedCost;
  const simulatedCmv = simulatedPrice > 0 ? simulatedCost / simulatedPrice : 0;

  return (
    <div className="grid gap-3">
      <select
        value={selected.id}
        onChange={(event) => setProductId(event.target.value)}
        className="min-h-11 rounded-2xl px-3 text-sm font-black outline-none"
        style={{ border: `1.5px solid ${VERDE}18`, color: VERDE }}
      >
        {rows.map((row) => (
          <option key={row.id} value={row.id}>{row.name}</option>
        ))}
      </select>
      <div className="grid gap-2 sm:grid-cols-2">
        <EditField value={price} onChange={setPrice} placeholder={`Preco atual ${fmt(selected.salePrice)}`} />
        <EditField value={cost} onChange={setCost} placeholder={`Custo atual ${fmt(selected.totalCost)}`} />
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <Info label="Custo/un simulado" value={fmt(simulatedCost)} />
        <Info label="Lucro/un simulado" value={fmt(simulatedProfit)} />
        <Info label="CMV simulado" value={percent(simulatedCmv)} />
        <Info label="Dif. lucro" value={fmt(simulatedProfit - selected.grossProfit)} />
      </div>
    </div>
  );
}

function ComboLine({ row }: { row: CalculatedPricingRow }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "#FFF8F2", border: `1px solid ${VERDE}12` }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black">{row.name}</p>
          <p className="mt-1 text-xs font-bold opacity-60">
            Guarana: custo {fmt(row.totalCost)} · venda {fmt(row.salePrice)}
          </p>
          <p className="mt-1 text-xs font-bold opacity-60">
            Coca: custo {fmt(row.baseCost + row.friesCost + row.alternativeDrinkCost)} · venda {fmt(row.priceWithAlternativeDrink)}
          </p>
        </div>
        <StatusPill status={row.status} />
      </div>
    </div>
  );
}

function calculateRow(row: PricingRow): CalculatedPricingRow {
  const totalCost =
    row.kind === "combo"
      ? row.baseCost + row.friesCost + row.defaultDrinkCost
      : row.baseCost;
  const priceWithAlternativeDrink =
    row.kind === "combo" ? row.salePrice + row.drinkSurcharge : row.salePrice;
  const grossProfit = row.salePrice - totalCost;
  const cmv = row.salePrice > 0 ? totalCost / row.salePrice : 0;
  const grossMargin = row.salePrice > 0 ? grossProfit / row.salePrice : 0;
  const recommendedPrice = roundCommercial(totalCost / Math.max(row.targetCmv, 0.01));
  return {
    ...row,
    totalCost,
    priceWithAlternativeDrink,
    grossProfit,
    cmv,
    grossMargin,
    recommendedPrice,
    status: cmv <= 0.35 ? "saudavel" : cmv <= 0.4 ? "atencao" : "ruim",
  };
}

function simple(id: string, code: string, name: string, category: string, baseCost: number, salePrice: number): PricingRow {
  return baseRow({ id, code, name, category, kind: "sandwich", baseCost, salePrice, ...catalogDefaults(id) });
}

function combo(
  id: string,
  code: string,
  name: string,
  baseCost: number,
  salePrice: number,
  defaultDrinkCost = 2.89,
  alternativeDrinkCost = 3.89,
): PricingRow {
  return baseRow({
    id,
    code,
    name,
    category: "Combo",
    kind: "combo",
    baseCost,
    friesCost: 3.7,
    defaultDrinkCost,
    alternativeDrinkCost,
    drinkSurcharge: 2,
    salePrice,
    ...catalogDefaults(id),
  });
}

function side(id: string, code: string, name: string, baseCost: number, salePrice: number, category = "Extras"): PricingRow {
  return baseRow({ id, code, name, category, kind: "side", baseCost, salePrice, ...catalogDefaults(id) });
}

function drink(id: string, code: string, name: string, baseCost: number, salePrice: number, drinkSurcharge = 0): PricingRow {
  return baseRow({ id, code, name, category: "Bebidas", kind: "drink", baseCost, salePrice, drinkSurcharge, ...catalogDefaults(id) });
}

function baseRow(input: Partial<PricingRow> & Pick<PricingRow, "id" | "code" | "name" | "category" | "kind" | "baseCost" | "salePrice">): PricingRow {
  return {
    friesCost: 0,
    defaultDrinkCost: 0,
    alternativeDrinkCost: 0,
    drinkSurcharge: 0,
    targetCmv: 0.35,
    active: true,
    notes: "",
    imageUrl: "",
    originalPrice: undefined,
    updatedAt: new Date().toISOString(),
    ...input,
  };
}

function catalogDefaults(id: string) {
  const item = MENU_ITEMS.find((product) => product.id === id);
  return {
    imageUrl:
      id === "triple-combo"
        ? "/menu/supercombomnfis.png"
        : item?.image ? imageSrc(item.image) : "",
    originalPrice: item?.originalPrice,
  };
}

function blankRow(): PricingRow {
  return baseRow({
    id: `produto-${Date.now()}`,
    code: "NOVO",
    name: "Novo produto",
    category: "Burgers",
    kind: "sandwich",
    baseCost: 0,
    salePrice: 0,
  });
}

function normalizePricingCategory(row: PricingRow): PricingCategoryFilter {
  const value = `${row.category} ${row.kind}`.toLowerCase();
  if (value.includes("sweet") || value.includes("doce") || value.includes("caixinha")) return "Sweet";
  if (value.includes("bebida") || row.kind === "drink") return "Bebidas";
  if (value.includes("fries") || value.includes("frita") || value.includes("batata")) return "Fries";
  if (value.includes("extra") || value.includes("acompanhamento") || value.includes("nuggets") || row.kind === "side") return "Extras";
  return "Burgers";
}

function buildCategorySummaries(rows: CalculatedPricingRow[]) {
  const categories: PricingCategoryFilter[] = ["Burgers", "Bebidas", "Fries", "Extras", "Sweet"];
  return categories.map((category) => {
    const scoped = rows.filter((row) => normalizePricingCategory(row) === category);
    const revenue = scoped.reduce((sum, row) => sum + row.salePrice, 0);
    const cost = scoped.reduce((sum, row) => sum + row.totalCost, 0);
    return {
      category,
      cmv: revenue > 0 ? cost / revenue : 0,
    };
  });
}

function loadRows() {
  if (typeof window === "undefined") return DEFAULT_ROWS;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) && stored.length
      ? stored.map(canonicalPricingRow)
      : DEFAULT_ROWS;
  } catch {
    return DEFAULT_ROWS;
  }
}

function canonicalPricingRow(row: PricingRow): PricingRow {
  return row.id === "triple-combo"
    ? { ...row, imageUrl: "/menu/supercombomnfis.png" }
    : row;
}

function roundCommercial(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil((value + 0.01) / 1) - 0.1;
}

function average(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
}

function percent(value: number) {
  return `${(value * 100).toFixed(2).replace(".", ",")}%`;
}

function labelKind(kind: PricingKind) {
  if (kind === "combo") return "Combo";
  if (kind === "side") return "Acompanhamento";
  if (kind === "drink") return "Bebida";
  return "Sanduiche";
}

function statusLabel(status: PricingStatus) {
  if (status === "saudavel") return "Saudavel";
  if (status === "atencao") return "Atencao";
  return "Ruim";
}

function Metric({ title, value, help, icon: Icon }: { title: string; value: string; help: string; icon: ElementType }) {
  return (
    <div className="rounded-3xl bg-white p-4" style={{ border: `1px solid ${ROSA}` }}>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `${ROSA}55`, color: VERDE }}>
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{title}</p>
          <p className="truncate text-xl font-black">{value}</p>
          <p className="text-xs font-bold opacity-55">{help}</p>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${alert ? "#EF4444" : `${VERDE}12`}` }}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-45">{label}</p>
      <p className="mt-1 text-2xl font-black" style={{ color: alert ? "#991B1B" : VERDE }}>{value}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: ElementType; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-4" style={{ border: `1px solid ${ROSA}` }}>
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl" style={{ background: `${ROSA}55`, color: VERDE }}>
          <Icon size={17} />
        </span>
        <h3 className="text-sm font-black uppercase">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function FilterButton({
  active,
  onClick,
  children,
  icon: Icon = Filter,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  icon?: ElementType;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center gap-2 rounded-2xl px-4 text-xs font-black uppercase"
      style={{ background: active ? VERDE : "#FFF8F2", color: active ? ROSA : VERDE, border: `1px solid ${VERDE}14` }}
    >
      <Icon size={13} /> {children}
    </button>
  );
}

function ProductThumb({
  row,
  editable = false,
  onUpload,
}: {
  row: PricingRow;
  editable?: boolean;
  onUpload?: (imageUrl: string) => void;
}) {
  const content = (
    <>
      {row.imageUrl ? (
        <img src={row.imageUrl} alt={row.name} className="h-full w-full object-cover" />
      ) : (
        <ImageIcon size={18} style={{ color: `${VERDE}55` }} />
      )}
      {editable && (
        <span
          className="absolute inset-x-1 bottom-1 rounded-lg px-1 py-0.5 text-center text-[8px] font-black uppercase"
          style={{ background: "rgba(255,255,255,0.92)", color: VERDE }}
        >
          Upload
        </span>
      )}
    </>
  );
  const className = "relative grid h-16 w-24 place-items-center overflow-hidden rounded-xl bg-white";
  const style = { border: `1px solid ${VERDE}10` };
  if (!editable) {
    return (
      <div className={className} style={style}>
        {content}
      </div>
    );
  }
  return (
    <label className={`${className} cursor-pointer`} style={style} title="Enviar nova imagem">
      {content}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.currentTarget.value = "";
          if (!file) return;
          void encodePricingImage(file).then((imageUrl) => onUpload?.(imageUrl));
        }}
      />
    </label>
  );
}

function StatusPill({ status }: { status: PricingStatus }) {
  const color = status === "saudavel" ? "#065F46" : status === "atencao" ? "#92400E" : "#991B1B";
  const bg = status === "saudavel" ? "#ECFDF5" : status === "atencao" ? "#FEF3C7" : "#FEF2F2";
  return (
    <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase" style={{ background: bg, color }}>
      {statusLabel(status)}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "#fff", border: `1px solid ${VERDE}10` }}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-45">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function EditField({ value, onChange, placeholder }: { value: string | number; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-10 w-full rounded-xl px-3 text-sm font-bold outline-none"
      style={{ border: `1.5px solid ${VERDE}18`, color: VERDE }}
    />
  );
}

function MoneyCell({
  row,
  field,
  editing,
  setDraft,
}: {
  row: PricingRow;
  field: keyof Pick<PricingRow, "baseCost" | "friesCost" | "defaultDrinkCost" | "salePrice">;
  editing: boolean;
  setDraft: (row: PricingRow) => void;
}) {
  const [rawValue, setRawValue] = useState(() => moneyInputValue(row[field]));

  useEffect(() => {
    if (editing) setRawValue(moneyInputValue(row[field]));
  }, [editing, field, row.id, row[field]]);

  if (!editing) return <span className="inline-block min-w-20 whitespace-nowrap font-black tabular-nums">{fmt(Number(row[field]))}</span>;
  return (
    <MoneyInput
      value={rawValue}
      onChange={(value) => {
        setRawValue(value);
        const parsed = parseMoneyInput(value);
        if (parsed !== null) {
          setDraft({ ...row, [field]: parsed });
        }
      }}
      onBlur={() => {
        const parsed = parseMoneyInput(rawValue) ?? 0;
        setRawValue(moneyInputValue(parsed));
        setDraft({ ...row, [field]: parsed });
      }}
    />
  );
}

function MoneyInput({
  value,
  onChange,
  onBlur,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <input
      value={value}
      onChange={(event) => {
        const next = event.target.value;
        if (/^\d{0,6}([,.]\d{0,2})?$/.test(next)) {
          onChange(next);
        }
      }}
      onBlur={onBlur}
      inputMode="decimal"
      className="min-h-11 w-24 rounded-2xl px-3 text-right text-sm font-black outline-none tabular-nums"
      style={{ border: `1.5px solid ${VERDE}18`, color: VERDE, background: "#fff" }}
    />
  );
}

function parseMoneyInput(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized || normalized === "." || normalized.endsWith(".")) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function moneyInputValue(value: number | string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return String(numeric).replace(".", ",");
}

function encodePricingImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("image_read_failed"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("image_load_failed"));
      image.onload = () => {
        const maxWidth = 1200;
        const scale = Math.min(1, maxWidth / image.width);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("canvas_unavailable"));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      image.src = String(reader.result ?? "");
    };
    reader.readAsDataURL(file);
  });
}

function ActionButton({ onClick, children, tone = "default" }: { onClick: () => void; children: ReactNode; tone?: "default" | "save" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1 rounded-xl px-3 text-[10px] font-black uppercase"
      style={{
        background: tone === "save" ? VERDE : `${ROSA}45`,
        color: tone === "save" ? ROSA : VERDE,
        border: `1px solid ${tone === "save" ? VERDE : `${VERDE}12`}`,
      }}
    >
      {children}
    </button>
  );
}
