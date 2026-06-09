const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

const root = path.resolve(__dirname, "../..");

function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

const env = {
  ...readEnv(path.join(root, ".env.local")),
  ...readEnv(path.join(root, "frontend/.env.local")),
  ...process.env,
};

const apiUrl = (env.NEXT_PUBLIC_API_URL || "http://localhost:8083").replace(
  /\/$/,
  "",
);
const databaseUrl = env.DATABASE_URL;
const jwtSecret =
  env.JWT_SECRET || "menfis-burger-jwt-secret-local-test";

if (!databaseUrl) throw new Error("DATABASE_URL ausente");

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function adminToken() {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: "e2e",
    role: "ADMIN",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const unsigned = `${base64url(header)}.${base64url(payload)}`;
  const signature = crypto
    .createHmac("sha256", jwtSecret)
    .update(unsigned)
    .digest("base64url");
  return `${unsigned}.${signature}`;
}

async function request(pathname, options = {}) {
  const response = await fetch(`${apiUrl}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `${options.method || "GET"} ${pathname} -> ${response.status}: ${JSON.stringify(body)}`,
    );
  }
  return body;
}

async function main() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  const token = adminToken();
  const pendingId = `#E2E-${Date.now()}`;
  const couponCleanupIds = [];

  try {
    await pool.query(
      `
        insert into orders (
          id, number, items, channel, delivery_type, customer_name,
          customer_phone, customer_address, subtotal, delivery_fee, total,
          payment_provider, payment_method, payment_status, timestamp, status,
          idempotency_key, updated_at
        )
        values (
          $1, 990001,
          $2::jsonb, 'KIOSK', 'RETIRADA', 'Cliente E2E',
          '(85) 99999-0000', 'Retirada na loja', 24.90, 0, 25.89,
          null, 'CARTAO', 'approved', $3, 'PAYMENT_PENDING',
          $4, now()
        )
      `,
      [
        pendingId,
        JSON.stringify([
          {
            productId: "menfis-chicken",
            name: "Menfis Chicken",
            quantity: 1,
            unitPrice: 24.9,
            totalPrice: 24.9,
          },
        ]),
        Date.now(),
        `e2e-${Date.now()}`,
      ],
    );

    const paid = await request(
      `/orders/${encodeURIComponent(pendingId)}/status`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: "PAID",
          actor: "e2e",
          reason: "approved_payment_should_leave_pending",
        }),
      },
    );
    if (paid.status !== "PAID" || paid.paymentStatus !== "approved") {
      throw new Error(`Pedido aprovado nao virou PAID: ${JSON.stringify(paid)}`);
    }

    const preparing = await request(
      `/orders/${encodeURIComponent(pendingId)}/status`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: "IN_PREPARATION",
          actor: "e2e",
          reason: "kds_advance",
        }),
      },
    );
    if (preparing.status !== "IN_PREPARATION") {
      throw new Error(`Pedido nao avancou para preparo: ${JSON.stringify(preparing)}`);
    }

    const ready = await request(
      `/orders/${encodeURIComponent(pendingId)}/status`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: "READY",
          actor: "e2e",
          reason: "kds_ready",
        }),
      },
    );
    if (ready.status !== "READY") {
      throw new Error(`Pedido nao avancou para pronto: ${JSON.stringify(ready)}`);
    }

    const order = await request("/orders", {
      method: "POST",
      body: JSON.stringify({
        items: [{ productId: "menfis-chicken", quantity: 1 }],
        channel: "KIOSK",
        deliveryType: "RETIRADA",
        paymentMethod: "CARTAO",
        customerName: "Cupom E2E",
        customerPhone: "(85) 98888-0000",
        customerAddress: "Retirada na loja",
        idempotencyKey: `e2e-chicken-${Date.now()}`,
        couponCode: "Chicken1790",
        couponDiscount: 7,
      }),
    });
    couponCleanupIds.push(order.id);

    if (Math.abs(Number(order.total) - 18.89) > 0.01) {
      throw new Error(
        `Chicken1790 deveria gerar total 18.89, recebeu ${order.total}`,
      );
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          apiUrl,
          approvedPendingFixed: pendingId,
          kdsReachedReady: ready.status,
          chicken1790Total: order.total,
        },
        null,
        2,
      ),
    );
  } finally {
    const ids = [pendingId, ...couponCleanupIds];
    await pool.query("delete from stock_movements where order_id = any($1::text[])", [
      ids,
    ]);
    await pool.query("delete from orders where id = any($1::text[])", [ids]);
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
