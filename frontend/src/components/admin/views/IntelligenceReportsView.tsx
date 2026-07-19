import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarRange, ChevronLeft, ChevronRight, Download, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { Movement, StockItem } from "../EstoqueView";
import { fetchPricingProducts } from "../adminBackend";
import { fmt, isBillableOrder, localDateKey, paymentMethodLabel } from "../shared";
import type { PricingRow } from "./PricingView";

type Preset = "today" | "week" | "month" | "quarter" | "year" | "custom";
const COLORS = [VERDE, "#F8B7C8", "#C2410C", "#8B5CF6", "#0EA5E9"];

export function IntelligenceReportsView({ orders, stockItems, movements, adminToken }: { orders: Order[]; stockItems: StockItem[]; movements: Movement[]; adminToken: string }) {
  const [preset, setPreset] = useState<Preset>("month");
  const [customStart, setCustomStart] = useState(localDateKey(Date.now() - 29 * 86400000));
  const [customEnd, setCustomEnd] = useState(localDateKey(Date.now()));
  const [periodOffset, setPeriodOffset] = useState(0);
  const [pricing, setPricing] = useState<PricingRow[]>([]);

  useEffect(() => { void fetchPricingProducts("/backend", adminToken).then(setPricing).catch(() => setPricing([])); }, [adminToken]);
  const range = useMemo(() => dateRange(preset, customStart, customEnd, periodOffset), [preset, customStart, customEnd, periodOffset]);
  const filtered = useMemo(() => orders.filter((order) => { const key = localDateKey(order.timestamp); return key >= range.start && key <= range.end; }), [orders, range]);
  const billable = filtered.filter(isBillableOrder);
  const previous = useMemo(() => previousPeriodOrders(orders, range), [orders, range]);
  const revenue = sum(billable.map((order) => order.total));
  const previousRevenue = sum(previous.filter(isBillableOrder).map((order) => order.total));
  const change = previousRevenue ? ((revenue - previousRevenue) / previousRevenue) * 100 : revenue ? 100 : 0;
  const discounts = sum(billable.map((order) => Number(order.discountTotal ?? 0)));
  const costs = estimateCmv(billable, pricing);
  const grossProfit = revenue - costs;
  const margin = revenue ? grossProfit / revenue * 100 : 0;
  const cancelled = filtered.filter((order) => order.status === "CANCELLED");
  const daily = dailySeries(billable, range);
  const products = productSeries(billable);
  const channels = groupValues(billable, (order) => order.channel, (order) => order.total);
  const payments = groupValues(billable, paymentMethodLabel, (order) => order.total);
  const hours = hourlySeries(billable);
  const bestDay = [...daily].sort((a, b) => b.value - a.value)[0];
  const worstDay = [...daily].filter((day) => day.orders > 0).sort((a, b) => a.value - b.value)[0];
  const criticalStock = stockItems.filter((item) => item.qty <= item.minQty);
  const stockValue = sum(stockItems.map((item) => item.qty * item.unitCost));
  const periodMovements = movements.filter((movement) => { const key = localDateKey(movement.timestamp); return key >= range.start && key <= range.end; });

  return (
    <div className="min-h-screen bg-[#FFF8F2] text-[#314A37]">
      <header className="border-b border-[#314A37]/10 bg-white px-4 py-5 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#9F4560]">Inteligência operacional</p><h1 className="mt-1 text-3xl font-black lg:text-4xl">Relatórios e Indicadores</h1><p className="mt-1 text-sm font-semibold opacity-55">Visão financeira, comercial, operacional e de estoque.</p></div>
          <button onClick={() => exportCsv(filtered)} className="flex min-h-11 items-center gap-2 rounded-xl px-4 text-xs font-black text-white" style={{ background: VERDE }}><Download size={16}/> Exportar CSV</button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {([['today','Hoje'],['week','Semana'],['month','Mês'],['quarter','Trimestre'],['year','Ano'],['custom','Personalizado']] as [Preset,string][]).map(([id,label]) => <button key={id} onClick={() => { setPreset(id); setPeriodOffset(0); }} className="rounded-full px-4 py-2 text-xs font-black" style={{ background: preset === id ? VERDE : '#fff', color: preset === id ? ROSA : VERDE, border: `1px solid ${VERDE}22` }}>{label}</button>)}
          {preset === "custom" && <><input type="date" value={customStart} onChange={(e) => { setCustomStart(e.target.value); setPeriodOffset(0); }} className="rounded-xl border px-3 text-xs font-bold"/><input type="date" value={customEnd} onChange={(e) => { setCustomEnd(e.target.value); setPeriodOffset(0); }} className="rounded-xl border px-3 text-xs font-bold"/></>}
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setPeriodOffset((value) => value - 1)} aria-label="Ver período anterior" title="Período anterior" className="grid h-10 w-10 place-items-center rounded-full border bg-white shadow-sm transition hover:-translate-x-0.5" style={{ borderColor: `${VERDE}30` }}><ChevronLeft size={19}/></button>
            <span className="flex min-w-[190px] items-center justify-center gap-2 text-xs font-bold"><CalendarRange size={15}/>{formatDate(range.start)} até {formatDate(range.end)}</span>
            <button type="button" onClick={() => setPeriodOffset((value) => Math.min(0, value + 1))} disabled={periodOffset === 0} aria-label="Ver período seguinte" title="Período seguinte" className="grid h-10 w-10 place-items-center rounded-full border bg-white shadow-sm transition enabled:hover:translate-x-0.5 disabled:cursor-not-allowed disabled:opacity-30" style={{ borderColor: `${VERDE}30` }}><ChevronRight size={19}/></button>
          </div>
        </div>
      </header>

      <main className="grid gap-4 p-4 lg:p-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Kpi title="Faturamento" value={fmt(revenue)} detail={`${signed(change)} vs. período anterior`} trend={change}/><Kpi title="Pedidos" value={String(billable.length)} detail={`${filtered.length} registros no período`}/><Kpi title="Ticket médio" value={fmt(billable.length ? revenue/billable.length : 0)} detail="por pedido faturado"/><Kpi title="CMV estimado" value={fmt(costs)} detail={`${revenue ? (costs/revenue*100).toFixed(1) : '0,0'}% da receita`} warning={revenue > 0 && costs/revenue > .4}/><Kpi title="Lucro bruto" value={fmt(grossProfit)} detail={`Margem ${margin.toFixed(1)}%`}/><Kpi title="Cancelamentos" value={String(cancelled.length)} detail={`${filtered.length ? (cancelled.length/filtered.length*100).toFixed(1) : '0,0'}% dos pedidos`} warning={cancelled.length > 0}/>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
          <Panel title="Faturamento por dia" subtitle="Receita e volume de pedidos no período"><ResponsiveContainer width="100%" height={290}><LineChart data={daily}><CartesianGrid strokeDasharray="3 3" stroke="#314A3715"/><XAxis dataKey="label" fontSize={10}/><YAxis fontSize={10}/><Tooltip formatter={(value) => fmt(Number(value))}/><Line type="monotone" dataKey="value" stroke={VERDE} strokeWidth={3} dot={{ fill: ROSA, stroke: VERDE }}/></LineChart></ResponsiveContainer></Panel>
          <Panel title="Leitura rápida" subtitle="Destaques que merecem atenção"><div className="grid gap-3"><Insight icon={<TrendingUp/>} label="Melhor dia" value={bestDay ? `${bestDay.label} · ${fmt(bestDay.value)}` : 'Sem dados'}/><Insight icon={<TrendingDown/>} label="Menor venda" value={worstDay ? `${worstDay.label} · ${fmt(worstDay.value)}` : 'Sem dados'}/><Insight icon={<Wallet/>} label="Descontos concedidos" value={fmt(discounts)}/><Insight icon={<AlertTriangle/>} label="Estoque crítico" value={`${criticalStock.length} item(ns)`}/></div></Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <Panel title="Produtos mais vendidos" subtitle="Quantidade por produto"><ResponsiveContainer width="100%" height={280}><BarChart data={products.slice(0,8)} layout="vertical"><XAxis type="number" fontSize={10}/><YAxis dataKey="name" type="category" width={115} fontSize={9}/><Tooltip/><Bar dataKey="qty" fill={VERDE} radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></Panel>
          <Panel title="Vendas por canal" subtitle="Participação no faturamento"><Donut data={channels}/></Panel>
          <Panel title="Formas de pagamento" subtitle="Receita por método"><Donut data={payments}/></Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Panel title="Movimento por horário" subtitle="Pedidos recebidos em cada hora"><ResponsiveContainer width="100%" height={260}><BarChart data={hours}><CartesianGrid strokeDasharray="3 3" stroke="#314A3715"/><XAxis dataKey="label" fontSize={9}/><YAxis fontSize={10}/><Tooltip/><Bar dataKey="orders" fill={ROSA} stroke={VERDE} radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></Panel>
          <Panel title="Estoque e operação" subtitle="Posição atual e movimentações do período"><div className="grid grid-cols-2 gap-3"><Mini label="Valor em estoque" value={fmt(stockValue)}/><Mini label="Itens cadastrados" value={String(stockItems.length)}/><Mini label="Abaixo do mínimo" value={String(criticalStock.length)} warning={criticalStock.length>0}/><Mini label="Movimentações" value={String(periodMovements.length)}/></div><div className="mt-4 grid gap-2">{criticalStock.slice(0,5).map(item=><div key={item.id} className="flex justify-between rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-800"><span>{item.name}</span><span>{item.qty} {item.unit}</span></div>)}</div></Panel>
        </section>

        <Panel title="Desempenho dos produtos" subtitle="Ranking completo de quantidade e faturamento"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="border-b"><th className="p-3">Produto</th><th>Quantidade</th><th>Pedidos</th><th>Faturamento</th><th>Participação</th></tr></thead><tbody>{products.map(p=><tr key={p.name} className="border-b border-[#314A37]/8"><td className="p-3 font-black">{p.name}</td><td>{p.qty}</td><td>{p.orders}</td><td>{fmt(p.revenue)}</td><td>{revenue ? (p.revenue/revenue*100).toFixed(1) : 0}%</td></tr>)}</tbody></table></div></Panel>
      </main>
    </div>
  );
}

function Panel({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}){return <section className="rounded-2xl border border-[#314A37]/10 bg-white p-4 shadow-sm"><h2 className="font-black">{title}</h2><p className="mb-4 mt-1 text-xs font-semibold opacity-50">{subtitle}</p>{children}</section>}
function Kpi({title,value,detail,trend,warning}:{title:string;value:string;detail:string;trend?:number;warning?:boolean}){return <div className="rounded-2xl border bg-white p-4" style={{borderColor:warning?'#FCA5A5':`${VERDE}18`}}><p className="text-[9px] font-black uppercase tracking-widest opacity-50">{title}</p><p className="mt-2 text-2xl font-black">{value}</p><p className="mt-2 text-[10px] font-bold" style={{color:trend === undefined?'#314A3790':trend>=0?'#15803D':'#B91C1C'}}>{detail}</p></div>}
function Insight({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="flex items-center gap-3 rounded-xl bg-[#FFF8F2] p-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F8B7C8]/50">{icon}</span><div><p className="text-[9px] font-black uppercase opacity-45">{label}</p><p className="text-sm font-black">{value}</p></div></div>}
function Mini({label,value,warning}:{label:string;value:string;warning?:boolean}){return <div className="rounded-xl p-3" style={{background:warning?'#FEF2F2':'#FFF8F2'}}><p className="text-[9px] font-black uppercase opacity-45">{label}</p><p className="mt-1 text-lg font-black">{value}</p></div>}
function Donut({data}:{data:{name:string;value:number}[]}){return <><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>{data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={(v)=>fmt(Number(v))}/></PieChart></ResponsiveContainer><div className="flex flex-wrap justify-center gap-3">{data.map((d,i)=><span key={d.name} className="flex items-center gap-1 text-[10px] font-bold"><i className="h-2 w-2 rounded-full" style={{background:COLORS[i%COLORS.length]}}/>{d.name}</span>)}</div></>}
function sum(values:number[]){return values.reduce((a,b)=>a+b,0)}
function dateRange(p:Preset,start:string,end:string,offset=0){
  if(p==='custom'){
    const from=new Date(`${start}T12:00:00`),to=new Date(`${end}T12:00:00`),days=Math.round((to.getTime()-from.getTime())/86400000)+1;
    from.setDate(from.getDate()+offset*days);to.setDate(to.getDate()+offset*days);
    return {start:localDateKey(from.getTime()),end:localDateKey(to.getTime())};
  }
  const now=new Date();now.setHours(12,0,0,0);
  if(p==='today'){now.setDate(now.getDate()+offset);return {start:localDateKey(now.getTime()),end:localDateKey(now.getTime())};}
  if(p==='week'){
    const to=new Date(now);to.setDate(to.getDate()+offset*7);
    const from=new Date(to);from.setDate(from.getDate()-6);
    return {start:localDateKey(from.getTime()),end:localDateKey(to.getTime())};
  }
  if(p==='month'){
    const from=new Date(now.getFullYear(),now.getMonth()+offset,1,12);
    const to=offset===0?new Date(now):new Date(now.getFullYear(),now.getMonth()+offset+1,0,12);
    return {start:localDateKey(from.getTime()),end:localDateKey(to.getTime())};
  }
  if(p==='quarter'){
    const quarterStart=Math.floor(now.getMonth()/3)*3+offset*3;
    const from=new Date(now.getFullYear(),quarterStart,1,12);
    const to=offset===0?new Date(now):new Date(now.getFullYear(),quarterStart+3,0,12);
    return {start:localDateKey(from.getTime()),end:localDateKey(to.getTime())};
  }
  const from=new Date(now.getFullYear()+offset,0,1,12);
  const to=offset===0?new Date(now):new Date(now.getFullYear()+offset,11,31,12);
  return {start:localDateKey(from.getTime()),end:localDateKey(to.getTime())};
}
function previousPeriodOrders(orders:Order[],range:{start:string;end:string}){const a=new Date(`${range.start}T12:00:00`),b=new Date(`${range.end}T12:00:00`),days=Math.round((b.getTime()-a.getTime())/86400000)+1;const end=new Date(a);end.setDate(end.getDate()-1);const start=new Date(end);start.setDate(start.getDate()-days+1);return orders.filter(o=>{const k=localDateKey(o.timestamp);return k>=localDateKey(start.getTime())&&k<=localDateKey(end.getTime())})}
function dailySeries(orders:Order[],range:{start:string;end:string}){const map=new Map<string,{value:number;orders:number}>();orders.forEach(o=>{const k=localDateKey(o.timestamp),v=map.get(k)??{value:0,orders:0};v.value+=o.total;v.orders++;map.set(k,v)});const out=[];for(let d=new Date(`${range.start}T12:00:00`),end=new Date(`${range.end}T12:00:00`);d<=end;d.setDate(d.getDate()+1)){const k=localDateKey(d.getTime()),v=map.get(k)??{value:0,orders:0};out.push({date:k,label:d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),...v})}return out}
function productSeries(orders:Order[]){const map=new Map<string,{qty:number;orders:Set<string>;revenue:number}>();orders.forEach(o=>o.items.forEach(i=>{const v=map.get(i.name)??{qty:0,orders:new Set<string>(),revenue:0};v.qty+=i.qty;v.orders.add(o.id);v.revenue+=i.price*i.qty;map.set(i.name,v)}));return [...map].map(([name,v])=>({name,qty:v.qty,orders:v.orders.size,revenue:v.revenue})).sort((a,b)=>b.qty-a.qty)}
function groupValues(orders:Order[],key:(o:Order)=>string,value:(o:Order)=>number){const m=new Map<string,number>();orders.forEach(o=>m.set(key(o), (m.get(key(o))??0)+value(o)));return [...m].map(([name,value])=>({name,value}))}
function hourlySeries(orders:Order[]){const h=Array.from({length:24},(_,i)=>({label:`${String(i).padStart(2,'0')}h`,orders:0}));orders.forEach(o=>h[new Date(o.timestamp).getHours()].orders++);return h}
function estimateCmv(orders:Order[],pricing:PricingRow[]){const map=new Map(pricing.map(p=>[p.id,p.baseCost+p.friesCost+p.defaultDrinkCost]));return sum(orders.flatMap(o=>o.items.map(i=>(map.get(i.productId??i.id)??0)*i.qty)))}
function signed(n:number){return `${n>=0?'+':''}${n.toFixed(1)}%`}
function formatDate(v:string){const [y,m,d]=v.split('-');return `${d}/${m}/${y}`}
function exportCsv(orders:Order[]){const rows=[["Pedido","Data","Cliente","Canal","Pagamento","Status","Itens","Total"],...orders.map(o=>[o.id,new Date(o.timestamp).toLocaleString('pt-BR'),o.customerName??'',o.channel,paymentMethodLabel(o),o.status,o.items.map(i=>`${i.qty}x ${i.name}`).join(' | '),o.total.toFixed(2)])];const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff',csv],{type:'text/csv'}));a.download='relatorio-menfis.csv';a.click();URL.revokeObjectURL(a.href)}
