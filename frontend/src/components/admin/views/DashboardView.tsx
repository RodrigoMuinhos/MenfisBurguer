import { useState } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import {
  Bike,
  DollarSign,
  Package,
  Store,
  TicketPercent,
  TrendingUp,
} from "lucide-react";
import { Order } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { STAGE_COLOR, STAGE_LABEL, fmt, isBillableOrder } from "../shared";
export function DashboardView({
  orders,
}: {
  orders: Order[];
}) {
  const [channelFilter, setChannelFilter] = useState<"ALL" | Order["channel"]>(
    "ALL",
  );
  const billableOrders = orders.filter(isBillableOrder);
  const filteredOrders = billableOrders.filter(
    (order) => channelFilter === "ALL" || order.channel === channelFilter,
  );
  const filteredRevenue = filteredOrders.reduce(
    (sum, order) => sum + order.total,
    0,
  );
  const deliveryCount = billableOrders.filter((o) => o.channel === "DELIVERY").length;
  const kioskCount = billableOrders.filter((o) => o.channel === "KIOSK").length;
  const avgTicket = filteredOrders.length
    ? filteredRevenue / filteredOrders.length
    : 0;

  const kpis = [
    {
      label: "Vendas",
      value: fmt(filteredRevenue),
      Icon: DollarSign,
      sub: `${filteredOrders.length} pedidos`,
    },
    {
      label: "Ticket Médio",
      value: fmt(avgTicket),
      Icon: TrendingUp,
      sub: "por pedido",
    },
    {
      label: "Delivery",
      value: String(deliveryCount),
      Icon: Bike,
      sub: "para entrega",
    },
    {
      label: "Kiosk",
      value: String(kioskCount),
      Icon: Store,
      sub: "presencial",
    },
  ];

  const pieData = [
    { name: "Kiosk", value: Math.max(kioskCount, 0.01), color: VERDE },
    { name: "Delivery", value: Math.max(deliveryCount, 0.01), color: ROSA },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["ALL", "DELIVERY", "KIOSK"] as const).map((channel) => (
          <button
            key={channel}
            onClick={() => setChannelFilter(channel)}
            className="rounded-full px-4 py-2 text-xs font-black uppercase"
            style={{
              background: channelFilter === channel ? VERDE : "#fff",
              color: channelFilter === channel ? ROSA : VERDE,
            }}
          >
            {channel === "ALL" ? "Todos" : channel}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {kpis.map(({ label, value, Icon, sub }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{
              background: "#fff",
              border: `1.5px solid ${VERDE}10`,
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: VERDE, opacity: 0.4 }}
              >
                {label}
              </span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: ROSA }}
              >
                <Icon size={13} strokeWidth={2} style={{ color: VERDE }} />
              </div>
            </div>
            <p
              className="font-black"
              style={{
                color: VERDE,
                fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                fontSize: "1.25rem",
                lineHeight: 1.1,
              }}
            >
              {value}
            </p>
            <p
              className="text-[10px] mt-1"
              style={{ color: VERDE, opacity: 0.35 }}
            >
              {sub}
            </p>
          </div>
        ))}
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ background: "#fff", border: `1.5px solid ${VERDE}10` }}
      >
        <p
          className="text-[10px] font-black uppercase tracking-widest mb-4"
          style={{ color: VERDE, opacity: 0.4 }}
        >
          Canal de pedidos
        </p>
        <div className="flex items-center gap-4">
          <PieChart width={100} height={100}>
            <Pie
              data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={26}
              outerRadius={48}
              paddingAngle={3}
              strokeWidth={0}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={pieData[i].color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [v, ""]}
              contentStyle={{
                background: "#fff",
                border: `1px solid ${VERDE}20`,
                borderRadius: 8,
                fontSize: 11,
              }}
            />
          </PieChart>
          <div className="flex flex-col gap-3 flex-1">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: d.color }}
                />
                <span className="text-xs flex-1" style={{ color: VERDE }}>
                  {d.name}
                </span>
                <span className="text-xs font-black" style={{ color: VERDE }}>
                  {billableOrders.length
                    ? Math.round((d.value / billableOrders.length) * 100)
                    : 0}
                  %
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {orders.length > 0 && (
        <div>
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-2"
            style={{ color: VERDE, opacity: 0.35 }}
          >
            Últimos pedidos
          </p>
          <div className="flex flex-col gap-2">
            {[...orders]
              .reverse()
              .slice(0, 5)
              .map((o) => {
                const sc = STAGE_COLOR[o.status];
                return (
                  <div
                    key={o.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{
                      background: "#fff",
                      border: `1.5px solid ${VERDE}08`,
                    }}
                  >
                    <span
                      className="font-black shrink-0"
                      style={{
                        color: VERDE,
                        fontFamily: "'Bebas Neue','Arial Black',sans-serif",
                      }}
                    >
                      {o.id}
                    </span>
                    <span
                      className="text-[10px] flex-1 truncate"
                      style={{ color: VERDE, opacity: 0.45 }}
                    >
                      {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                    </span>
                    <span
                      className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase shrink-0"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {STAGE_LABEL[o.status]}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
