import type { Coupon } from "./shared";
import type { CapacityItem, Movement, StockItem } from "./EstoqueView";
import type { PricingRow } from "./views/PricingView";

type ApiRow = Record<string, unknown>;

const requestHeaders = (adminToken: string, json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  ...(adminToken && adminToken !== "cookie" ? { Authorization: `Bearer ${adminToken}` } : {}),
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
    category: String(row.category ?? "Geral"),
    qty: asNumber(row.quantity),
    unitCost: asNumber(row.unit_cost),
    minQty: asNumber(row.min_quantity),
    monthlyBaseStock: asNumber(row.monthly_base_stock),
    percentRemaining: asNumber(row.percent_remaining),
    smartStatus: String(row.smart_status ?? "NORMAL") as StockItem["smartStatus"],
    entryDate: asDate(row.entry_date),
    expiryDate: asDate(row.expires_at),
  };
}

export function mapCapacityItem(row: ApiRow): CapacityItem {
  return {
    productId: String(row.productId ?? row.product_id ?? ""),
    productName: String(row.productName ?? row.product_name ?? ""),
    possibleUnits: asNumber(row.possibleUnits ?? row.possible_units),
    limitingIngredient: String(row.limitingIngredient ?? row.limiting_ingredient ?? ""),
    status: String(row.status ?? "NORMAL") as CapacityItem["status"],
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

export function mapPricingRow(row: ApiRow): PricingRow {
  const id = String(row.id);
  return {
    id,
    code: String(row.code ?? ""),
    name: String(row.name ?? ""),
    category: String(row.category ?? ""),
    kind: String(row.kind ?? "sandwich") as PricingRow["kind"],
    baseCost: asNumber(row.baseCost ?? row.base_cost),
    friesCost: asNumber(row.friesCost ?? row.fries_cost),
    defaultDrinkCost: asNumber(row.defaultDrinkCost ?? row.default_drink_cost),
    alternativeDrinkCost: asNumber(row.alternativeDrinkCost ?? row.alternative_drink_cost),
    drinkSurcharge: asNumber(row.drinkSurcharge ?? row.drink_surcharge),
    salePrice: asNumber(row.salePrice ?? row.sale_price),
    targetCmv: asNumber(row.targetCmv ?? row.target_cmv) || 0.35,
    active: row.active !== false,
    notes: String(row.notes ?? ""),
    imageUrl:
      id === "triple-combo"
        ? "/menu/supercombomnfis.png"
        : String(row.imageUrl ?? row.image_url ?? ""),
    originalPrice: asNumber(row.originalPrice ?? row.original_price) || undefined,
    updatedAt: String(row.updatedAt ?? row.updated_at ?? new Date().toISOString()),
  };
}

export async function fetchAdminStock(apiUrl: string, adminToken: string) {
  const [itemsResponse, movementsResponse, capacityResponse] = await Promise.all([
    fetch(`${apiUrl}/inventory`, { cache: "no-store", headers: requestHeaders(adminToken) }),
    fetch(`${apiUrl}/inventory/movements`, { cache: "no-store", headers: requestHeaders(adminToken) }),
    fetch(`${apiUrl}/inventory/capacity`, { cache: "no-store", headers: requestHeaders(adminToken) }),
  ]);
  if (!itemsResponse.ok) throw new Error("inventory_load_failed");
  const items = ((await itemsResponse.json()) as ApiRow[]).map(mapStockItem);
  const movements = movementsResponse.ok
    ? ((await movementsResponse.json()) as ApiRow[]).map(mapMovement)
    : [];
  const capacity = capacityResponse.ok
    ? ((await capacityResponse.json()) as ApiRow[]).map(mapCapacityItem)
    : [];
  return { items, movements, capacity };
}

export async function saveStockItem(apiUrl: string, adminToken: string, item: StockItem) {
  const body = JSON.stringify({
    id: item.id,
    name: item.name,
    unit: item.unit,
    quantity: item.qty,
    minQuantity: item.minQty,
    unitCost: item.unitCost,
    category: item.category ?? "Geral",
    monthlyBaseStock: item.monthlyBaseStock ?? item.qty,
    entryDate: item.entryDate || null,
    expiryDate: item.expiryDate || null,
  });
  const response = await fetch(`${apiUrl}/inventory/items/${encodeURIComponent(item.id)}`, {
    method: "PATCH",
    headers: requestHeaders(adminToken, true),
    body,
  });
  if (!response.ok) {
    const createResponse = await fetch(`${apiUrl}/inventory/items`, {
      method: "POST",
      headers: requestHeaders(adminToken, true),
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
    headers: requestHeaders(adminToken, true),
    body: JSON.stringify({ type, quantity, note }),
  });
  if (!response.ok) throw new Error("inventory_movement_failed");
}

export async function deleteStockItem(apiUrl: string, adminToken: string, itemId: string) {
  const response = await fetch(`${apiUrl}/inventory/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
    headers: requestHeaders(adminToken),
  });
  if (!response.ok) throw new Error("inventory_delete_failed");
}

export async function closeInventoryMonth(apiUrl: string, adminToken: string) {
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 1);
  const body = JSON.stringify({
    name: `Mês operacional ${start.toLocaleDateString("pt-BR")} a ${today.toLocaleDateString("pt-BR")}`,
    startDate: start.toISOString().slice(0, 10),
    endDate: today.toISOString().slice(0, 10),
  });
  const response = await fetch(`${apiUrl}/inventory/months/close`, {
    method: "POST",
    headers: requestHeaders(adminToken, true),
    body,
  });
  if (!response.ok) throw new Error("inventory_month_close_failed");
}

export async function fetchAdminCoupons(apiUrl: string, adminToken: string) {
  const response = await fetch(`${apiUrl}/coupons`, {
    cache: "no-store",
    headers: requestHeaders(adminToken),
  });
  if (!response.ok) throw new Error("coupons_load_failed");
  return ((await response.json()) as ApiRow[]).map(mapCoupon);
}

export async function saveAdminCoupon(apiUrl: string, adminToken: string, coupon: Coupon) {
  const response = await fetch(`${apiUrl}/coupons`, {
    method: "POST",
    headers: requestHeaders(adminToken, true),
    body: JSON.stringify(coupon),
  });
  if (!response.ok) throw new Error("coupon_save_failed");
}

export async function toggleAdminCoupon(apiUrl: string, adminToken: string, coupon: Coupon) {
  const response = await fetch(`${apiUrl}/coupons/${encodeURIComponent(coupon.code)}/active`, {
    method: "PATCH",
    headers: requestHeaders(adminToken, true),
    body: JSON.stringify({ active: coupon.active !== false }),
  });
  if (!response.ok) throw new Error("coupon_toggle_failed");
}

export async function deleteAdminCoupon(apiUrl: string, adminToken: string, code: string) {
  const response = await fetch(`${apiUrl}/coupons/${encodeURIComponent(code)}`, {
    method: "DELETE",
    headers: requestHeaders(adminToken),
  });
  if (!response.ok) throw new Error("coupon_delete_failed");
}

export async function fetchPricingProducts(apiUrl: string, adminToken: string) {
  const response = await fetch(`${apiUrl}/pricing`, {
    cache: "no-store",
    headers: requestHeaders(adminToken),
  });
  if (!response.ok) throw new Error("pricing_load_failed");
  return ((await response.json()) as ApiRow[]).map(mapPricingRow);
}

export async function savePricingProduct(apiUrl: string, adminToken: string, row: PricingRow) {
  const body = JSON.stringify(row);
  const response = await fetch(`${apiUrl}/pricing/products/${encodeURIComponent(row.id)}`, {
    method: "PATCH",
    headers: requestHeaders(adminToken, true),
    body,
  });
  if (!response.ok) {
    const createResponse = await fetch(`${apiUrl}/pricing/products`, {
      method: "POST",
      headers: requestHeaders(adminToken, true),
      body,
    });
    if (!createResponse.ok) throw new Error("pricing_save_failed");
  }
}

export async function deletePricingProduct(apiUrl: string, adminToken: string, id: string) {
  const response = await fetch(`${apiUrl}/pricing/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: requestHeaders(adminToken),
  });
  if (!response.ok) throw new Error("pricing_delete_failed");
}

export async function fetchOperationsMonitoring(apiUrl: string, adminToken: string) {
  const response = await fetch(`${apiUrl}/monitoring/operations`, {
    cache: "no-store",
    headers: requestHeaders(adminToken),
  });
  if (!response.ok) throw new Error("monitoring_load_failed");
  return response.json();
}
