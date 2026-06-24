import { Award, Percent, TicketPercent, Users } from "lucide-react";
import { Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { Coupon, fmt } from "../shared";

type CouponResult = {
  code: string;
  sales: number;
  buyers: Set<string>;
  revenue: number;
  discount: number;
};

const CONFIRMED_STATUSES = new Set([
  "PAID",
  "ACCEPTED",
  "IN_PREPARATION",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
]);

export function CouponResultsView({
  orders,
  coupons,
}: {
  orders: Order[];
  coupons: Coupon[];
}) {
  const results = new Map<string, CouponResult>();
  coupons.forEach((coupon) => {
    results.set(coupon.code.toUpperCase(), {
      code: coupon.code,
      sales: 0,
      buyers: new Set(),
      revenue: 0,
      discount: 0,
    });
  });

  orders.forEach((order) => {
    const code = order.couponCode?.trim();
    if (!code || !CONFIRMED_STATUSES.has(order.status)) return;
    const key = code.toUpperCase();
    const result = results.get(key) ?? {
      code,
      sales: 0,
      buyers: new Set<string>(),
      revenue: 0,
      discount: 0,
    };
    result.sales += 1;
    result.revenue += Number(order.total ?? 0);
    result.discount += Number(order.discountTotal ?? 0);
    const buyer = order.customerPhone?.replace(/\D/g, "") || order.customerName?.trim().toLowerCase();
    if (buyer) result.buyers.add(buyer);
    results.set(key, result);
  });

  const ranking = [...results.values()].sort(
    (a, b) => b.sales - a.sales || b.revenue - a.revenue || a.code.localeCompare(b.code),
  );
  const used = ranking.filter((item) => item.sales > 0);
  const uniqueBuyers = new Set(used.flatMap((item) => [...item.buyers]));
  const best = ranking[0];
  const worst = [...ranking].reverse()[0];

  return (
    <div className="grid gap-4" style={{ color: VERDE }}>
      <section className="rounded-3xl p-5" style={{ background: `linear-gradient(135deg, ${VERDE}, #315f48)`, color: "#fff" }}>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Marketing e anunciantes</p>
        <h2 className="mt-2 text-2xl font-black">Resultados de cupons</h2>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed opacity-85">
          Indicadores calculados somente com pedidos confirmados. Pedidos pendentes e cancelados não entram no resultado.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Users} label="Compradores com cupom" value={String(uniqueBuyers.size)} help="Pessoas únicas que concluíram uma compra" />
        <Metric icon={TicketPercent} label="Pedidos com cupom" value={String(used.reduce((total, item) => total + item.sales, 0))} help="Vendas confirmadas por anunciantes" />
        <Metric icon={Percent} label="Desconto concedido" value={fmt(used.reduce((total, item) => total + item.discount, 0))} help="Valor total dos descontos aplicados" />
        <Metric icon={Award} label="Receita com cupom" value={fmt(used.reduce((total, item) => total + item.revenue, 0))} help="Total faturado nos pedidos com cupom" />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <Highlight title="Cupom mais vendido" result={best} positive />
        <Highlight title="Cupom menos vendido" result={worst} />
      </section>

      <section className="overflow-hidden rounded-3xl bg-white" style={{ border: `1px solid ${ROSA}` }}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4" style={{ borderColor: `${VERDE}12` }}>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide">Ranking de anunciantes e cupons</h3>
            <p className="mt-1 text-xs font-semibold opacity-55">Cada cupom representa a origem/anunciante da venda.</p>
          </div>
          <span className="rounded-full px-3 py-1 text-xs font-black" style={{ background: `${ROSA}55` }}>{ranking.length} cupons</span>
        </div>
        {ranking.length === 0 ? (
          <p className="p-6 text-sm font-semibold opacity-60">Cadastre cupons para acompanhar os resultados dos anunciantes.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: `${VERDE}10` }}>
            {ranking.map((item, index) => (
              <div key={item.code} className="grid gap-3 p-4 sm:grid-cols-[44px_minmax(0,1fr)_repeat(3,auto)] sm:items-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black" style={{ background: index === 0 ? "#FDE68A" : `${ROSA}45` }}>
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-black">{item.code}</p>
                  <p className="mt-0.5 text-xs font-semibold opacity-55">{item.buyers.size} comprador{item.buyers.size !== 1 ? "es" : ""} único{item.buyers.size !== 1 ? "s" : ""}</p>
                </div>
                <ResultValue label="Vendas" value={String(item.sales)} />
                <ResultValue label="Desconto" value={fmt(item.discount)} />
                <ResultValue label="Receita" value={fmt(item.revenue)} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, help }: { icon: typeof Users; label: string; value: string; help: string }) {
  return (
    <div className="rounded-3xl bg-white p-4" style={{ border: `1px solid ${ROSA}` }}>
      <div className="flex items-center gap-2"><Icon size={17} style={{ color: ROSA }} /><p className="text-[10px] font-black uppercase tracking-wider opacity-55">{label}</p></div>
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-semibold opacity-55">{help}</p>
    </div>
  );
}

function Highlight({ title, result, positive = false }: { title: string; result?: CouponResult; positive?: boolean }) {
  return (
    <div className="rounded-3xl p-5" style={{ background: positive ? "#ECFDF5" : "#FFF8F2", border: `1px solid ${positive ? "#86EFAC" : ROSA}` }}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-55">{title}</p>
      <p className="mt-2 text-2xl font-black">{result?.code ?? "Sem cupons"}</p>
      <p className="mt-1 text-sm font-semibold opacity-65">{result ? `${result.sales} venda${result.sales !== 1 ? "s" : ""} confirmada${result.sales !== 1 ? "s" : ""}` : "Ainda não há dados para comparar."}</p>
    </div>
  );
}

function ResultValue({ label, value }: { label: string; value: string }) {
  return <div className="min-w-[82px] sm:text-right"><p className="text-[10px] font-black uppercase opacity-45">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>;
}
