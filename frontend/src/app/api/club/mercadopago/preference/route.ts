import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { ensureClubSchema, getPool } from "../../../_lib/db";

export const runtime = "nodejs";

const PLANS = {
  silver: {
    label: "Menfi's Club Silver",
    price: 6.9,
    freeShippingTotal: 5,
    discountTotal: 5,
  },
  gold: {
    label: "Menfi's Club Gold",
    price: 12.9,
    freeShippingTotal: 10,
    discountTotal: 5,
  },
} as const;

type ClubPlan = keyof typeof PLANS;

function isClubPlan(plan: unknown): plan is ClubPlan {
  return plan === "silver" || plan === "gold";
}

export async function POST(request: Request) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: "mp_access_token_not_configured" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const planId = String(body.plan ?? "").toLowerCase();
  const customerId = Number(body.customerId ?? 0);

  if (!isClubPlan(planId)) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }
  if (!Number.isInteger(customerId) || customerId <= 0) {
    return NextResponse.json({ error: "customer_required" }, { status: 400 });
  }

  const origin =
    typeof body.origin === "string" && body.origin.startsWith("http")
      ? body.origin.replace(/\/$/, "")
      : "";
  const appBaseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "") || origin;
  if (!appBaseUrl) {
    return NextResponse.json(
      { error: "app_base_url_required" },
      { status: 400 },
    );
  }

  await ensureClubSchema();

  const plan = PLANS[planId];
  const subscriptionId = randomUUID();
  const externalReference = `club:${subscriptionId}`;

  await getPool().query(
    `
      insert into customer_club_subscriptions (
        id,
        customer_id,
        plan,
        status,
        payment_status,
        free_shipping_total,
        discount_total,
        updated_at
      )
      values ($1, $2, $3, 'pending', 'pending', $4, $5, now())
    `,
    [
      subscriptionId,
      customerId,
      planId,
      plan.freeShippingTotal,
      plan.discountTotal,
    ],
  );

  const preferencePayload = {
    items: [
      {
        title: `${plan.label} - Menfi's Burger`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: plan.price,
      },
    ],
    external_reference: externalReference,
    notification_url: `${appBaseUrl}/api/payments/mercadopago/webhook`,
    back_urls: {
      success: `${appBaseUrl}/?club=success&subscriptionId=${encodeURIComponent(subscriptionId)}`,
      failure: `${appBaseUrl}/?club=failure&subscriptionId=${encodeURIComponent(subscriptionId)}`,
      pending: `${appBaseUrl}/?club=pending&subscriptionId=${encodeURIComponent(subscriptionId)}`,
    },
    auto_return: "approved",
    statement_descriptor: "MENFISCLUB",
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
    await getPool().query(
      "update customer_club_subscriptions set status = 'failed', payment_status = 'preference_failed', updated_at = now() where id = $1",
      [subscriptionId],
    );
    return NextResponse.json(
      {
        error: "mercadopago_preference_failed",
        details: mpJson,
      },
      { status: 502 },
    );
  }

  await getPool().query(
    "update customer_club_subscriptions set provider_preference_id = $2, updated_at = now() where id = $1",
    [subscriptionId, String(mpJson.id ?? "")],
  );

  return NextResponse.json({
    ok: true,
    subscriptionId,
    checkoutUrl: mpJson.init_point,
    sandboxCheckoutUrl: mpJson.sandbox_init_point,
    preferenceId: mpJson.id,
  });
}
