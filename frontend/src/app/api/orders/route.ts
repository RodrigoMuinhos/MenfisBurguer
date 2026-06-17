import { NextResponse } from "next/server";
import { ensureOrdersSchema, getPool } from "../_lib/db";

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
  payment_method: "pix" | "cartao" | null;
  payment_status: string;
  payment_id: string | null;
  timestamp: string | number;
  status: "PAID" | "ACCEPTED" | "IN_PREPARATION" | "READY" | "DELIVERED";
};

function mapOrder(row: DbOrderRow) {
  const number = Number(row.number);
  return {
    id: row.id,
    number,
    deliveryCode: deliveryConfirmationCode(number),
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

function deliveryConfirmationCode(number: number) {
  const seed = Number.isFinite(number) && number > 0 ? number : Date.now();
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const a = letters[seed % letters.length];
  const b = letters[Math.floor(seed / letters.length) % letters.length];
  const digits = String((seed * 73 + 19) % 100).padStart(2, "0");
  return `${a}${b}${digits}`;
}

export async function GET() {
  await ensureOrdersSchema();

  const result = await getPool().query<DbOrderRow>(
    `
      select
        id,
        number,
        items,
        removed_by_item_id,
        channel,
        delivery_type,
        customer_name,
        customer_phone,
        customer_address,
        total,
        payment_provider,
        payment_method,
        payment_status,
        payment_id,
        timestamp,
        status
      from orders
      order by number desc
      limit 300
    `,
  );

  return NextResponse.json({ ok: true, orders: result.rows.map(mapOrder) });
}

export async function POST(request: Request) {
  const body = await request.json();

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "items_required" }, { status: 400 });
  }

  const kioskMobCustomer =
    String(body.customerName ?? "").trim().toUpperCase().replace(/_/g, "-") === "KIOSK-MOB";
  const deliveryType = kioskMobCustomer
    ? "retirada"
    : body.deliveryType === "delivery" ? "delivery" : "retirada";
  const channel = kioskMobCustomer || body.channel === "KIOSK" ? "KIOSK" : "DELIVERY";
  const customerName = kioskMobCustomer
    ? "KIOSK-MOB"
    : typeof body.customerName === "string" && body.customerName.trim()
      ? body.customerName.trim()
      : null;
  const total = Number(body.total ?? 0);
  const subtotal = Math.max(0, Number(body.subtotal ?? 0));
  const deliveryFee = deliveryType === "delivery" && subtotal > 0
    ? Math.max(Number(body.deliveryFee ?? 0), 7.1)
    : 0;
  const paymentProvider =
    typeof body.paymentProvider === "string" && body.paymentProvider.trim()
      ? body.paymentProvider.trim()
      : null;
  const paymentMethod =
    body.paymentMethod === "pix" || body.paymentMethod === "cartao"
      ? body.paymentMethod
      : null;
  const paymentStatus =
    typeof body.paymentStatus === "string" && body.paymentStatus.trim()
      ? body.paymentStatus.trim()
      : "not_required";
  const paymentId =
    typeof body.paymentId === "string" && body.paymentId.trim()
      ? body.paymentId.trim()
      : null;

  if (!Number.isFinite(total) || total <= 0) {
    return NextResponse.json({ error: "invalid_total" }, { status: 400 });
  }

  await ensureOrdersSchema();

  const result = await getPool().query<DbOrderRow>(
    `
      with next_number as (
        select nextval('order_number_seq')::bigint as n
      )
      insert into orders (
        id,
        number,
        items,
        removed_by_item_id,
        channel,
        delivery_type,
        customer_name,
        customer_phone,
        customer_address,
        subtotal,
        delivery_fee,
        total,
        payment_provider,
        payment_method,
        payment_status,
        payment_id,
        timestamp,
        status,
        updated_at
      )
      select
        '#' || n::text,
        n,
        $1::jsonb,
        $2::jsonb,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        'PAID',
        now()
      from next_number
      returning
        id,
        number,
        items,
        removed_by_item_id,
        channel,
        delivery_type,
        customer_name,
        customer_phone,
        customer_address,
        subtotal,
        delivery_fee,
        total,
        payment_provider,
        payment_method,
        payment_status,
        payment_id,
        timestamp,
        status
    `,
    [
      JSON.stringify(items),
      JSON.stringify(body.removedByItemId ?? null),
      channel,
      deliveryType,
      customerName,
      String(body.customerPhone ?? "") || null,
      String(body.customerAddress ?? "") || null,
      subtotal,
      deliveryFee,
      total,
      paymentProvider,
      paymentMethod,
      paymentStatus,
      paymentId,
      Date.now(),
    ],
  );

  return NextResponse.json({ ok: true, order: mapOrder(result.rows[0]) });
}
