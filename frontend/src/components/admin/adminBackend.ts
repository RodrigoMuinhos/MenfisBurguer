import type { Coupon } from "./shared";
import type { Movement, StockItem } from "./EstoqueView";

type ApiRow = Record<string, unknown>;

const jsonHeaders = () => ({
  "Content-Type": "application/json",
});

const asNumber = (value: unknown) => Number(value ?? 0);

const asDate = (value: unknown) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

export function mapStockItem(row: ApiRow): StockItem {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    unit: String(row.unit ?? "un"),
    qty: asNumber(row.quantity),
    unitCost: asNumber(row.unit_cost),
    minQty: asNumber(row.min_quantity),
    entryDate: asDate(row.entry_date),
    expiryDate: asDate(row.expires_at),
  };
}

export function mapMovement(row: ApiRow): Movement {
  const type = String(row.type ?? "ajuste").toLowerCase();
  return {
    id: String(row.id),
    timestamp: Date.parse(String(row.created_at ?? "")) || Date.now(),
    type:
      type === "entrada" || type === "saida" || type === "cadastro" || type === "exclusao"
        ? type
        : "ajuste",
    itemName: String(row.item_name ?? row.inventory_item_id ?? ""),
    delta: asNumber(row.quantity),
    qtyBefore: asNumber(row.quantity_before),
    qtyAfter: asNumber(row.quantity_after),
    note: String(row.note ?? ""),
  };
}

export function mapCoupon(row: ApiRow): Coupon {
  const type = String(row.type);
  return {
    code: String(row.code ?? ""),
    label: String(row.label ?? ""),
    type: type === "free_shipping" ? "free_shipping" : type === "fixed_total" ? "fixed_total" : "percent",
    value: asNumber(row.value),
    active: row.active !== false,
    maxUsesPerDay: asNumber(row.maxUsesPerDay ?? row.max_uses_per_day) || undefined,
    maxUsesTotal: asNumber(row.maxUsesTotal ?? row.max_uses_total) || undefined,
    startsAt: row.startsAt || row.starts_at ? String(row.startsAt ?? row.starts_at).slice(0, 10) : undefined,
    endsAt: row.endsAt || row.ends_at ? String(row.endsAt ?? row.ends_at).slice(0, 10) : undefined,
    productIds: Array.isArray(row.productIds)
      ? row.productIds.map(String)
      : Array.isArray(row.product_ids)
        ? row.product_ids.map(String)
        : undefined,
    oncePerCustomer: row.oncePerCustomer === true || row.once_per_customer === true,
    blockSamePhone: row.blockSamePhone === true || row.block_same_phone === true,
  };
}

export async function fetchAdminStock(apiUrl: string, adminToken: string) {
  const [itemsResponse, movementsResponse] = await Promise.all([
    fetch(`${apiUrl}/inventory`, { cache: "no-store" }),
    fetch(`${apiUrl}/inventory/movements`, { cache: "no-store" }),
  ]);
  if (!itemsResponse.ok) throw new Error("inventory_load_failed");
  const items = ((await itemsResponse.json()) as ApiRow[]).map(mapStockItem);
  const movements = movementsResponse.ok
    ? ((await movementsResponse.json()) as ApiRow[]).map(mapMovement)
    : [];
  return { items, movements };
}

export async function saveStockItem(apiUrl: string, adminToken: string, item: StockItem) {
  const body = JSON.stringify({
    id: item.id,
    name: item.name,
    unit: item.unit,
    quantity: item.qty,
    minQuantity: item.minQty,
    unitCost: item.unitCost,
    entryDate: item.entryDate || null,
    expiryDate: item.expiryDate || null,
  });
  const response = await fetch(`${apiUrl}/inventory/items/${encodeURIComponent(item.id)}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body,
  });
  if (!response.ok) {
    const createResponse = await fetch(`${apiUrl}/inventory/items`, {
      method: "POST",
      headers: jsonHeaders(),
      body,
    });
    if (!createResponse.ok) throw new Error("inventory_save_failed");
  }
}

export async function moveStockItem(
  apiUrl: string,
  adminToken: string,
  itemId: string,
  type: "entrada" | "saida",
  quantity: number,
  note: string,
) {
  const response = await fetch(`${apiUrl}/inventory/items/${encodeURIComponent(itemId)}/movement`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ type, quantity, note }),
  });
  if (!response.ok) throw new Error("inventory_movement_failed");
}

export async function deleteStockItem(apiUrl: string, adminToken: string, itemId: string) {
  const response = await fetch(`${apiUrl}/inventory/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("inventory_delete_failed");
}

export async function fetchAdminCoupons(apiUrl: string, adminToken: string) {
  const response = await fetch(`${apiUrl}/coupons`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("coupons_load_failed");
  return ((await response.json()) as ApiRow[]).map(mapCoupon);
}

export async function saveAdminCoupon(apiUrl: string, adminToken: string, coupon: Coupon) {
  const response = await fetch(`${apiUrl}/coupons`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(coupon),
  });
  if (!response.ok) throw new Error("coupon_save_failed");
}

export async function toggleAdminCoupon(apiUrl: string, adminToken: string, coupon: Coupon) {
  const response = await fetch(`${apiUrl}/coupons/${encodeURIComponent(coupon.code)}/active`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify({ active: coupon.active !== false }),
  });
  if (!response.ok) throw new Error("coupon_toggle_failed");
}

export async function deleteAdminCoupon(apiUrl: string, adminToken: string, code: string) {
  const response = await fetch(`${apiUrl}/coupons/${encodeURIComponent(code)}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("coupon_delete_failed");
}

export async function fetchOperationsMonitoring(apiUrl: string, adminToken: string) {
  const response = await fetch(`${apiUrl}/monitoring/operations`, {
    cache: "no-store",
    headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined,
  });
  if (!response.ok) throw new Error("monitoring_load_failed");
  return response.json();
}
