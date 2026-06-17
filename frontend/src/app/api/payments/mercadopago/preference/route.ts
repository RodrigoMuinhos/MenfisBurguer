import { NextResponse } from "next/server";
import { ensureOrdersSchema, getPool } from "../../../_lib/db";

export const runtime = "nodejs";

type DbOrderRow = {
  id: string;
};

export async function POST(request: Request) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: "mp_access_token_not_configured" },
      { status: 500 },
    );
  }

  const body = await request.json();

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "items_required" }, { status: 400 });
  }

  const paymentMethod =
    body.paymentMethod === "pix" || body.paymentMethod === "cartao"
      ? body.paymentMethod
      : null;
  if (!paymentMethod) {
    return NextResponse.json(
      { error: "invalid_payment_method" },
      { status: 400 },
    );
  }

  const deliveryType =
    body.deliveryType === "delivery" ? "delivery" : "retirada";

  const total = Number(body.total ?? 0);
  if (!Number.isFinite(total) || total <= 0) {
    return NextResponse.json({ error: "invalid_total" }, { status: 400 });
  }
  const subtotal = Math.max(0, Number(body.subtotal ?? 0));
  const deliveryFee = deliveryType === "delivery" && subtotal > 0
    ? Math.max(Number(body.deliveryFee ?? 0), 7.1)
    : 0;

  const customerPhone =
    typeof body.customerPhone === "string" && body.customerPhone.trim()
      ? body.customerPhone.trim()
      : null;
  const customerAddress =
    typeof body.customerAddress === "string" && body.customerAddress.trim()
      ? body.customerAddress.trim()
      : null;

  const origin =
    typeof body.origin === "string" && body.origin.startsWith("http")
      ? body.origin.replace(/\/$/, "")
      : "";

  await ensureOrdersSchema();

  const orderInsert = await getPool().query<DbOrderRow>(
    `
      with next_number as (
        select nextval('order_number_seq')::bigint as n
      )
      insert into orders (
        id,
        number,
        items,
        removed_by_item_id,
        delivery_type,
        customer_phone,
        customer_address,
        subtotal,
        delivery_fee,
        total,
        payment_provider,
        payment_method,
        payment_status,
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
        'mercado_pago',
        $9,
        'pending',
        $10,
        'PAID',
        now()
      from next_number
      returning id
    `,
    [
      JSON.stringify(items),
      JSON.stringify(body.removedByItemId ?? null),
      deliveryType,
      customerPhone,
      customerAddress,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      Date.now(),
    ],
  );

  const orderId = orderInsert.rows[0]?.id;
  if (!orderId) {
    return NextResponse.json(
      { error: "order_creation_failed" },
      { status: 500 },
    );
  }

  const appBaseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "") || origin;
  if (!appBaseUrl) {
    return NextResponse.json(
      { error: "app_base_url_required" },
      { status: 400 },
    );
  }

  const preferencePayload = {
    items: [
      {
        title: `Pedido ${orderId} - Menfi's Burger`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: total,
      },
    ],
    external_reference: orderId,
    notification_url: `${appBaseUrl}/api/payments/mercadopago/webhook`,
    back_urls: {
      success: `${appBaseUrl}/?payment=success&orderId=${encodeURIComponent(orderId)}`,
      failure: `${appBaseUrl}/?payment=failure&orderId=${encodeURIComponent(orderId)}`,
      pending: `${appBaseUrl}/?payment=pending&orderId=${encodeURIComponent(orderId)}`,
    },
    auto_return: "approved",
    statement_descriptor: "MENFISBURGUER",
  };

  const mpRes = await fetch(
    "https://api.mercadopago.com/checkout/preferences",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencePayload),
    },
  );

  const mpJson = await mpRes.json().catch(() => ({}));
  if (!mpRes.ok) {
    return NextResponse.json(
      {
        error: "mercadopago_preference_failed",
        details: mpJson,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    orderId,
    checkoutUrl: mpJson.init_point,
    sandboxCheckoutUrl: mpJson.sandbox_init_point,
    preferenceId: mpJson.id,
  });
}
