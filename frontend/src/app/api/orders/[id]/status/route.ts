import { NextResponse } from "next/server";
import { ensureOrdersSchema, getPool } from "../../../_lib/db";

export const runtime = "nodejs";

const VALID_STATUS = new Set(["PAID", "ACCEPTED", "IN_PREPARATION", "READY", "OUT_FOR_DELIVERY", "DELIVERED"]);

type DbOrderRow = {
  id: string;
  number: string | number;
  items: unknown;
  removed_by_item_id: Record<string, string[]> | null;
  channel: "DELIVERY" | "KIOSK";
  delivery_type: "retirada" | "delivery";
  customer_phone: string | null;
  customer_address: string | null;
  total: string | number;
  payment_provider: string | null;
  payment_method: "pix" | "cartao" | null;
  payment_status: string;
  payment_id: string | null;
  timestamp: string | number;
  status: "PAID" | "ACCEPTED" | "IN_PREPARATION" | "READY" | "OUT_FOR_DELIVERY" | "DELIVERED";
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
    customerPhone: row.customer_phone ?? undefined,
    customerAddress: row.customer_address ?? undefined,
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json();
  const status = String(body.status ?? "");

  if (!VALID_STATUS.has(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  await ensureOrdersSchema();

  const result = await getPool().query<DbOrderRow>(
    `
      update orders
      set
        status = $2,
        payment_status = case when $2 in ('PAID', 'ACCEPTED', 'IN_PREPARATION') then 'approved' else payment_status end,
        updated_at = now()
      where id = $1
      returning
        id,
        number,
        items,
        removed_by_item_id,
        channel,
        delivery_type,
        customer_phone,
        customer_address,
        total,
        payment_provider,
        payment_method,
        payment_status,
        payment_id,
        timestamp,
        status
    `,
    [id, status],
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order: mapOrder(result.rows[0]) });
}
