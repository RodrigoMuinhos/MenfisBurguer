const { Pool } = require("pg");

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");
const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
const databaseUrl = process.env.DATABASE_URL;

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${url} -> ${response.status}: ${text}`);
  }
  return body;
}

async function api(path, options = {}) {
  return request(`${apiUrl}${path}`, options);
}

async function assertFrontendRoutes() {
  for (const route of ["/kiosk", "/adm", "/kds"]) {
    await request(`${frontendUrl}${route}`);
  }
}

async function cleanup(ids, couponCode, itemId) {
  if (!databaseUrl) return;
  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  try {
    await pool.query("delete from stock_movements where order_id = any($1::text[])", [ids]);
    await pool.query("delete from orders where id = any($1::text[])", [ids]);
    await pool.query("delete from coupons where code = $1 and test_mode = true", [couponCode]);
    await pool.query(
      "update inventory_items set test_quantity = 0, test_min_quantity = 0, test_unit_cost = 0, test_entry_date = null, test_expires_at = null where id = $1",
      [itemId],
    );
  } finally {
    await pool.end();
  }
}

async function main() {
  await assertFrontendRoutes();

  const auth = await api("/auth/kds", { method: "POST" });
  const headers = { Authorization: `Bearer ${auth.token}` };
  const suffix = Date.now();
  const couponCode = `E2E${suffix}`;
  const itemId = `e2e-item-${suffix}`;
  const createdIds = [];

  try {
    await api("/settings/test-mode", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ enabled: true }),
    });

    await api("/coupons", {
      method: "POST",
      headers,
      body: JSON.stringify({
        code: couponCode,
        label: "10% E2E",
        type: "percent",
        value: 10,
        active: true,
      }),
    });
    const coupons = await api("/coupons", { headers });
    if (!coupons.some((coupon) => coupon.code === couponCode)) {
      throw new Error("Cupom de teste não apareceu no modo teste");
    }

    await api("/inventory/items", {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: itemId,
        name: "E2E Item",
        unit: "un",
        quantity: 10,
        minQuantity: 2,
        unitCost: 1,
        entryDate: "2026-06-08",
        expiryDate: null,
      }),
    });
    const inventory = await api("/inventory", { headers });
    if (!inventory.some((item) => item.id === itemId && Number(item.quantity) === 10)) {
      throw new Error("Estoque de teste não persistiu");
    }

    const order = await api("/orders", {
      method: "POST",
      body: JSON.stringify({
        channel: "KIOSK",
        deliveryType: "RETIRADA",
        paymentMethod: "PIX",
        customerName: "E2E TESTE",
        customerPhone: "(85) 99999-0000",
        couponCode,
        items: [{ productId: "burger", quantity: 1 }],
        idempotencyKey: `e2e-kds-${suffix}`,
      }),
    });
    createdIds.push(order.id);

    const cancelOrder = await api("/orders", {
      method: "POST",
      body: JSON.stringify({
        channel: "KIOSK",
        deliveryType: "RETIRADA",
        paymentMethod: "PIX",
        customerName: "E2E CANCELAR",
        customerPhone: "(85) 99999-0001",
        items: [{ productId: "menfis-bacon", quantity: 1 }],
        idempotencyKey: `e2e-cancel-${suffix}`,
      }),
    });
    createdIds.push(cancelOrder.id);

    const cancelled = await api(`/orders/${encodeURIComponent(cancelOrder.id)}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "CANCELLED", actor: "e2e", reason: "cliente_desistiu" }),
    });
    if (cancelled.status !== "CANCELLED") throw new Error("Cancelamento antes do preparo falhou");

    const board = await api("/kds/orders", { headers });
    if (!board.paid.some((item) => item.id === order.id)) {
      throw new Error("Pedido não entrou em Pedidos aceitos no KDS");
    }
    const prep = await api(`/kds/orders/${encodeURIComponent(order.id)}/advance`, { method: "PATCH", headers });
    const ready = await api(`/kds/orders/${encodeURIComponent(order.id)}/advance`, { method: "PATCH", headers });
    if (prep.status !== "IN_PREPARATION" || ready.status !== "READY") {
      throw new Error("Avanço do KDS falhou");
    }

    await api("/settings/test-mode", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ enabled: false }),
    });
    const realOrders = await api("/orders", { headers });
    const realCoupons = await api("/coupons", { headers });
    if (realOrders.length !== 0) throw new Error(`Operação real deveria estar zerada, veio ${realOrders.length}`);
    if (realCoupons.some((coupon) => coupon.code === couponCode)) throw new Error("Cupom de teste vazou para operação real");

    console.log(JSON.stringify({
      ok: true,
      frontendRoutes: ["/kiosk", "/adm", "/kds"],
      backendFlows: ["settings", "coupons", "inventory", "orders", "cancel", "kds"],
      createdIds,
    }, null, 2));
  } finally {
    await api("/settings/test-mode", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ enabled: true }),
    }).catch(() => undefined);
    await cleanup(createdIds, couponCode, itemId);
    await api("/settings/test-mode", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ enabled: false }),
    }).catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
