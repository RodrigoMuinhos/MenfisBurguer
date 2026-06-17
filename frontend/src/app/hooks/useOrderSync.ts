import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeBackendOrder, normalizeOrderStatus } from "@/services/orders/normalize";
import { CartItem, Order, OrderStatus } from "@/types/order";
import { DELIVERY_FEE } from "@/components/order/checkout";
import {
  API_URL,
  PENDING_ORDER_KEY,
  Screen,
  keepHighestVisibleStatus,
  keepPendingStatus,
} from "../appState";

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
      setOrders((prev) => [
        {
          ...prev.find((item) => item.id === order.id),
          ...order,
          pixQrCode: prev.find((item) => item.id === order.id)?.pixQrCode ?? order.pixQrCode,
          pixQrCodeBase64:
            prev.find((item) => item.id === order.id)?.pixQrCodeBase64 ??
            order.pixQrCodeBase64,
          pixTicketUrl:
            prev.find((item) => item.id === order.id)?.pixTicketUrl ??
            order.pixTicketUrl,
        },
        ...prev.filter((item) => item.id !== order.id),
      ]);
      if (order.status === "DELIVERED" || order.status === "CANCELLED") {
        localStorage.removeItem(PENDING_ORDER_KEY);
      }
    } catch {
      // O retorno do pagamento nao pode derrubar a tela se o backend demorar.
    }
  }, []);

  const syncOrders = useCallback(async () => {
    try {
      if (API_URL && (screen === "tracking" || screen === "product") && lastOrderId) {
        await loadOrderById(lastOrderId);
        return;
      }

      if (API_URL && screen === "admin") {
        if (adminEventsConnectedRef.current) return;
        const res = await fetch(`${API_URL}/orders`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${adminToken}` },
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
    if (!started || screen !== "admin" || !API_URL || !adminToken) return;

    let source: EventSource;
    try {
      source = new EventSource(
        `${API_URL}/orders/events?token=${encodeURIComponent(adminToken)}`,
      );
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
            {
              ...existing,
              ...order,
              pixQrCode: existing?.pixQrCode ?? order.pixQrCode,
              pixQrCodeBase64: existing?.pixQrCodeBase64 ?? order.pixQrCodeBase64,
              pixTicketUrl: existing?.pixTicketUrl ?? order.pixTicketUrl,
            },
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
      const currentStatus = orders.find((order) => order.id === id)?.status;
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? { ...order, status } : order)),
      );
      try {
        const res = API_URL
          ? await fetch(`${API_URL}/orders/${encodeURIComponent(id)}/status`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status,
                actor: currentStatus === "PAYMENT_PENDING" ? "atendente" : "kds",
                reason:
                  currentStatus === "PAYMENT_PENDING" && status === "PAID"
                    ? "pagamento_presencial_confirmado"
                    : "kds_status_change",
              }),
            })
          : await fetch(`/api/orders/${encodeURIComponent(id)}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status }),
            });
        if (!res.ok) {
          await syncOrders();
          return;
        }
        if (API_URL) {
          const updated = normalizeBackendOrder(await res.json());
          setOrders((prev) => [
            keepHighestVisibleStatus(
              updated,
              prev.find((order) => order.id === updated.id),
            ),
            ...prev.filter((order) => order.id !== updated.id),
          ]);
        }
      } catch {
        await syncOrders();
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
              headers: { Authorization: `Bearer ${adminToken}` },
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
    async (id: string, items: CartItem[], options?: { deliveryFee?: number }) => {
      if (items.length === 0) return;
      const existing = orders.find((order) => order.id === id);
      if (!existing) return;
      const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const currentDeliveryFee = Number(existing.deliveryFee ?? 0);
      const deliveryFee = existing.deliveryType === "delivery" && subtotal > 0
        ? Math.max(Number(options?.deliveryFee ?? currentDeliveryFee), DELIVERY_FEE)
        : Number(options?.deliveryFee ?? currentDeliveryFee);
      const discount = Number(existing.discountTotal ?? 0);
      const currentSubtotal =
        existing.subtotal ?? existing.items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const serviceFee = Math.max(
        0,
        Math.round((existing.total + discount - currentSubtotal - currentDeliveryFee) * 100) / 100,
      );
      const total = Math.max(
        1,
        Math.round((subtotal + deliveryFee + serviceFee - discount) * 100) / 100,
      );
      setOrders((prev) =>
        prev.map((order) =>
          order.id === id ? { ...order, items, subtotal, deliveryFee, total } : order,
        ),
      );
      try {
        const res = API_URL
          ? await fetch(`${API_URL}/orders/${encodeURIComponent(id)}/items`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${adminToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ items, deliveryFee: options?.deliveryFee }),
            })
          : await fetch(`/api/orders/${encodeURIComponent(id)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items, deliveryFee: options?.deliveryFee }),
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
