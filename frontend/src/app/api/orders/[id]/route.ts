import { NextResponse } from "next/server";
import { ensureOrdersSchema, getPool } from "../../_lib/db";

export const runtime = "nodejs";

type DbOrderRow = {
  id: string;
  number: string | number;
  items: unknown;
  removed_by_item_id: Record<string, string[]> | null;
  channel: "DELIVERY" | "KIOSK";
  delivery_type: "retirada" | "delivery";
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  subtotal: string | number | null;
  delivery_fee: string | number | null;
  total: string | number;
  payment_provider: string | null;
  payment_method: string | null;
  payment_status: string;
  payment_id: string | null;
  timestamp: string | number;
  status: string;
};

function mapOrder(row: DbOrderRow) {
  return {
    id: row.id,
    number: Number(row.number),
    items: Array.isArray(row.items) ? row.items : [],
    removedByItemId: row.removed_by_item_id ?? undefined,
    channel: row.channel,
    deliveryType: row.delivery_type,
    customerName: row.customer_name ?? undefined,
    customerPhone: row.customer_phone ?? undefined,
    customerAddress: row.customer_address ?? undefined,
    subtotal: row.subtotal == null ? undefined : Number(row.subtotal),
    deliveryFee: row.delivery_fee == null ? undefined : Number(row.delivery_fee),
    total: Number(row.total),
    paymentProvider: row.payment_provider ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    paymentStatus: row.payment_status,
    paymentId: row.payment_id ?? undefined,
    timestamp: Number(row.timestamp),
    status: row.status,
  };
}

function normalizeItems(rawItems: unknown[]) {
  return rawItems.map((raw) => {
    const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const id = String(item.id ?? item.productId ?? item.name ?? "").trim();
    const productId = String(item.productId ?? id).trim();
    const name = String(item.name ?? "").trim();
    const qty = Math.max(1, Math.floor(Number(item.quantity ?? item.qty ?? 1)));
    const price = Math.max(0, Number(item.unitPrice ?? item.price ?? 0));
    if (!name) throw new Error("invalid_item_name");
    return {
      id,
      productId,
      name,
      quantity: qty,
      qty,
      unitPrice: price,
      price,
      totalPrice: Math.round(price * qty * 100) / 100,
      components: Array.isArray(item.components) ? item.components : undefined,
      note: typeof item.note === "string" && item.note.trim() ? item.note.trim() : undefined,
    };
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (rawItems.length === 0) {
    return NextResponse.json({ error: "items_required" }, { status: 400 });
  }

  let items: ReturnType<typeof normalizeItems>;
  try {
    items = normalizeItems(rawItems);
  } catch {
    return NextResponse.json({ error: "invalid_items" }, { status: 400 });
  }

  await ensureOrdersSchema();

  const current = await getPool().query<{
    status: string;
    items: unknown;
    subtotal: string | number | null;
    delivery_fee: string | number | null;
    total: string | number;
    discount_total: string | number | null;
  }>(
    "select status, items, subtotal, delivery_fee, total, discount_total from orders where id = $1",
    [id],
  );

  if (current.rowCount === 0) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  if (!["PAYMENT_PENDING", "PAID", "ACCEPTED"].includes(current.rows[0].status)) {
    return NextResponse.json({ error: "order_items_not_editable" }, { status: 409 });
  }

  const subtotal = Math.round(items.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100;
  const oldItems = Array.isArray(current.rows[0].items) ? current.rows[0].items : [];
  const oldSubtotal = Number(
    current.rows[0].subtotal ??
      oldItems.reduce((sum, raw) => {
        const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
        const totalPrice = item.totalPrice == null
          ? Number(item.price ?? 0) * Number(item.quantity ?? item.qty ?? 1)
          : Number(item.totalPrice);
        return sum + totalPrice;
      }, 0),
  );
  const oldDeliveryFee = Number(current.rows[0].delivery_fee ?? 0);
  const hasRequestedDeliveryFee = body.deliveryFee != null;
  const requestedDeliveryFee = hasRequestedDeliveryFee
    ? Math.max(0, Number(body.deliveryFee))
    : 0;
  const deliveryFee =
    hasRequestedDeliveryFee && Number.isFinite(requestedDeliveryFee)
      ? Math.round(requestedDeliveryFee * 100) / 100
      : oldDeliveryFee;
  const oldTotal = Number(current.rows[0].total ?? 0);
  const discount = Number(current.rows[0].discount_total ?? 0);
  const serviceFee = Math.max(0, Math.round((oldTotal + discount - oldSubtotal - oldDeliveryFee) * 100) / 100);
  const total = Math.max(1, Math.round((subtotal + deliveryFee + serviceFee - discount) * 100) / 100);

  const updated = await getPool().query<DbOrderRow>(
    `
      update orders
      set items = $2::jsonb, subtotal = $3, delivery_fee = $4, total = $5, updated_at = now()
      where id = $1
      returning
        id, number, items, removed_by_item_id, channel, delivery_type,
        customer_name, customer_phone, customer_address, subtotal, delivery_fee,
        total, payment_provider, payment_method, payment_status, payment_id,
        timestamp, status
    `,
    [id, JSON.stringify(items), subtotal, deliveryFee, total],
  );

  return NextResponse.json({ ok: true, order: mapOrder(updated.rows[0]) });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  await ensureOrdersSchema();

  const current = await getPool().query<{ status: string }>(
    "select status from orders where id = $1",
    [id],
  );

  if (current.rowCount === 0) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  if (!["CANCELLED", "DELIVERED"].includes(current.rows[0].status)) {
    return NextResponse.json(
      { error: "only_cancelled_or_delivered_orders_can_be_deleted" },
      { status: 409 },
    );
  }

  await getPool().query("delete from orders where id = $1", [id]);

  return NextResponse.json({ ok: true });
}
