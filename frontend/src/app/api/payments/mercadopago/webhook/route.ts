import { NextResponse } from "next/server";
import { ensureClubSchema, ensureOrdersSchema, getPool } from "../../../_lib/db";

export const runtime = "nodejs";

function parseNotificationId(url: URL, body: unknown) {
  const dataId = url.searchParams.get("data.id");
  const id = url.searchParams.get("id");
  if (dataId || id) return dataId || id || "";

  if (!body || typeof body !== "object") return "";
  const payload = body as {
    id?: unknown;
    data?: { id?: unknown };
    resource?: unknown;
  };

  const bodyDataId = payload.data?.id;
  if (bodyDataId) return String(bodyDataId);

  if (payload.id) return String(payload.id);

  if (typeof payload.resource === "string") {
    const match = payload.resource.match(/\/payments\/([^/?#]+)/);
    if (match?.[1]) return match[1];
  }

  return "";
}

export async function POST(request: Request) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: "mp_access_token_not_configured" },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const body = await request.json().catch(() => null);
  const paymentId = parseNotificationId(url, body);

  if (!paymentId) {
    return NextResponse.json({ ok: true, ignored: "missing_payment_id" });
  }

  const paymentRes = await fetch(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const payment = await paymentRes.json().catch(() => null);
  if (!paymentRes.ok || !payment) {
    return NextResponse.json(
      { error: "mercadopago_payment_fetch_failed", status: paymentRes.status },
      { status: 502 },
    );
  }

  const externalReference = String(payment.external_reference ?? "").trim();
  if (!externalReference) {
    return NextResponse.json({
      ok: true,
      ignored: "missing_external_reference",
    });
  }

  const paymentStatus = String(payment.status ?? "unknown").trim() || "unknown";

  if (externalReference.startsWith("club:")) {
    const subscriptionId = externalReference.slice("club:".length);
    await ensureClubSchema();

    const active = paymentStatus === "approved";
    const status = active
      ? "active"
      : paymentStatus === "rejected" || paymentStatus === "cancelled"
        ? "failed"
        : "pending";

    const subscriptionResult = await getPool().query<{
      customer_id: string;
      plan: string;
    }>(
      `
        update customer_club_subscriptions
        set
          status = $2,
          payment_status = $3,
          provider_payment_id = $4,
          started_at = case when $5 then coalesce(started_at, now()) else started_at end,
          expires_at = case when $5 then coalesce(expires_at, now() + interval '31 days') else expires_at end,
          updated_at = now()
        where id = $1
        returning customer_id, plan
      `,
      [
        subscriptionId,
        status,
        paymentStatus,
        String(payment.id ?? paymentId),
        active,
      ],
    );

    const subscription = subscriptionResult.rows[0];
    if (active && subscription) {
      await getPool().query(
        `
          update customers
          set
            club_level = $2,
            club_expires_at = now() + interval '31 days',
            club_subscription_id = $3,
            updated_at = now()
          where id = $1
        `,
        [
          subscription.customer_id,
          subscription.plan === "gold" ? "Gold" : "Silver",
          subscriptionId,
        ],
      );
    }

    return NextResponse.json({ ok: true, type: "club" });
  }

  await ensureOrdersSchema();

  await getPool().query(
    `
      update orders
      set
        payment_provider = 'mercado_pago',
        payment_status = $2,
        payment_id = $3,
        updated_at = now()
      where id = $1
    `,
    [externalReference, paymentStatus, String(payment.id ?? paymentId)],
  );

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  return POST(request);
}
