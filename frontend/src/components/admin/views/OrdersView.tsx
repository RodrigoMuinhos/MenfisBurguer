import { useEffect, useMemo, useState } from "react";
import { BellRing, Check, FileText, MessageCircle, Minus, Pencil, Phone, Plus, Printer, Save, Trash2, XCircle } from "lucide-react";
import { CartItem, Order, OrderStatus, OrderUpdateOptions } from "@/types/order";
import { ROSA, VERDE } from "@/utils/theme";
import { DELIVERY_FEE } from "@/components/order/checkout";
import { deliveryConfirmationCode } from "@/components/order/tracking";
import { formatAddressForReceipt } from "@/utils/address";
import {
  customerWhatsappUrl,
  copyOrderTxt,
  fmt,
  isKioskMobOrder,
  localDateKey,
  orderReadyWhatsappUrl,
  orderItemComponents,
  orderItemNote,
  paymentMethodLabel,
  paymentStatusLabel,
  printOrderReceipts,
  STAGE_COLOR,
  STAGE_LABEL,
} from "../shared";

const CANCELLABLE_STATUSES: OrderStatus[] = ["PAYMENT_PENDING", "PAID", "ACCEPTED", "IN_PREPARATION"];
const EDITABLE_ITEM_STATUSES: OrderStatus[] = ["PAYMENT_PENDING", "PAID", "ACCEPTED"];
const PREPARATION_STARTED_STATUSES: OrderStatus[] = [
  "IN_PREPARATION",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

function dateLabel(value: string) {
  if (!value) return "Sem data";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function OrdersView({
  orders,
  updateOrderStatus,
  deleteOrder,
  updateOrderItems,
}: {
  orders: Order[];
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void | Promise<void>;
  updateOrderItems: (id: string, items: CartItem[], options?: OrderUpdateOptions) => void | Promise<void>;
}) {
  const [channelFilter, setChannelFilter] = useState<"ALL" | Order["channel"]>(
    "ALL",
  );
  const [selectedId, setSelectedId] = useState(orders[0]?.id ?? "");
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [editingOrderId, setEditingOrderId] = useState("");
  const [draftItems, setDraftItems] = useState<CartItem[]>([]);
  const [editingDetails, setEditingDetails] = useState(false);
  const [draftDetails, setDraftDetails] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    deliveryType: "delivery" as Order["deliveryType"],
    paymentMethod: "presencial" as NonNullable<Order["paymentMethod"]>,
    paymentStatus: "",
    couponCode: "",
    discountTotal: "",
    deliveryFee: "",
  });
  const availableDates = useMemo(
    () => [...new Set(orders.map((order) => localDateKey(order.timestamp)))].sort().reverse(),
    [orders],
  );
  const [selectedDate, setSelectedDate] = useState("");
  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);
  const filteredOrders = orders.filter(
    (order) =>
      (!selectedDate || localDateKey(order.timestamp) === selectedDate) &&
      (channelFilter === "ALL" || order.channel === channelFilter),
  );
  const selected =
    filteredOrders.find((order) => order.id === selectedId) ??
    filteredOrders[0];
  useEffect(() => {
    if (!selected && selectedId) {
      setSelectedId("");
      return;
    }
    if (selected && selected.id !== selectedId) {
      setSelectedId(selected.id);
    }
  }, [selected?.id, selectedId]);
  const selectedPaymentStatus = String(selected?.paymentStatus ?? "").toLowerCase();
  const paymentRejected = [
    "rejected",
    "failed",
    "cancelled",
    "canceled",
    "expired",
    "refunded",
    "charged_back",
  ].includes(selectedPaymentStatus);
  const canReleasePayment =
    selected &&
    (selected.status === "PAYMENT_PENDING" ||
      (selected.status === "CANCELLED" && selected.paymentProvider === "mercado_pago" && paymentRejected));
  const selectedIsKioskMob = isKioskMobOrder(selected);
  const selectedAddress = formatAddressForReceipt(selected?.customerAddress || "Não informado");
  const editingItems = selected?.id === editingOrderId;
  const detailItems = editingItems ? draftItems : selected?.items ?? [];
  const selectedSubtotal = Number(selected?.subtotal ?? selected?.items.reduce((sum, item) => sum + item.price * item.qty, 0) ?? 0);
  const selectedDeliveryFee = Number(selected?.deliveryFee ?? 0);
  const draftSubtotal = detailItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const selectedTotal = Number(selected?.total ?? 0);
  const selectedDiscount = Number((selected as Order & { discountTotal?: number })?.discountTotal ?? 0);
  const selectedServiceFee = Math.max(
    0,
    Math.round((selectedTotal + selectedDiscount - selectedSubtotal - selectedDeliveryFee) * 100) / 100,
  );
  const editedDiscount = editingDetails
    ? Math.max(0, Number(draftDetails.discountTotal.replace(",", ".") || 0))
    : selectedDiscount;
  const editedDeliveryFee = editingDetails
    ? Math.max(0, Number(draftDetails.deliveryFee.replace(",", ".") || 0))
    : selectedDeliveryFee;
  const editedCouponCode = editingDetails
    ? draftDetails.couponCode.trim()
    : selected?.couponCode ?? "";
  const detailSubtotal = editingItems ? draftSubtotal : selectedSubtotal;
  const detailTotal = editingItems
    ? Math.max(
        1,
        Math.round((detailSubtotal + editedDeliveryFee + selectedServiceFee - editedDiscount) * 100) / 100,
      )
    : editingDetails
      ? Math.max(
          1,
          Math.round((detailSubtotal + editedDeliveryFee + selectedServiceFee - editedDiscount) * 100) / 100,
        )
      : selectedTotal;
  const selectedRemoved = Object.entries(selected?.removedByItemId ?? {})
    .flatMap(([, values]) => values)
    .filter((value, index, values) => values.indexOf(value) === index);
  const updateDraftDetail = (key: keyof typeof draftDetails, value: string) => {
    setDraftDetails((current) => ({ ...current, [key]: value }));
  };
  const startDetailEdit = () => {
    if (!selected || !canEditFinancials) return;
    setEditingDetails(true);
    setDraftDetails({
      customerName: selected.customerName ?? "",
      customerPhone: selected.customerPhone ?? "",
      customerAddress: selected.customerAddress ?? "",
      deliveryType: selected.deliveryType,
      paymentMethod: selected.paymentMethod ?? "presencial",
      paymentStatus: selected.paymentStatus ?? "",
      couponCode: selected.couponCode ?? "",
      discountTotal: selectedDiscount > 0 ? String(selectedDiscount).replace(".", ",") : "",
      deliveryFee: String(selectedDeliveryFee).replace(".", ","),
    });
  };
  const cancelDetailEdit = () => {
    setEditingDetails(false);
  };
  const removeDraftCoupon = () => {
    setDraftDetails((current) => ({
      ...current,
      couponCode: "",
      discountTotal: "",
    }));
  };
  const saveDetailEdit = async () => {
    if (!selected || !canEditFinancials) return;
    const discountTotal = Math.max(0, Number(draftDetails.discountTotal.replace(",", ".") || 0));
    const deliveryFee = Math.max(0, Number(draftDetails.deliveryFee.replace(",", ".") || 0));
    await updateOrderItems(selected.id, detailItems, {
      customerName: draftDetails.customerName.trim(),
      customerPhone: draftDetails.customerPhone.trim(),
      customerAddress: draftDetails.customerAddress.trim(),
      deliveryType: draftDetails.deliveryType,
      paymentMethod: draftDetails.paymentMethod,
      paymentStatus: draftDetails.paymentStatus.trim(),
      couponCode: discountTotal > 0 ? draftDetails.couponCode.trim() : "",
      discountTotal,
      deliveryFee,
    });
    setEditingDetails(false);
    cancelItemEdit();
  };
  const confirmDeleteFinished = (order: Order) => {
    if (!["CANCELLED", "DELIVERED"].includes(order.status)) return;
    const confirmed = window.confirm(`Excluir definitivamente o pedido ${order.id}?`);
    if (!confirmed) return;
    void deleteOrder(order.id);
  };
  const startItemEdit = () => {
    if (!selected) return;
    setEditingOrderId(selected.id);
    setDraftItems(selected.items.map((item) => ({ ...item })));
  };
  const updateDraftQty = (itemIndex: number, delta: number) => {
    setDraftItems((items) =>
      items.map((item, index) =>
        index === itemIndex ? { ...item, qty: Math.max(1, item.qty + delta) } : item,
      ),
    );
  };
  const removeDraftItem = (itemIndex: number) => {
    setDraftItems((items) => items.filter((_, index) => index !== itemIndex));
  };
  const cancelItemEdit = () => {
    setEditingOrderId("");
    setDraftItems([]);
  };
  const saveItemEdit = async () => {
    if (!selected) return;
    if (draftItems.length === 0) return;
    await updateOrderItems(selected.id, draftItems);
    cancelItemEdit();
  };
  const canEditFinancials = Boolean(selected && EDITABLE_ITEM_STATUSES.includes(selected.status));
  const applyDeliveryFee = async () => {
    if (!selected || !canEditFinancials) return;
    await updateOrderItems(selected.id, selected.items, { deliveryFee: DELIVERY_FEE });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          {(["ALL", "DELIVERY", "KIOSK"] as const).map((channel) => (
            <button
              key={channel}
              onClick={() => setChannelFilter(channel)}
              className="rounded-full px-4 py-2 text-xs font-black uppercase"
              style={{
                background: channelFilter === channel ? VERDE : "#fff",
                color: channelFilter === channel ? ROSA : VERDE,
                border: `1px solid ${VERDE}22`,
              }}
            >
              {channel === "ALL" ? "Todos" : channel}
            </button>
          ))}
        </div>
        <label className="ml-auto flex min-h-10 items-center gap-2 rounded-full px-3 text-xs font-black uppercase" style={{ background: "#fff", color: VERDE, border: `1px solid ${VERDE}22` }}>
          Data
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="bg-transparent text-xs font-black outline-none"
            style={{ color: VERDE }}
          />
        </label>
        <span className="rounded-full px-3 py-2 text-[10px] font-black uppercase" style={{ background: `${ROSA}55`, color: VERDE }}>
          {dateLabel(selectedDate)} · {filteredOrders.length} pedido{filteredOrders.length === 1 ? "" : "s"}
        </span>
      </div>
      {!selected ? (
        <div className="rounded-2xl border bg-white px-5 py-12 text-center" style={{ borderColor: `${VERDE}18`, color: VERDE }}>
          <p className="text-sm font-black uppercase">Nenhum pedido nessa data.</p>
          <p className="mt-1 text-xs font-bold opacity-55">
            Quando entrarem pedidos novos para {selectedDate ? dateLabel(selectedDate) : "essa data"}, eles aparecem aqui.
          </p>
        </div>
      ) : (
      <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.8fr)_minmax(360px,1.2fr)] lg:items-start">
        <div className="flex max-h-[calc(100dvh-190px)] min-h-0 flex-col gap-3 overflow-y-auto pr-1">
          {filteredOrders.map((order) => {
            const stage = STAGE_COLOR[order.status];
            const createdAt = new Date(order.timestamp);
            const ageMinutes = Math.max(
              0,
              Math.round((Date.now() - order.timestamp) / 60000),
            );
            const itemsPreview = order.items
              .slice(0, 2)
              .map((item) => `${item.qty}x ${item.name}`)
              .join(" · ");
            return (
              <div
                key={order.id}
                className="grid min-h-[138px] grid-cols-[minmax(0,1fr)_auto] items-stretch overflow-hidden rounded-xl"
                style={{
                  background: selected.id === order.id ? stage.bg : "#fff",
                  border: `1.5px solid ${selected.id === order.id ? stage.accent : stage.border}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(order.id)}
                  className="min-h-[138px] min-w-0 p-4 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-base" style={{ color: stage.text }}>{order.id}</strong>
                    <span
                      className="text-[10px] font-black uppercase"
                      style={{ color: stage.text }}
                    >
                      {STAGE_LABEL[order.status]}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs font-bold" style={{ color: VERDE }}>
                    <p>
                      {isKioskMobOrder(order) ? "BALCÃO" : order.channel} · {fmt(order.total)}
                    </p>
                    <p className="truncate">
                      {order.customerName || "Sem nome"} · {order.customerPhone || "Sem telefone"}
                    </p>
                    <p className="truncate opacity-75">
                      {createdAt.toLocaleDateString("pt-BR")} · {createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {ageMinutes} min
                    </p>
                    {itemsPreview && (
                      <p className="line-clamp-2 text-[11px] opacity-80">
                        {itemsPreview}
                      </p>
                    )}
                  </div>
                  {order.deliveryType === "delivery" && !isKioskMobOrder(order) && (
                    <p className="mt-1 line-clamp-3 whitespace-pre-line text-[11px] font-bold" style={{ color: `${VERDE}99` }}>
                      {formatAddressForReceipt(order.customerAddress || "Endereço não informado")}
                    </p>
                  )}
                </button>
                {["CANCELLED", "DELIVERED"].includes(order.status) && (
                  <div className="grid w-12 grid-rows-2 border-l" style={{ borderColor: stage.border }}>
                    {order.status === "CANCELLED" ? (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, "ACCEPTED")}
                        className="flex items-center justify-center"
                        style={{
                          color: "#166534",
                          background: "#DCFCE7",
                          borderBottom: `1px solid ${stage.border}`,
                        }}
                        aria-label={`Reverter e aceitar pedido ${order.id}`}
                        title="Reverter e aceitar pedido"
                      >
                        <Check size={17} strokeWidth={2.6} />
                      </button>
                    ) : (
                      <span style={{ borderBottom: `1px solid ${stage.border}` }} />
                    )}
                    <button
                      type="button"
                      onClick={() => confirmDeleteFinished(order)}
                      className="flex items-center justify-center"
                      style={{
                        color: "#991B1B",
                        background: "#FEF2F2",
                      }}
                      aria-label={`Excluir pedido ${order.id}`}
                      title={order.status === "DELIVERED" ? "Excluir pedido entregue" : "Excluir pedido cancelado"}
                    >
                      <Trash2 size={17} strokeWidth={2.4} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="max-h-[calc(100dvh-190px)] overflow-y-auto rounded-2xl p-5"
          style={{ border: `1.5px solid ${ROSA}`, background: "#fff" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-black" style={{ color: VERDE }}>
                {selected.id}
              </p>
              <p
                className="text-xs font-black uppercase tracking-wide"
                style={{ color: STAGE_COLOR[selected.status].text }}
              >
                {STAGE_LABEL[selected.status]} · {paymentStatusLabel(selected)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => printOrderReceipts(selected)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black uppercase"
                style={{ background: VERDE, color: ROSA }}
              >
                <Printer size={15} /> Imprimir via
              </button>
              <button
                onClick={() => void copyOrderTxt(selected)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black uppercase"
                style={{ background: `${VERDE}10`, color: VERDE, border: `1.5px solid ${VERDE}20` }}
              >
                <FileText size={15} /> Gerar TXT
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-45">
              Dados do pedido
            </p>
            {canEditFinancials && (
              <div className="flex flex-wrap gap-2">
                {editingDetails ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelDetailEdit}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-black uppercase"
                      style={{ background: `${VERDE}08`, color: VERDE, border: `1.5px solid ${VERDE}18` }}
                    >
                      <XCircle size={13} /> Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveDetailEdit()}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-black uppercase"
                      style={{ background: "#16A34A", color: "#fff" }}
                    >
                      <Save size={13} /> Salvar dados
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={startDetailEdit}
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-black uppercase"
                    style={{ background: VERDE, color: ROSA }}
                  >
                    <Pencil size={13} /> Editar dados
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Cliente
              </p>
              {editingDetails ? (
                <input
                  value={draftDetails.customerName}
                  onChange={(event) => updateDraftDetail("customerName", event.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-bold outline-none"
                />
              ) : (
                <p className="mt-1 text-sm font-bold">
                  {selected.customerName || "Não informado"}
                </p>
              )}
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Telefone
              </p>
              {editingDetails ? (
                <input
                  value={draftDetails.customerPhone}
                  onChange={(event) => updateDraftDetail("customerPhone", event.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-bold outline-none"
                />
              ) : (
                <p className="mt-1 text-sm font-bold">
                  {selected.customerPhone || "Não informado"}
                </p>
              )}
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Tipo
              </p>
              {editingDetails ? (
                <select
                  value={draftDetails.deliveryType}
                  onChange={(event) => updateDraftDetail("deliveryType", event.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-bold outline-none"
                >
                  <option value="delivery">Entrega</option>
                  <option value="retirada">Retirada</option>
                </select>
              ) : (
                <p className="mt-1 text-sm font-bold">
                  {selectedIsKioskMob
                    ? "Balcão"
                    : selected.deliveryType === "delivery"
                      ? "Entrega"
                      : "Retirada"}
                </p>
              )}
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Codigo
              </p>
              <p className="mt-1 text-sm font-bold">
                {deliveryConfirmationCode(selected)}
              </p>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Forma de pagamento
              </p>
              {editingDetails ? (
                <select
                  value={draftDetails.paymentMethod}
                  onChange={(event) => updateDraftDetail("paymentMethod", event.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-bold outline-none"
                >
                  <option value="presencial">Presencial</option>
                  <option value="pagar_na_entrega">Pagar na entrega</option>
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              ) : (
                <p className="mt-1 text-sm font-bold">
                  {paymentMethodLabel(selected)}
                </p>
              )}
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Status do pagamento
              </p>
              {editingDetails ? (
                <input
                  value={draftDetails.paymentStatus}
                  onChange={(event) => updateDraftDetail("paymentStatus", event.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-bold outline-none"
                  placeholder="Pago"
                />
              ) : (
                <p className="mt-1 text-sm font-bold">
                  {paymentStatusLabel(selected)}
                </p>
              )}
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Total
              </p>
              <p className="mt-1 text-sm font-bold">
                {fmt(detailTotal)}
              </p>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Taxa de entrega
              </p>
              {editingDetails ? (
                <input
                  value={draftDetails.deliveryFee}
                  onChange={(event) => updateDraftDetail("deliveryFee", event.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-bold outline-none"
                />
              ) : (
                <p className="mt-1 text-sm font-bold">
                  {fmt(selectedDeliveryFee)}
                </p>
              )}
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: `${VERDE}08` }}
            >
              <p className="text-[10px] font-black uppercase opacity-50">
                Cupom
              </p>
              {editingDetails ? (
                <div className="mt-1 grid gap-2">
                  <input
                    value={draftDetails.couponCode}
                    onChange={(event) => updateDraftDetail("couponCode", event.target.value.toUpperCase())}
                    className="w-full bg-transparent text-sm font-bold uppercase outline-none"
                    placeholder="Código"
                  />
                  <input
                    value={draftDetails.discountTotal}
                    onChange={(event) => updateDraftDetail("discountTotal", event.target.value)}
                    className="w-full bg-transparent text-sm font-bold outline-none"
                    placeholder="Desconto R$"
                  />
                  <button
                    type="button"
                    onClick={removeDraftCoupon}
                    className="w-fit text-[10px] font-black uppercase"
                    style={{ color: "#991B1B" }}
                  >
                    Remover cupom
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-sm font-bold">
                  {selected.couponCode && selectedDiscount > 0
                    ? `Usado: ${selected.couponCode} (-${fmt(selectedDiscount)})`
                    : "Não usado"}
                </p>
              )}
            </div>
            {selected.deliveryType === "delivery" && !selectedIsKioskMob && (
              <div
                className="rounded-xl p-3 sm:col-span-2"
                style={{ background: `${VERDE}08` }}
              >
                <p className="text-[10px] font-black uppercase opacity-50">
                  Endereco
                </p>
                {editingDetails ? (
                  <textarea
                    value={draftDetails.customerAddress}
                    onChange={(event) => updateDraftDetail("customerAddress", event.target.value)}
                    className="mt-1 min-h-16 w-full resize-none bg-transparent text-sm font-bold leading-snug outline-none"
                  />
                ) : (
                  <p className="mt-1 whitespace-pre-line text-sm font-bold leading-snug">
                    {selectedAddress}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="admin-order-actions mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {canReleasePayment && (
              <button
                onClick={() => updateOrderStatus(selected.id, "PAID")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black uppercase"
                style={{ background: "#16A34A", color: "#fff" }}
              >
                <Check size={15} /> Liberar pagamento
              </button>
            )}
            {selected.status === "PAID" && (
              <button
                onClick={() => updateOrderStatus(selected.id, "ACCEPTED")}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{ background: "#16A34A", color: "#fff" }}
              >
                <Check size={15} /> Aceitar pedido
              </button>
            )}
            {selected.status === "ACCEPTED" && (
              <button
                onClick={() => updateOrderStatus(selected.id, "IN_PREPARATION")}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{ background: "#16A34A", color: "#fff" }}
              >
                <Check size={15} /> Iniciar preparo
              </button>
            )}
            {CANCELLABLE_STATUSES.includes(selected.status) && (
              <button
                onClick={() => setCancelTarget(selected)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{
                  background: "#FEF2F2",
                  color: "#991B1B",
                  border: "1.5px solid #FCA5A5",
                }}
              >
                <XCircle size={15} /> Cancelar pedido
              </button>
            )}
            {canEditFinancials && selected.deliveryType === "delivery" && selectedDeliveryFee <= 0 && (
              <button
                type="button"
                onClick={() => void applyDeliveryFee()}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{
                  background: `${VERDE}08`,
                  color: VERDE,
                  border: `1.5px solid ${VERDE}22`,
                }}
              >
                <Plus size={15} />
                Aplicar taxa de entrega {fmt(DELIVERY_FEE)}
              </button>
            )}
            {PREPARATION_STARTED_STATUSES.includes(selected.status) && (
              <span
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{
                  background: `${VERDE}08`,
                  color: VERDE,
                  border: `1.5px solid ${VERDE}18`,
                  opacity: 0.7,
                }}
                title="Cancelamento permitido apenas antes de entrar em preparo."
              >
                <XCircle size={15} /> Cancelamento bloqueado
              </span>
            )}
            {selected.customerPhone && !selectedIsKioskMob && (
              <a
                href={`tel:${selected.customerPhone.replace(/\D/g, "")}`}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{ border: `1.5px solid ${VERDE}`, color: VERDE }}
              >
                <Phone size={15} /> Ligar
              </a>
            )}
            {customerWhatsappUrl(selected) && !selectedIsKioskMob && (
              <a
                href={customerWhatsappUrl(selected)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{ background: "#25D366", color: "#fff" }}
              >
                <MessageCircle size={15} /> Enviar confirmação
              </a>
            )}
            {selected.status === "READY" && (
              <button
                onClick={() =>
                  updateOrderStatus(
                    selected.id,
                    selected.deliveryType === "delivery" && !selectedIsKioskMob
                      ? "OUT_FOR_DELIVERY"
                      : "DELIVERED",
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{ background: VERDE, color: ROSA }}
              >
                <BellRing size={15} />
                {selectedIsKioskMob
                  ? "Servir no balcão"
                  : selected.deliveryType === "delivery"
                    ? "Saiu para entrega"
                    : "Finalizar entregue"}
              </button>
            )}
            {selected.status === "OUT_FOR_DELIVERY" && (
              <button
                onClick={() => updateOrderStatus(selected.id, "DELIVERED")}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{ background: "#16A34A", color: "#fff" }}
              >
                <Check size={15} /> Entregue
              </button>
            )}
            {selected.status === "READY" && orderReadyWhatsappUrl(selected) && (
              <a
                href={orderReadyWhatsappUrl(selected)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase"
                style={{ background: VERDE, color: ROSA }}
              >
                <BellRing size={15} /> Avisar pronto
              </a>
            )}
          </div>

          <div
            className="mt-5 rounded-xl border p-4"
            style={{ borderColor: `${VERDE}18`, background: "#FFFDFB" }}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-45">
                  Nota detalhada
                </p>
                <p className="mt-1 text-xs font-bold opacity-60">
                  {editingItems ? "Altere quantidades ou remova itens antes de salvar." : "Mesmo detalhe usado na impressão e no TXT."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {editingItems ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelItemEdit}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-black uppercase"
                      style={{ background: `${VERDE}08`, color: VERDE, border: `1.5px solid ${VERDE}18` }}
                    >
                      <XCircle size={13} /> Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveItemEdit()}
                      disabled={draftItems.length === 0}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-black uppercase disabled:opacity-40"
                      style={{ background: "#16A34A", color: "#fff" }}
                    >
                      <Save size={13} /> Salvar
                    </button>
                  </>
                ) : (
                  EDITABLE_ITEM_STATUSES.includes(selected.status) && (
                    <button
                      type="button"
                      onClick={startItemEdit}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-3 text-[10px] font-black uppercase"
                      style={{ background: VERDE, color: ROSA }}
                    >
                      <Pencil size={13} /> Editar itens
                    </button>
                  )
                )}
                <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase" style={{ background: ROSA, color: VERDE }}>
                  Pedido {selected.id}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {detailItems.map((item, itemIndex) => {
                const components = orderItemComponents(item);
                const note = orderItemNote(item);
                return (
                  <div
                    key={`${selected.id}-${item.id}-${itemIndex}`}
                    className="rounded-xl border bg-white p-3"
                    style={{ borderColor: `${ROSA}88` }}
                  >
                    <div className="flex items-start justify-between gap-4 text-sm">
                      <div className="min-w-0">
                        <p className="font-black" style={{ color: VERDE }}>
                          {item.qty}x {item.name}
                        </p>
                        <p className="mt-1 text-xs font-bold opacity-55">
                          Unitário {fmt(item.price)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <strong>{fmt(item.price * item.qty)}</strong>
                        {editingItems && (
                          <div className="flex items-center gap-2">
                            <span className="grid h-9 grid-cols-3 overflow-hidden rounded-xl" style={{ border: `1.5px solid ${VERDE}18` }}>
                              <button
                                type="button"
                                onClick={() => updateDraftQty(itemIndex, -1)}
                                className="flex w-9 items-center justify-center"
                                style={{ color: VERDE }}
                                aria-label={`Diminuir ${item.name}`}
                              >
                                <Minus size={14} strokeWidth={2.6} />
                              </button>
                              <span className="flex w-9 items-center justify-center text-xs font-black" style={{ background: VERDE, color: ROSA }}>
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateDraftQty(itemIndex, 1)}
                                className="flex w-9 items-center justify-center"
                                style={{ color: VERDE }}
                                aria-label={`Aumentar ${item.name}`}
                              >
                                <Plus size={14} strokeWidth={2.6} />
                              </button>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeDraftItem(itemIndex)}
                              disabled={draftItems.length <= 1}
                              className="flex h-9 w-9 items-center justify-center rounded-xl disabled:opacity-35"
                              style={{ background: "#FEF2F2", color: "#991B1B", border: "1.5px solid #FCA5A5" }}
                              aria-label={`Remover ${item.name}`}
                            >
                              <Trash2 size={15} strokeWidth={2.4} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {components.length > 0 && (
                      <div className="mt-3 grid gap-1 border-t pt-3" style={{ borderColor: `${VERDE}12` }}>
                        {components.map((component) => (
                          <p key={`${item.id}-${component}`} className="text-xs font-bold opacity-75">
                            * {component}
                          </p>
                        ))}
                      </div>
                    )}

                    {note && (
                      <div className="mt-3 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: `${ROSA}55`, color: VERDE }}>
                        Obs: {note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedRemoved.length > 0 && (
              <div className="mt-3 rounded-xl px-3 py-2 text-xs font-black uppercase" style={{ background: "#FFFBEB", color: "#92400E", border: "1px solid #F59E0B" }}>
                Retirar: {selectedRemoved.join(", ")}
              </div>
            )}

            <div className="mt-4 grid gap-2 border-t pt-4 text-sm" style={{ borderColor: `${VERDE}18` }}>
              <div className="flex justify-between gap-4">
                <span>Subtotal dos itens</span>
                <strong>{fmt(detailSubtotal)}</strong>
              </div>
              {selected.deliveryType === "delivery" && (
                <div className="flex justify-between gap-4">
                  <span>Taxa de entrega</span>
                  <strong>{fmt(editedDeliveryFee)}</strong>
                </div>
              )}
              {selectedServiceFee > 0 && (
                <div className="flex justify-between gap-4">
                  <span>Taxa de serviço</span>
                  <strong>{fmt(selectedServiceFee)}</strong>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span>Cupom</span>
                <strong>
                  {editedCouponCode && editedDiscount > 0
                    ? `${editedCouponCode} usado`
                    : "Não usado"}
                </strong>
              </div>
              {editedDiscount > 0 && (
                <div className="flex justify-between gap-4" style={{ color: "#15803D" }}>
                  <span>Desconto</span>
                  <strong>-{fmt(editedDiscount)}</strong>
                </div>
              )}
              <div className="mt-2 flex justify-between gap-4 border-t pt-3 text-xl font-black" style={{ borderColor: `${VERDE}18` }}>
                <span>Total</span>
                <span>{fmt(detailTotal)}</span>
              </div>
            </div>
          </div>
          <style>{`
            .admin-order-actions > * {
              min-height: 48px;
              width: 100%;
              justify-content: center;
              text-align: center;
              padding-left: 12px;
              padding-right: 12px;
              line-height: 1.05;
            }
            .admin-order-actions svg {
              flex-shrink: 0;
            }
          `}</style>
        </div>
      </div>
      )}
      {cancelTarget && (
        <CancelOrderModal
          order={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={() => {
            updateOrderStatus(cancelTarget.id, "CANCELLED");
            setCancelTarget(null);
          }}
        />
      )}
    </div>
  );
}

function CancelOrderModal({
  order,
  onClose,
  onConfirm,
}: {
  order: Order;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center px-4"
      style={{ background: "rgba(101, 0, 31, 0.38)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-order-title"
    >
      <section
        className="w-full max-w-md rounded-3xl p-5 shadow-2xl"
        style={{ background: "#fff", border: `1.5px solid ${ROSA}` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-50">
              Confirmar cancelamento
            </p>
            <h2
              id="cancel-order-title"
              className="mt-1 text-2xl font-black"
              style={{ color: VERDE }}
            >
              Cancelar {order.id}?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full"
            style={{ background: `${VERDE}08`, color: VERDE }}
            aria-label="Fechar"
          >
            <XCircle size={18} />
          </button>
        </div>
        <p className="mt-3 text-sm font-bold leading-relaxed" style={{ color: "#7A3147" }}>
          Essa ação marca o pedido como cancelado e remove ele da fila operacional.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-xl px-4 text-xs font-black uppercase"
            style={{
              background: `${VERDE}08`,
              color: VERDE,
              border: `1.5px solid ${VERDE}18`,
            }}
          >
            Não cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-12 rounded-xl px-4 text-xs font-black uppercase"
            style={{ background: "#991B1B", color: "#fff" }}
          >
            Sim, cancelar
          </button>
        </div>
      </section>
    </div>
  );
}

/* ─── KDS — 3-COLUMN KANBAN ─────────────────────────── */
