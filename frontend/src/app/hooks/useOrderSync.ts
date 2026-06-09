import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeBackendOrder, normalizeOrderStatus } from "@/services/orders/normalize";
import { Order, OrderStatus } from "@/types/order";
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

  const loadOrderById = useCallback(async (orderId: string) => {
    if (!API_URL || !orderId) return;
    const res = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const order = normalizeBackendOrder(await res.json());
    setOrders((prev) => [
      { ...prev.find((item) => item.id === order.id), ...order },
      ...prev.filter((item) => item.id !== order.id),
    ]);
    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
      localStorage.removeItem(PENDING_ORDER_KEY);
    }
  }, []);

  const syncOrders = useCallback(async () => {
    try {
      if (API_URL && (screen === "tracking" || screen === "product") && lastOrderId) {
        await loadOrderById(lastOrderId);
        return;
      }

      if (API_URL && screen === "admin") {
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
    const timer = window.setInterval(syncOrders, 10000);
    return () => window.clearInterval(timer);
  }, [screen, started, syncOrders]);

  useEffect(() => {
    if (!started || screen !== "tracking" || !API_URL || !lastOrderId) return;

    const source = new EventSource(
      `${API_URL}/orders/${encodeURIComponent(lastOrderId)}/events`,
    );

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
    };

    return () => source.close();
  }, [lastOrderId, screen, started]);

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

  return {
    orders,
    setOrders,
    loadOrderById,
    syncOrders,
    updateOrderStatus,
  };
}
