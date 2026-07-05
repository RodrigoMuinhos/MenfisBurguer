import {
  AlertTriangle,
  BellRing,
  Boxes,
  ChefHat,
  ClipboardList,
  DollarSign,
  MessageCircle,
  PackageSearch,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";
import { Order } from "@/types/order";
import { MENU_ITEMS } from "@/features/catalog/menu";
import { ROSA, VERDE } from "@/utils/theme";
import { Movement, StockItem, getStatus } from "../EstoqueView";
import { CrmCustomer } from "./CustomersCrmView";
import { MENU_STOCK_MAP, SupportTicket, fmt, isBillableOrder } from "../shared";
import type { PricingRow } from "./PricingView";

type ProductStat = {
  id: string;
  name: string;
  qty: number;
  revenue: number;
  cost: number;
  margin: number;
  cmv: number;
};

type StockIndex = {
  byId: Map<string, StockItem>;
  byKey: Map<string, StockItem>;
};

const LEGACY_STOCK_ALIASES: Record<string, string[]> = {
  "1": ["pao brioche", "pão brioche"],
  "2": ["carne 70/30", "carne", "adicional de carne"],
  "3": ["alface"],
  "4": ["queijo", "extra queijo"],
  "5": ["coca-cola zero", "coca cola zero", "coca-cola", "coca cola"],
  "6": ["batata frita", "batata"],
  "7": ["molho menfi's", "molho menfis", "maionese alho frito", "maionese barbecue", "maionese"],
  "8": ["filé de frango empanado", "file de frango empanado", "adicional de frango", "frango"],
  "9": ["bacon", "adicional de bacon"],
  "10": ["cheddar", "adicional de cheddar"],
  "11": ["ovo"],
  "12": ["guaraná zero", "guarana zero", "guaraná", "guarana"],
  "13": ["água com gás", "agua com gas", "água", "agua"],
};

const PRODUCT_ID_ALIASES: Record<string, string> = {
  "combo-menfis": "combo",
  "combo-menfis-bacon": "bacon-combo",
  "combo-menfis-chicken": "chicken-combo",
  "super-combo-menfis": "combo2",
  "super-combo-menfis-bacon": "bacon-super-combo",
  "super-combo-menfis-chicken": "chicken-super-combo",
  "combo-coca-adicional": "coca-zero",
  "extra-maionese-alho-frito": "extra-molho",
  "extra-maionese-barbecue": "extra-molho",
  "coca-zero": "cola",
};

const DASHBOARD_STOCK_MAP: Record<string, Array<{ stockId: string; qty: number }>> = {
  "double-burger": [
    { stockId: "1", qty: 1 },
    { stockId: "2", qty: 0.2 },
    { stockId: "3", qty: 0.5 },
    { stockId: "4", qty: 2 },
    { stockId: "7", qty: 30 },
  ],
  "double-combo": [
    { stockId: "1", qty: 1 },
    { stockId: "2", qty: 0.2 },
    { stockId: "3", qty: 0.5 },
    { stockId: "4", qty: 2 },
    { stockId: "7", qty: 30 },
    { stockId: "5", qty: 1 },
    { stockId: "6", qty: 0.25 },
  ],
  "extra-ovo": [{ stockId: "11", qty: 1 }],
  "guarana-zero": [{ stockId: "12", qty: 1 }],
  "agua-com-gas": [{ stockId: "13", qty: 1 }],
};

const DEFAULT_PRICING_COSTS: Record<string, number> = {
  burger: 7.5,
  "double-burger": 12,
  "menfis-chicken": 6.3,
  "double-menfis-chicken": 9.8,
  "menfis-bacon": 9.8,
  "double-menfis-bacon": 14.7,
  batata: 3.7,
  "guarana-zero": 2.89,
  "coca-zero": 3.89,
  combo: 14.09,
  "double-combo": 18.59,
  "chicken-combo": 12.89,
  "double-chicken-combo": 16.39,
  "bacon-combo": 16.39,
  "double-bacon-combo": 21.29,
  combo2: 24.48,
  "bacon-super-combo": 29.08,
  "chicken-super-combo": 22.08,
};

export function DashboardView({
  orders,
  stockItems = [],
  stockMovements = [],
  customers = [],
  supportTickets = [],
}: {
  orders: Order[];
  stockItems?: StockItem[];
  stockMovements?: Movement[];
  customers?: CrmCustomer[];
  supportTickets?: SupportTicket[];
}) {
  const billableOrders = orders.filter(isBillableOrder);
  const activeOrders = orders.filter(
    (order) => !["DELIVERED", "CANCELLED"].includes(order.status),
  );
  const revenue = billableOrders.reduce((sum, order) => sum + order.total, 0);
  const avgTicket = billableOrders.length ? revenue / billableOrders.length : 0;
  const productStats = buildProductStats(billableOrders, stockItems);
  const topProduct = productStats[0];
  const totalEstimatedCost = productStats.reduce((sum, item) => sum + item.cost, 0);
  const totalCmv = revenue > 0 ? totalEstimatedCost / revenue : 0;
  const lowStock = stockItems.filter((item) => ["baixo", "zerado"].includes(getStatus(item)));
  const stockValue = stockItems.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
  const outgoingToday = stockMovements.filter(
    (movement) =>
      movement.type === "saida" &&
      new Date(movement.timestamp).toDateString() === new Date().toDateString(),
  ).length;
  const openTickets = supportTickets.filter((ticket) => ticket.status !== "RESOLVED");
  const vipCustomers = [...customers]
    .sort((a, b) => Number(b.total_spent ?? 0) - Number(a.total_spent ?? 0))
    .slice(0, 4);
  const crmAudience = customers.filter((customer) => Number(customer.order_count ?? 0) > 0);
  const inactiveCustomers = customers.filter((customer) => isInactive(customer.last_order_at));

  return (
    <div className="mx-auto grid max-w-[1600px] gap-5 text-[#65001F]">
      <section
        className="rounded-3xl p-5"
        style={{
          background: VERDE,
          color: "#fff",
          boxShadow: "0 18px 44px rgba(101,0,31,0.18)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: ROSA }}>
              Central ADM Menfi's
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-wide">
              Operação, vendas, estoque e CRM
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold opacity-75">
              Visão desktop para decidir rápido: quem mais pede, o que mais sai,
              CMV estimado por produto, alertas de estoque e ações de atendimento.
            </p>
          </div>
          <div className="grid min-w-[320px] grid-cols-2 gap-3">
            <HeroMetric label="Pedidos ativos" value={String(activeOrders.length)} icon={ClipboardList} />
            <HeroMetric label="Produto líder" value={topProduct?.name ?? "-"} icon={ChefHat} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-4">
        <AdminMetric label="Faturamento" value={fmt(revenue)} sub={`${billableOrders.length} pedidos pagos`} icon={DollarSign} />
        <AdminMetric label="Ticket médio" value={fmt(avgTicket)} sub="por pedido vendido" icon={TrendingUp} />
        <AdminMetric label="CMV estimado" value={`${Math.round(totalCmv * 100)}%`} sub={`${fmt(totalEstimatedCost)} em insumos`} icon={PackageSearch} />
        <AdminMetric label="Clientes CRM" value={String(customers.length)} sub={`${crmAudience.length} com histórico`} icon={Users} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <Panel title="Produtos que mais saem" icon={TrendingUp}>
          <div className="grid gap-3">
            {productStats.slice(0, 7).map((product, index) => (
              <ProductRow key={product.id} product={product} rank={index + 1} />
            ))}
            {productStats.length === 0 && (
              <EmptyState text="Ainda não há pedidos faturados para calcular ranking." />
            )}
          </div>
        </Panel>

        <Panel title="CMV por produto" icon={PackageSearch}>
          <div className="grid gap-3">
            {productStats.slice(0, 6).map((product) => (
              <CmvRow key={product.id} product={product} />
            ))}
            {productStats.length === 0 && (
              <EmptyState text="Cadastre custos no estoque para ver o CMV." />
            )}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Panel title="Estoque inteligente" icon={Boxes}>
          <div className="grid gap-3">
            <MiniMetric label="Valor em estoque" value={fmt(stockValue)} />
            <MiniMetric label="Alertas de ruptura" value={String(lowStock.length)} />
            <MiniMetric label="Saídas hoje" value={String(outgoingToday)} />
            <div className="mt-1 grid gap-2">
              {lowStock.slice(0, 5).map((item) => (
                <AlertLine
                  key={item.id}
                  title={item.name}
                  copy={`${formatQty(item.qty, item.unit)} disponível · mínimo ${formatQty(item.minQty, item.unit)}`}
                />
              ))}
              {lowStock.length === 0 && <EmptyState text="Nenhum item abaixo do mínimo." />}
            </div>
          </div>
        </Panel>

        <Panel title="Atendimento" icon={BellRing}>
          <div className="grid gap-3">
            <MiniMetric label="Chamados abertos" value={String(openTickets.length)} />
            <MiniMetric label="Pedidos em andamento" value={String(activeOrders.length)} />
            <MiniMetric
              label="Aguardando pagamento"
              value={String(orders.filter((order) => order.status === "PAYMENT_PENDING").length)}
            />
            {openTickets.slice(0, 4).map((ticket) => (
              <AlertLine
                key={ticket.id}
                title={`Pedido ${ticket.orderId}`}
                copy={`${ticket.reason} · ${ticket.status}`}
              />
            ))}
          </div>
        </Panel>

        <Panel title="CRM inteligente" icon={MessageCircle}>
          <div className="grid gap-3">
            <MiniMetric label="Base para disparo" value={String(crmAudience.length)} />
            <MiniMetric label="Inativos 30+ dias" value={String(inactiveCustomers.length)} />
            <a
              href={buildCampaignWhatsappUrl(inactiveCustomers)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase"
              style={{ background: VERDE, color: ROSA }}
            >
              <Send size={15} />
              Disparo de reativação
            </a>
            <div className="grid gap-2">
              {vipCustomers.map((customer) => (
                <CustomerLine key={customer.id} customer={customer} />
              ))}
              {vipCustomers.length === 0 && <EmptyState text="Clientes aparecerão após pedidos." />}
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function buildProductStats(orders: Order[], stockItems: StockItem[]): ProductStat[] {
  const productNames = new Map(MENU_ITEMS.map((item) => [item.id, item.name]));
  const stockIndex = buildStockIndex(stockItems);
  const pricingCosts = loadPricingCosts();
  const byProduct = new Map<string, ProductStat>();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const productId = normalizeProductId(item.productId ?? item.id);
      const qty = Number(item.qty ?? 0);
      const revenue = Number(item.price ?? 0) * qty;
      const baseCost = pricingCosts.get(productId) ?? estimateProductUnitCost(productId, stockIndex);
      const costUnit =
        baseCost +
        estimateAddonUnitCost(item.addonIds, stockIndex) +
        (item.addonIds?.length ? 0 : estimateComponentUnitCost(item.components, stockIndex));
      const current = byProduct.get(productId) ?? {
        id: productId,
        name: productNames.get(productId) ?? item.name,
        qty: 0,
        revenue: 0,
        cost: 0,
        margin: 0,
        cmv: 0,
      };
      current.qty += qty;
      current.revenue += revenue;
      current.cost += costUnit * qty;
      current.margin = current.revenue - current.cost;
      current.cmv = current.revenue > 0 ? current.cost / current.revenue : 0;
      byProduct.set(productId, current);
    });
  });

  return [...byProduct.values()].sort((a, b) => b.qty - a.qty);
}

function loadPricingCosts() {
  const costs = new Map(Object.entries(DEFAULT_PRICING_COSTS));
  if (typeof window === "undefined") return costs;
  try {
    const rows = JSON.parse(localStorage.getItem("menfis_pricing_table_v1") ?? "[]") as PricingRow[];
    if (!Array.isArray(rows)) return costs;
    rows.forEach((row) => {
      const productId = normalizeProductId(row.id);
      const cost = row.kind === "combo"
        ? Number(row.baseCost ?? 0) + Number(row.friesCost ?? 0) + Number(row.defaultDrinkCost ?? 0)
        : Number(row.baseCost ?? 0);
      costs.set(productId, cost);
    });
  } catch {
    return costs;
  }
  return costs;
}

function normalizeProductId(value: string) {
  const normalized = normalizeKey(value.replace(/^quick-/, ""));
  return PRODUCT_ID_ALIASES[normalized] ?? normalized;
}

function estimateProductUnitCost(productId: string, stockIndex: StockIndex) {
  const recipe = MENU_STOCK_MAP[productId] ?? DASHBOARD_STOCK_MAP[productId] ?? [];
  return recipe.reduce((sum, ingredient) => {
    const stock = findStockItem(ingredient.stockId, stockIndex);
    return sum + Number(stock?.unitCost ?? 0) * ingredient.qty;
  }, 0);
}

function estimateAddonUnitCost(addonIds: string[] | undefined, stockIndex: StockIndex) {
  return (addonIds ?? []).reduce(
    (sum, addonId) => sum + estimateProductUnitCost(normalizeProductId(addonId), stockIndex),
    0,
  );
}

function estimateComponentUnitCost(components: string[] | undefined, stockIndex: StockIndex) {
  return (components ?? []).reduce((sum, component) => {
    const productId = productIdFromComponent(component);
    if (!productId) return sum;
    return sum + estimateProductUnitCost(productId, stockIndex);
  }, 0);
}

function productIdFromComponent(component: string) {
  const key = normalizeKey(component);
  if (key.includes("adicional de carne")) return "extra-carne";
  if (key.includes("adicional de frango")) return "extra-frango";
  if (key.includes("adicional de bacon")) return "extra-bacon";
  if (key.includes("adicional de cheddar")) return "extra-cheddar";
  if (key.includes("extra queijo")) return "extra-queijo";
  if (key === "ovo" || key.includes(" ovo")) return "extra-ovo";
  return undefined;
}

function buildStockIndex(stockItems: StockItem[]): StockIndex {
  const byId = new Map(stockItems.map((item) => [item.id, item]));
  const byKey = new Map<string, StockItem>();

  stockItems.forEach((item) => {
    const keys = [item.id, item.name];
    Object.entries(LEGACY_STOCK_ALIASES).forEach(([legacyId, aliases]) => {
      if (item.id === legacyId || aliases.some((alias) => normalizeKey(item.name).includes(normalizeKey(alias)))) {
        keys.push(legacyId, ...aliases);
      }
    });
    keys.forEach((key) => {
      byKey.set(normalizeKey(key), item);
    });
  });

  return { byId, byKey };
}

function findStockItem(stockId: string, stockIndex: StockIndex) {
  const direct = stockIndex.byId.get(stockId) ?? stockIndex.byKey.get(normalizeKey(stockId));
  if (direct) return direct;

  const aliases = LEGACY_STOCK_ALIASES[stockId] ?? [];
  for (const alias of aliases) {
    const byAlias = stockIndex.byKey.get(normalizeKey(alias));
    if (byAlias) return byAlias;
  }
  return undefined;
}

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function isInactive(lastOrderAt?: string) {
  if (!lastOrderAt) return false;
  const days = (Date.now() - new Date(lastOrderAt).getTime()) / 86400000;
  return days >= 30;
}

function buildCampaignWhatsappUrl(customers: CrmCustomer[]) {
  const first = customers.find((customer) => customer.phone);
  const phone = String(first?.phone ?? "5585997883764").replace(/\D/g, "");
  const text = encodeURIComponent(
    "Oi! Sentimos sua falta na Menfi's. Hoje temos combos quentinhos e um atendimento rápido para você pedir de novo. 🍔",
  );
  return `https://wa.me/${phone || "5585997883764"}?text=${text}`;
}

function HeroMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2">
        <Icon size={17} strokeWidth={2.4} style={{ color: ROSA }} />
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: ROSA }}>
          {label}
        </p>
      </div>
      <p className="mt-2 line-clamp-1 text-lg font-black">{value}</p>
    </div>
  );
}

function AdminMetric({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
}) {
  return (
    <article className="rounded-3xl bg-white p-5" style={{ border: `1px solid ${VERDE}12` }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${ROSA}80` }}>
          <Icon size={18} strokeWidth={2.4} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold opacity-55">{sub}</p>
    </article>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-5" style={{ border: `1px solid ${VERDE}12` }}>
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${ROSA}70` }}>
          <Icon size={18} strokeWidth={2.4} />
        </span>
        <h2 className="text-sm font-black uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ProductRow({ product, rank }: { product: ProductStat; rank: number }) {
  const max = Math.max(product.qty, 1);
  return (
    <div className="grid gap-2 rounded-2xl p-3" style={{ background: "#FFF8F2" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase">
            #{rank} {product.name}
          </p>
          <p className="text-[11px] font-bold opacity-55">
            {product.qty} vendidos · {fmt(product.revenue)}
          </p>
        </div>
        <p className="text-sm font-black">{fmt(product.margin)}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, (product.qty / max) * 100)}%`, background: VERDE }}
        />
      </div>
    </div>
  );
}

function CmvRow({ product }: { product: ProductStat }) {
  const cmv = Math.round(product.cmv * 100);
  return (
    <div className="rounded-2xl p-3" style={{ background: "#FFF8F2" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-xs font-black uppercase">{product.name}</p>
        <p className="text-sm font-black">{cmv}%</p>
      </div>
      <p className="mt-1 text-[11px] font-bold opacity-55">
        Custo {fmt(product.cost)} · Venda {fmt(product.revenue)}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(cmv, 100)}%`, background: cmv > 35 ? "#DC2626" : VERDE }}
        />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "#FFF8F2" }}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-45">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function AlertLine({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl p-3" style={{ background: "#FEF2F2", color: "#991B1B" }}>
      <AlertTriangle className="mt-0.5 shrink-0" size={16} strokeWidth={2.4} />
      <div className="min-w-0">
        <p className="text-xs font-black uppercase">{title}</p>
        <p className="mt-0.5 text-[11px] font-bold opacity-70">{copy}</p>
      </div>
    </div>
  );
}

function CustomerLine({ customer }: { customer: CrmCustomer }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "#FFF8F2" }}>
      <p className="text-xs font-black uppercase">{customer.name ?? "Cliente"}</p>
      <p className="mt-1 text-[11px] font-bold opacity-55">
        {customer.phone ?? "Sem telefone"} · {fmt(Number(customer.total_spent ?? 0))}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl p-4 text-sm font-bold opacity-60" style={{ background: "#FFF8F2" }}>
      {text}
    </div>
  );
}

function formatQty(value: number, unit: string) {
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${unit}`;
}
