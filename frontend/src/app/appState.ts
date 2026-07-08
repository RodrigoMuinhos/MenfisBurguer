import { Order, OrderStatus } from "@/types/order";

export type Screen = "product" | "cart" | "tracking" | "queue" | "admin";
export type AppMode = "kiosk" | "delivery" | "admin" | "kds" | "notes";

export const MEMBER_KEY = "menfis_member";
export const PENDING_ORDER_KEY = "menfis_pending_order_id";
export const CHECKOUT_RETURN_STEP_KEY = "menfis_checkout_return_step";
export const ADMIN_SESSION_KEY = "menfis_admin_session";
export const APP_SCREEN_KEY = "menfis_app_screen";
export const CART_STORAGE_KEY = "menfis_cart";
export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/backend";
export const KIOSK_IDLE_PROMPT_MS = 2.5 * 60 * 1000;
export const KIOSK_IDLE_PROMPT_GRACE_MS = 15 * 1000;
export const CACHE_VERSION = "2026-06-12-order-isolation-1";

const STATUS_RANK: Partial<Record<OrderStatus, number>> = {
  CREATED: 0,
  PAYMENT_PENDING: 1,
  PAID: 2,
  ACCEPTED: 3,
  IN_PREPARATION: 4,
  READY: 5,
  OUT_FOR_DELIVERY: 6,
  DELIVERED: 7,
  CANCELLED: 99,
};

export function keepPendingStatus(
  order: Order,
  pendingTargets: Map<string, OrderStatus>,
) {
  const pending = pendingTargets.get(order.id);
  if (!pending) return order;
  const pendingRank = STATUS_RANK[pending] ?? 0;
  const orderRank = STATUS_RANK[order.status] ?? 0;
  return orderRank < pendingRank ? { ...order, status: pending } : order;
}

export function keepHighestVisibleStatus(incoming: Order, existing?: Order) {
  if (!existing) return incoming;
  const merged = {
    ...incoming,
    pixQrCode: incoming.pixQrCode ?? existing.pixQrCode,
    pixQrCodeBase64: incoming.pixQrCodeBase64 ?? existing.pixQrCodeBase64,
    pixTicketUrl: incoming.pixTicketUrl ?? existing.pixTicketUrl,
  };
  if (incoming.status === "CANCELLED" || incoming.status === "DELIVERED") {
    return merged;
  }
  const incomingRank = STATUS_RANK[incoming.status] ?? 0;
  const existingRank = STATUS_RANK[existing.status] ?? 0;
  if (incomingRank < existingRank) {
    return { ...merged, status: existing.status };
  }
  return merged;
}

export function registerMemberOrder() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(MEMBER_KEY);
    if (!raw) return;
    const member = JSON.parse(raw);
    const counted = Number(member.orders ?? 0) + 1;
    localStorage.setItem(
      MEMBER_KEY,
      JSON.stringify({
        ...member,
        orders: counted,
        rewards: Math.floor(counted / 10),
      }),
    );
  } catch {
    // Perfil local opcional.
  }
}

export function resolveAppMode(explicitMode?: AppMode): AppMode {
  if (explicitMode) return explicitMode;
  if (typeof window === "undefined") return "delivery";
  const pathname = window.location.pathname.replace(/\/+$/, "");
  if (pathname.endsWith("/notas")) return "notes";
  if (pathname.endsWith("/kds")) return "kds";
  if (pathname.endsWith("/adm")) return "admin";
  const params = new URLSearchParams(window.location.search);
  if (params.get("admin") === "1") return "admin";
  if (params.get("kiosk") === "1" || params.get("desktop") === "1") return "kiosk";
  return "delivery";
}
