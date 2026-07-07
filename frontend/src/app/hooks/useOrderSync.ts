import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeBackendOrder, normalizeOrderStatus } from "@/services/orders/normalize";
import { CartItem, Order, OrderStatus, OrderUpdateOptions } from "@/types/order";
import { DELIVERY_FEE } from "@/components/order/checkout";
import {
  API_URL,
  PENDING_ORDER_KEY,
  Screen,
  keepHighestVisibleStatus,
  keepPendingStatus,
} from "../appState";

const STATUS_RANK: Partial<Record<OrderStatus, number>> = {
  CREATED: 0,
  PAYMENT_PENDING: 1,
  PAYMENT_PROOF_PENDING: 2,
  PAID: 3,
  ACCEPTED: 4,
  IN_PREPARATION: 5,
  READY: 6,
  OUT_FOR_DELIVERY: 7,
  DELIVERED: 8,
  CANCELLED: 99,
};

function hasReachedStatus(order: Order | null, target: OrderStatus) {
  if (!order) return false;
  if (order.status === target) return true;
  if (target === "CANCELLED") return order.status === "CANCELLED";
  if (order.status === "CANCELLED") return false;
  return (STATUS_RANK[order.status] ?? 0) >= (STATUS_RANK[target] ?? 0);
}

function paymentConfirmationReason(paymentMethod?: string | null) {
  const method = String(paymentMethod ?? "").toLowerCase();
  if (method.includes("pix")) return "pagamento_pix_confirmado";
  if (method === "whatsapp") return "pagamento_whatsapp_confirmado";
  if (method === "mercadopago" || method === "mercado_pago") return "pagamento_mercado_pago_confirmado";
  if (method === "cartao") return "pagamento_cartao_confirmado";
  return "pagamento_presencial_confirmado";
}

function authHeaders(adminToken: string, json = false) {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
  };
}

export function useOrderSync({
  adminToken,
  lastOrderId,
  screen,
  started,
}: {
  adminToken: string;
  lastOrderId: string;
  screen: Screen;
  started: boolean;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const pendingStatusUpdatesRef = useRef(new Map<string, OrderStatus>());
  const adminEventsConnectedRef = useRef(false);

  const loadOrderById = useCallback(async (orderId: string) => {
    try {
      if (!API_URL || !orderId) return;
      const res = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const order = normalizeBackendOrder(await res.json());
      setOrders((prev) => {
        const existing = prev.find((item) => item.id === order.id);
        return [
          keepHighestVisibleStatus(order, existing),
          ...prev.filter((item) => item.id !== order.id),
        ];
      });
      if (order.status === "DELIVERED" || order.status === "CANCELLED") {
        localStorage.removeItem(PENDING_ORDER_KEY);
      }
    } catch {
      // O retorno do pagamento nao pode derrubar a tela se o backend demorar.
    }
  }, []);

  const syncOrders = useCallback(async (options?: { force?: boolean }) => {
    try {
      if (API_URL && (screen === "tracking" || screen === "product") && lastOrderId) {
        await loadOrderById(lastOrderId);
        return;
      }

      if (API_URL && screen === "admin") {
        if (adminEventsConnectedRef.current && !options?.force) return;
        const res = await fetch(`${API_URL}/orders`, {
          cache: "no-store",
          headers: authHeaders(adminToken),
        });
        if (!res.ok) return;
        const data = await res.json();
        const rows = Array.isArray(data)
          ? data
              .map(normalizeBackendOrder)
              .map((order) =>
                keepPendingStatus(order, pendingStatusUpdatesRef.current),
              )
          : [];
        setOrders((prev) =>
          rows.map((order) =>
            keepHighestVisibleStatus(
              order,
              prev.find((existing) => existing.id === order.id),
            ),
          ),
        );
        return;
      }

      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.orders)) {
        setOrders(
          data.orders.map((order: any) => ({
            ...order,
            status: normalizeOrderStatus(String(order.status ?? "")),
          })),
        );
      }
    } catch {
      // Keep UI running even when the backend is temporarily unavailable.
    }
  }, [adminToken, lastOrderId, loadOrderById, screen]);

  useEffect(() => {
    if (!started) return;
    if (screen !== "admin" && screen !== "tracking" && !(screen === "product" && lastOrderId)) return;

    syncOrders();
    const timer = window.setInterval(
      syncOrders,
      screen === "tracking" ? 2500 : 5000,
    );
    return () => window.clearInterval(timer);
  }, [screen, started, syncOrders]);

  useEffect(() => {
    if (!started || screen !== "admin" || !API_URL) return;

    let source: EventSource;
    try {
      const streamUrl = adminToken
        ? `${API_URL}/orders/events?token=${encodeURIComponent(adminToken)}`
        : `${API_URL}/orders/events`;
      source = new EventSource(streamUrl);
    } catch {
      adminEventsConnectedRef.current = false;
      return;
    }

    source.onopen = () => {
      adminEventsConnectedRef.current = true;
    };

    source.addEventListener("orders.snapshot", (event) => {
      try {
        const rows = JSON.parse(event.data);
        if (!Array.isArray(rows)) return;
        const nextOrders = rows
          .map(normalizeBackendOrder)
          .map((order) => keepPendingStatus(order, pendingStatusUpdatesRef.current));
        setOrders((prev) =>
          nextOrders.map((order) =>
            keepHighestVisibleStatus(
              order,
              prev.find((existing) => existing.id === order.id),
            ),
          ),
        );
      } catch {
        // Polling fallback remains active if a stream payload is malformed.
      }
    });

    source.addEventListener("order.updated", (event) => {
      try {
        const updated = keepPendingStatus(
          normalizeBackendOrder(JSON.parse(event.data)),
          pendingStatusUpdatesRef.current,
        );
        setOrders((prev) => [
          keepHighestVisibleStatus(
            updated,
            prev.find((order) => order.id === updated.id),
          ),
          ...prev.filter((order) => order.id !== updated.id),
        ]);
      } catch {
        // Polling fallback remains active if a stream payload is malformed.
      }
    });

    source.onerror = () => {
      adminEventsConnectedRef.current = false;
      source.close();
      void syncOrders();
    };

    return () => {
      adminEventsConnectedRef.current = false;
      source.close();
    };
  }, [adminToken, screen, started, syncOrders]);

  useEffect(() => {
    if (!started || screen !== "tracking" || !API_URL || !lastOrderId) return;

    let source: EventSource;
    try {
      source = new EventSource(
        `${API_URL}/orders/${encodeURIComponent(lastOrderId)}/events`,
      );
    } catch {
      return;
    }

    source.addEventListener("order.updated", (event) => {
      try {
        const order = normalizeBackendOrder(JSON.parse(event.data));
        setOrders((prev) => {
          const existing = prev.find((item) => item.id === order.id);
          return [
            keepHighestVisibleStatus(order, existing),
            ...prev.filter((item) => item.id !== order.id),
          ];
        });
      } catch {
        // Invalid event payload: polling fallback remains active.
      }
    });

    source.onerror = () => {
      source.close();
      void loadOrderById(lastOrderId);
    };

    return () => source.close();
  }, [lastOrderId, loadOrderById, screen, started]);

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      if (pendingStatusUpdatesRef.current.has(id)) return;
      pendingStatusUpdatesRef.current.set(id, status);
      const currentOrder = orders.find((order) => order.id === id);
      const currentStatus = currentOrder?.status;
      if (currentStatus === status) {
        pendingStatusUpdatesRef.current.delete(id);
        return;
      }
      const statusPath: OrderStatus[] =
        currentStatus === "PAID" && status === "IN_PREPARATION"
          ? ["ACCEPTED", "IN_PREPARATION"]
          : [status];
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? { ...order, status } : order)),
      );
      try {
        let updated: Order | null = null;
        const refreshTarget = async () => {
          if (!API_URL) return null;
          const latestRes = await fetch(`${API_URL}/orders/${encodeURIComponent(id)}`, {
            cache: "no-store",
            headers: authHeaders(adminToken),
          });
          if (!latestRes.ok) return null;
          const latest = normalizeBackendOrder(await latestRes.json());
          setOrders((prev) => [
            keepHighestVisibleStatus(
              latest,
              prev.find((order) => order.id === latest.id),
            ),
            ...prev.filter((order) => order.id !== latest.id),
          ]);
          return latest;
        };
        for (const nextStatus of statusPath) {
          const res = API_URL
            ? await fetch(`${API_URL}/orders/${encodeURIComponent(id)}/status`, {
                method: "PATCH",
                headers: authHeaders(adminToken, true),
                body: JSON.stringify({
                  status: nextStatus,
                  actor: currentStatus === "PAYMENT_PENDING" ? "atendente" : "kds",
                  reason:
                    currentStatus === "PAYMENT_PENDING" && nextStatus === "PAID"
                      ? paymentConfirmationReason(currentOrder?.paymentMethod)
                      : "kds_status_change",
                }),
              })
            : await fetch(`/api/orders/${encodeURIComponent(id)}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
              });
          if (!res.ok) {
            pendingStatusUpdatesRef.current.delete(id);
            const latest = await refreshTarget();
            if (hasReachedStatus(latest, status)) return;
            await syncOrders({ force: true });
            return;
          }
          const payload = await res.json();
          updated = normalizeBackendOrder(payload.order ?? payload);
        }
        if (updated) {
          setOrders((prev) => [
            keepHighestVisibleStatus(
              updated,
              prev.find((order) => order.id === updated.id),
            ),
            ...prev.filter((order) => order.id !== updated.id),
          ]);
        }
      } catch {
        pendingStatusUpdatesRef.current.delete(id);
        try {
          const latestRes = API_URL
            ? await fetch(`${API_URL}/orders/${encodeURIComponent(id)}`, {
                cache: "no-store",
                headers: authHeaders(adminToken),
              })
            : null;
          if (latestRes?.ok) {
            const latest = normalizeBackendOrder(await latestRes.json());
            if (hasReachedStatus(latest, status)) {
              setOrders((prev) => [
                keepHighestVisibleStatus(
                  latest,
                  prev.find((order) => order.id === latest.id),
                ),
                ...prev.filter((order) => order.id !== latest.id),
              ]);
              return;
            }
          }
        } catch {
          // A forced sync below is the fallback when a direct refresh also fails.
        }
        await syncOrders({ force: true });
      } finally {
        pendingStatusUpdatesRef.current.delete(id);
      }
    },
    [adminToken, orders, syncOrders],
  );

  const deleteOrder = useCallback(
    async (id: string) => {
      const existing = orders.find((order) => order.id === id);
      if (!existing || !["CANCELLED", "DELIVERED"].includes(existing.status)) return;
      setOrders((prev) => prev.filter((order) => order.id !== id));
      try {
        const res = API_URL
          ? await fetch(`${API_URL}/orders/${encodeURIComponent(id)}`, {
              method: "DELETE",
              headers: authHeaders(adminToken),
            })
          : await fetch(`/api/orders/${encodeURIComponent(id)}`, {
              method: "DELETE",
            });
        if (!res.ok) await syncOrders();
      } catch {
        await syncOrders();
      }
    },
    [adminToken, orders, syncOrders],
  );

  const updateOrderItems = useCallback(
    async (id: string, items: CartItem[], options?: OrderUpdateOptions) => {
      if (items.length === 0) return;
      const existing = orders.find((order) => order.id === id);
      if (!existing) return;
      const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const currentDeliveryFee = Number(existing.deliveryFee ?? 0);
      const nextDeliveryType = options?.deliveryType ?? existing.deliveryType;
      const deliveryFee = nextDeliveryType === "delivery" && subtotal > 0
        ? Math.max(Number(options?.deliveryFee ?? currentDeliveryFee), DELIVERY_FEE)
        : Number(options?.deliveryFee ?? currentDeliveryFee);
      const discount = Math.max(0, Number(options?.discountTotal ?? existing.discountTotal ?? 0));
      const currentSubtotal =
        existing.subtotal ?? existing.items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const currentDiscount = Number(existing.discountTotal ?? 0);
      const serviceFee = Math.max(
        0,
        Math.round((existing.total + currentDiscount - currentSubtotal - currentDeliveryFee) * 100) / 100,
      );
      const total = Math.max(
        1,
        Math.round((subtotal + deliveryFee + serviceFee - discount) * 100) / 100,
      );
      const couponCode =
        discount > 0 ? options?.couponCode ?? existing.couponCode ?? "" : "";
      setOrders((prev) =>
        prev.map((order) =>
          order.id === id
            ? {
                ...order,
                ...options,
                items,
                subtotal,
                deliveryFee,
                deliveryType: nextDeliveryType,
                couponCode: couponCode || undefined,
                discountTotal: discount,
                total,
              }
            : order,
        ),
      );
      const body = {
        items,
        deliveryFee,
        customerName: options?.customerName,
        customerPhone: options?.customerPhone,
        customerAddress: options?.customerAddress,
        deliveryType: nextDeliveryType,
        paymentMethod: options?.paymentMethod,
        paymentStatus: options?.paymentStatus,
        couponCode,
        discountTotal: discount,
      };
      try {
        const res = API_URL
          ? await fetch(`${API_URL}/orders/${encodeURIComponent(id)}/items`, {
              method: "PATCH",
              headers: authHeaders(adminToken, true),
              body: JSON.stringify(body),
            })
          : await fetch(`/api/orders/${encodeURIComponent(id)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
        if (!res.ok) {
          await syncOrders();
          return;
        }
        const payload = await res.json();
        const updated = normalizeBackendOrder(payload.order ?? payload);
        setOrders((prev) => [
          updated,
          ...prev.filter((order) => order.id !== updated.id),
        ]);
      } catch {
        await syncOrders();
      }
    },
    [adminToken, orders, syncOrders],
  );

  return {
    orders,
    setOrders,
    loadOrderById,
    syncOrders,
    updateOrderStatus,
    deleteOrder,
    updateOrderItems,
  };
}
