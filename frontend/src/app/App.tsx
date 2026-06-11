"use client";

import { useEffect, useRef, useState } from "react";
import { SplashScreen } from "@/components/product/SplashScreen";
import { ProductScreen } from "@/components/product/ProductScreen";
import { CartScreen } from "@/components/order/CartScreen";
import { TrackingScreen } from "@/components/order/TrackingScreen";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { CartItem, Order } from "@/types/order";
import { CREME, ROSA, VERDE } from "@/utils/theme";
import {
  AppMode,
  APP_SCREEN_KEY,
  ADMIN_SESSION_KEY,
  API_URL,
  CACHE_VERSION,
  CART_STORAGE_KEY,
  PENDING_ORDER_KEY,
  Screen,
  registerMemberOrder,
  resolveAppMode,
} from "./appState";
import { useAdminSession } from "./hooks/useAdminSession";
import { useKioskIdle } from "./hooks/useKioskIdle";
import { useOrderSync } from "./hooks/useOrderSync";
import { AdminLoginScreen } from "./AdminLoginScreen";
import { KioskIdleOverlays } from "./KioskIdleOverlays";
import { STATUS_COPY, STATUS_INDEX, STEPS } from "@/components/order/tracking";
import { deliveryConfirmationCode, normalizeBackendOrder } from "@/services/orders/normalize";
import { MEMBER_KEY, MEMBER_TOKEN_KEY } from "@/components/product/shared";
import { MemberNotification } from "@/components/product/notifications";

const NOTIFIABLE_STATUSES = new Set([
  "PAID",
  "IN_PREPARATION",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);
function notificationForOrder(order: Order): Omit<MemberNotification, "id" | "createdAt" | "read"> | null {
  if (!NOTIFIABLE_STATUSES.has(order.status)) return null;
  const status = STATUS_COPY[order.status] ?? STATUS_COPY.PAYMENT_PENDING;
  const title =
    order.status === "PAID"
      ? "Pedido aceito"
      : order.status === "IN_PREPARATION"
        ? "Pedido em preparo"
        : order.status === "READY"
          ? "Pedido pronto"
          : order.status === "OUT_FOR_DELIVERY"
            ? "Pedido saiu para entrega"
            : order.status === "DELIVERED"
              ? "Pedido entregue"
              : order.status === "CANCELLED"
                ? "Pedido cancelado"
                : status.label;
  const message =
    order.status === "READY"
      ? "Seu pedido ficou pronto. Acompanhe a liberação."
      : order.status === "OUT_FOR_DELIVERY"
        ? "Seu pedido saiu para entrega."
        : order.status === "DELIVERED"
          ? "Pedido finalizado. Obrigado pela preferência."
          : status.copy;
  return { orderId: order.id, title, message, status: order.status };
}

export default function App({ mode }: { mode?: AppMode }) {
  const appMode = resolveAppMode(mode);
  const adminOnlyMode = appMode === "admin" || appMode === "kds";
  const kioskMode = appMode === "kiosk";
  const [started, setStarted] = useState(() => {
    return appMode === "admin" || appMode === "kds";
  });
  const [screen, setScreen] = useState<Screen>(() => {
    if (appMode === "kds") return "admin";
    if (appMode === "admin") {
      if (typeof window === "undefined") return "admin-login";
      return localStorage.getItem(ADMIN_SESSION_KEY) ? "admin" : "admin-login";
    }
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(APP_SCREEN_KEY) as Screen | null;
      if (
        stored &&
        ["product", "cart", "tracking", "queue", "admin", "admin-login"].includes(stored)
      ) {
        return stored;
      }
    }
    return "product";
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [lastOrderId, setLastOrderId] = useState<string>("");
  const {
    adminUser,
    adminPassword,
    adminError,
    adminToken,
    setAdminUser,
    setAdminPassword,
    setAdminError,
    openAdmin,
    closeAdmin,
    handleAdminLogin,
  } = useAdminSession({ adminOnlyMode, appMode, setScreen });
  const { orders, setOrders, loadOrderById, updateOrderStatus } = useOrderSync({
    adminToken,
    lastOrderId,
    screen,
    started,
  });
  const [memberNotifications, setMemberNotifications] = useState<MemberNotification[]>([]);
  const orderStatusSnapshotRef = useRef(new Map<string, string>());
  const {
    showIdlePrompt,
    showIdleScreen,
    resetKioskActivity,
    openKioskIdleScreen,
  } = useKioskIdle({ kioskMode, screen, started, setCart, setScreen });

  useEffect(() => {
    if (localStorage.getItem("menfis_cache_version") === CACHE_VERSION) return;
    const memberToken = localStorage.getItem(MEMBER_TOKEN_KEY);
    const memberProfile = localStorage.getItem(MEMBER_KEY);
    const pendingOrderId = localStorage.getItem(PENDING_ORDER_KEY);
    const adminSession = localStorage.getItem("menfis_admin_session");
    const cartState = localStorage.getItem(CART_STORAGE_KEY);
    const appScreen = localStorage.getItem(APP_SCREEN_KEY);
    localStorage.clear();
    if (memberToken) localStorage.setItem(MEMBER_TOKEN_KEY, memberToken);
    if (memberProfile) localStorage.setItem(MEMBER_KEY, memberProfile);
    if (pendingOrderId) localStorage.setItem(PENDING_ORDER_KEY, pendingOrderId);
    if (adminSession) localStorage.setItem("menfis_admin_session", adminSession);
    if (cartState) localStorage.setItem(CART_STORAGE_KEY, cartState);
    if (appScreen) localStorage.setItem(APP_SCREEN_KEY, appScreen);
    localStorage.setItem("menfis_cache_version", CACHE_VERSION);
    if ("caches" in window) {
      void caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
    }
  }, []);

  useEffect(() => {
    if (adminOnlyMode) return;
    localStorage.setItem(APP_SCREEN_KEY, screen);
  }, [adminOnlyMode, screen]);

  useEffect(() => {
    if (kioskMode) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, kioskMode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (adminOnlyMode) {
      setStarted(true);
      setScreen(
        appMode === "kds" || localStorage.getItem(ADMIN_SESSION_KEY)
          ? "admin"
          : "admin-login",
      );
      return;
    }
    const orderId = resolvePaymentReturnOrderId(params);

    if (!orderId) return;

    setStarted(true);
    setLastOrderId(orderId);
    setScreen("tracking");
    void loadOrderById(orderId);

    const cleanUrl =
      appMode === "kiosk" && params.get("kiosk") === "1"
        ? `${window.location.pathname}?kiosk=1${window.location.hash}`
        : `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState({}, "", cleanUrl);
  }, [adminOnlyMode, appMode, loadOrderById]);

  const goHome = () => setScreen("product");
  const leaveTrackingToMenu = () => {
    localStorage.removeItem(PENDING_ORDER_KEY);
    const selectedOrder = orders.find((order) => order.id === lastOrderId);
    if (!isKioskMobOrder(selectedOrder)) {
      setLastOrderId("");
    }
    setScreen("product");
  };
  const activeOrder = lastOrderId
    ? orders.find((order) => order.id === lastOrderId)
    : undefined;
  const latestCustomerActiveOrder = orders.find(
    (order) => !isKioskMobOrder(order) && !["DELIVERED", "CANCELLED"].includes(order.status),
  );
  const kioskMobQueue = orders.filter(
    (order) => isKioskMobOrder(order) && !["DELIVERED", "CANCELLED"].includes(order.status),
  );
  const kioskMobSession = isKioskMobSession();
  const primaryKioskMobOrder = kioskMobQueue[0];
  const visibleActiveOrder =
    activeOrder && !isKioskMobOrder(activeOrder) && !["DELIVERED", "CANCELLED"].includes(activeOrder.status)
      ? activeOrder
      : latestCustomerActiveOrder;

  useEffect(() => {
    if (adminOnlyMode) return;
    setMemberNotifications((currentNotifications) => {
      const snapshot = orderStatusSnapshotRef.current;
      const created: MemberNotification[] = [];
      orders.forEach((order) => {
        const previousStatus = snapshot.get(order.id);
        snapshot.set(order.id, order.status);
        if (!previousStatus || previousStatus === order.status) return;
        const notification = notificationForOrder(order);
        if (!notification) return;
        created.push({
          ...notification,
          id: `${order.id}-${order.status}-${Date.now()}`,
          createdAt: Date.now(),
          read: false,
        });
      });
      if (created.length === 0) return currentNotifications;
      return [...created, ...currentNotifications].slice(0, 30);
    });
  }, [adminOnlyMode, orders]);

  const unreadNotificationCount = memberNotifications.filter((item) => !item.read).length;
  const markMemberNotificationsRead = () => {
    setMemberNotifications((items) =>
      items.map((item) => (item.read ? item : { ...item, read: true })),
    );
  };

  useEffect(() => {
    if (screen !== "queue") return;
    const ids = kioskMobQueue.map((order) => order.id);
    if (ids.length === 0) return;
    const syncQueue = () => {
      ids.forEach((id) => void loadOrderById(id));
    };
    syncQueue();
    const timer = window.setInterval(syncQueue, 3500);
    return () => window.clearInterval(timer);
  }, [kioskMobQueue.map((order) => order.id).join("|"), loadOrderById, screen]);

  useEffect(() => {
    if (adminOnlyMode || kioskMode || !started || typeof window === "undefined") return;
    const token = localStorage.getItem(MEMBER_TOKEN_KEY);
    if (!token || !API_URL) return;

    const controller = new AbortController();
    const syncCustomerOrders = async () => {
      try {
        const response = await fetch(`${API_URL}/customers/orders`, {
          cache: "no-store",
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const rows = await response.json();
        if (!Array.isArray(rows)) return;
        const customerOrders = rows.map(normalizeBackendOrder);
        setOrders((prev) => {
          const byId = new Map(prev.map((order) => [order.id, order]));
          customerOrders.forEach((order) => {
            const existing = byId.get(order.id);
            byId.set(order.id, existing ? { ...existing, ...order } : order);
          });
          return [...byId.values()].sort((a, b) => b.timestamp - a.timestamp);
        });
      } catch {
        // A busca de pedidos da conta nao deve bloquear a home.
      }
    };

    void syncCustomerOrders();
    const timer = window.setInterval(syncCustomerOrders, 10000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [adminOnlyMode, kioskMode, started]);

  const openInstalledAdmin = async () => {
    const desktopWindow = window as typeof window & {
      menfisDesktop?: { openAdmin: () => Promise<boolean> };
    };
    try {
      return await (desktopWindow.menfisDesktop?.openAdmin?.() ?? false);
    } catch {
      return false;
    }
  };

  const addToCart = (item: Omit<CartItem, "qty">) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === item.id);
      if (ex)
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i,
        );
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    );
  };

  const handlePlaceOrder = async (
    deliveryType: "retirada" | "delivery",
    customerPhone?: string,
    customerAddress?: string,
    removedByItemId?: Record<string, string[]>,
    createdOrder?: Order,
  ) => {
    if (createdOrder) {
      const kioskMobOrder = isKioskMobOrder(createdOrder);
      if (!kioskMode && !kioskMobOrder) {
        localStorage.setItem(PENDING_ORDER_KEY, createdOrder.id);
      }
      setOrders((prev) => [
        createdOrder,
        ...prev.filter((o) => o.id !== createdOrder.id),
      ]);
      setLastOrderId(createdOrder.id);
      setCart([]);
      localStorage.removeItem(CART_STORAGE_KEY);
      setScreen(kioskMode || kioskMobOrder ? "product" : "tracking");
      resetKioskActivity();
      registerMemberOrder();
      return;
    }

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const total = subtotal + (deliveryType === "delivery" ? 5.1 : 0);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          removedByItemId:
            removedByItemId && Object.keys(removedByItemId).length > 0
              ? removedByItemId
              : undefined,
          deliveryType,
          customerPhone,
          customerAddress,
          total,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const created = data.order as Order | undefined;
        if (created) {
          setOrders((prev) => [
            created,
            ...prev.filter((o) => o.id !== created.id),
          ]);
          setLastOrderId(created.id);
          setCart([]);
          localStorage.removeItem(CART_STORAGE_KEY);
          setScreen(isKioskMobOrder(created) ? "product" : "tracking");
          registerMemberOrder();
          return;
        }
      }
    } catch {
      // fallback below
    }

    const fallbackNumber = Date.now();
    const newOrder: Order = {
      id: `#${fallbackNumber}`,
      number: fallbackNumber,
      deliveryCode: deliveryConfirmationCode({ number: fallbackNumber }),
      channel: kioskMode ? "KIOSK" : "DELIVERY",
      items: [...cart],
      removedByItemId:
        removedByItemId && Object.keys(removedByItemId).length > 0
          ? removedByItemId
          : undefined,
      deliveryType,
      customerPhone,
      customerAddress,
      total,
      timestamp: Date.now(),
      status: "PAID",
    };
    setOrders((prev) => [...prev, newOrder]);
    setLastOrderId(newOrder.id);
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    setScreen(kioskMode || isKioskMobOrder(newOrder) ? "product" : "tracking");
    resetKioskActivity();
    registerMemberOrder();
  };

  if (!started) {
    return (
      <div
        className="size-full overflow-auto"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <SplashScreen onStart={() => setStarted(true)} />
      </div>
    );
  }

  if (adminOnlyMode) {
    return (
      <div
        className="size-full flex flex-col"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          background: CREME,
        }}
      >
        <div className="flex-1 overflow-auto">
          {screen === "admin" || appMode === "kds" ? (
            <AdminPanel
              orders={orders}
              updateOrderStatus={updateOrderStatus}
              onClose={closeAdmin}
              initialTab={appMode === "kds" ? "cozinha" : "pedidos"}
              adminToken={adminToken}
              kitchenOnly={appMode === "kds"}
            />
          ) : (
            <AdminLoginScreen
              username={adminUser}
              password={adminPassword}
              error={adminError}
              onChangeUsername={setAdminUser}
              onChangePassword={setAdminPassword}
              onSubmit={handleAdminLogin}
              onBack={() => setScreen("admin-login")}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="size-full flex flex-col"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: CREME,
      }}
    >
      <div className="flex-1 overflow-auto">
        {screen === "product" && (
          <>
          {!kioskMode && visibleActiveOrder && (
            <ActiveOrderBanner
              order={visibleActiveOrder}
              onOpen={() => setScreen("tracking")}
            />
          )}
          <ProductScreen
            cart={cart}
            addToCart={addToCart}
            updateQty={updateQty}
            goToCart={() => setScreen("cart")}
            goBack={goHome}
            onAdminOpen={kioskMode ? openInstalledAdmin : openAdmin}
            onOpenIdleScreen={openKioskIdleScreen}
            kioskMode={kioskMode}
            activeOrder={kioskMobSession ? primaryKioskMobOrder : visibleActiveOrder}
            notifications={memberNotifications}
            unreadNotificationCount={unreadNotificationCount}
            onReadNotifications={markMemberNotificationsRead}
            onOpenActiveOrder={(orderId) => {
              if (kioskMobSession) {
                setScreen("queue");
                return;
              }
              const targetOrderId = orderId || lastOrderId || visibleActiveOrder?.id;
              if (targetOrderId) {
                setLastOrderId(targetOrderId);
              }
              setScreen("tracking");
            }}
            onRepeatOrder={(items) => {
              setCart(items.map((item) => ({ ...item, qty: Math.max(1, item.qty || 1) })));
              setScreen("cart");
            }}
          />
          </>
        )}
        {screen === "admin-login" && (
          <AdminLoginScreen
            username={adminUser}
            password={adminPassword}
            error={adminError}
            onChangeUsername={setAdminUser}
            onChangePassword={setAdminPassword}
            onSubmit={handleAdminLogin}
            onBack={() => {
              setAdminError("");
              setAdminPassword("");
              goHome();
            }}
          />
        )}
        {screen === "cart" && (
          <CartScreen
            cart={cart}
            addToCart={addToCart}
            updateQty={updateQty}
            onPlaceOrder={handlePlaceOrder}
            goToMenu={goHome}
            kioskMode={kioskMode}
          />
        )}
        {screen === "tracking" && (
          <TrackingScreen
            orderPlaced={Boolean(lastOrderId)}
            orderId={lastOrderId}
            order={orders.find((o) => o.id === lastOrderId)}
            goHome={leaveTrackingToMenu}
            autoReturnMs={kioskMode ? 20000 : 0}
          />
        )}
        {screen === "queue" && (
          <KioskMobQueueScreen
            orders={kioskMobQueue}
            onBack={goHome}
            onSelect={(order) => {
              setLastOrderId(order.id);
              setScreen("tracking");
            }}
          />
        )}
        {screen === "admin" && (
          <AdminPanel
            orders={orders}
            updateOrderStatus={updateOrderStatus}
            onClose={closeAdmin}
            initialTab="pedidos"
            adminToken={adminToken}
          />
        )}
      </div>

      <KioskIdleOverlays
        kioskMode={kioskMode}
        showIdlePrompt={showIdlePrompt}
        showIdleScreen={showIdleScreen}
        screen={screen}
        onActivity={resetKioskActivity}
      />    </div>
  );
}

function normalizeKioskMobName(value?: string) {
  return String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "-").replace(/-+/g, "-");
}

function isKioskMobOrder(order?: Order | null) {
  return normalizeKioskMobName(order?.customerName) === "KIOSK-MOB";
}

function isKioskMobSession() {
  if (typeof window === "undefined") return false;
  try {
    const profile = JSON.parse(localStorage.getItem(MEMBER_KEY) ?? "{}") as { name?: string };
    return normalizeKioskMobName(profile.name) === "KIOSK-MOB";
  } catch {
    return false;
  }
}

function resolvePaymentReturnOrderId(params: URLSearchParams) {
  const pendingOrderId =
    typeof window === "undefined" ? "" : localStorage.getItem(PENDING_ORDER_KEY) ?? "";
  const raw =
    params.get("orderId") ||
    params.get("external_reference") ||
    params.get("externalReference") ||
    pendingOrderId;
  const normalized = normalizeOrderId(raw);
  if (normalized) return normalized;
  return normalizeOrderId(pendingOrderId);
}

function normalizeOrderId(value?: string | null) {
  const clean = String(value ?? "")
    .trim()
    .replace(/^MENFIS-/i, "")
    .replace(/^Pedido\s*/i, "");
  if (!clean) return "";
  if (clean.startsWith("#")) return clean;
  return /^\d+$/.test(clean) ? `#${clean}` : clean;
}

function KioskMobQueueScreen({
  orders,
  onBack,
  onSelect,
}: {
  orders: Order[];
  onBack: () => void;
  onSelect: (order: Order) => void;
}) {
  const sorted = [...orders].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="min-h-full px-4 py-5" style={{ background: "#FFF8F2", color: VERDE }}>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 rounded-2xl px-5 py-3 text-xs font-black uppercase"
        style={{ background: "#fff", color: VERDE, border: `1.5px solid ${VERDE}18` }}
      >
        Voltar ao menu
      </button>
      <div className="rounded-3xl p-5" style={{ background: "#fff", border: `1.5px solid ${ROSA}` }}>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-45">Fila do balcão</p>
        <h1 className="mt-1 text-3xl font-black">Pedidos KIOSK-MOB</h1>
        <p className="mt-1 text-xs font-bold opacity-60">
          Cada pessoa gera um pedido separado. Toque em um pedido para acompanhar.
        </p>
        <div className="mt-5 grid gap-3">
          {sorted.length === 0 ? (
            <div className="rounded-2xl p-5 text-center text-sm font-black" style={{ background: "#FFF8F2" }}>
              Nenhum pedido ativo no balcão.
            </div>
          ) : (
            sorted.map((order, index) => {
              const status = STATUS_COPY[order.status] ?? STATUS_COPY.PAYMENT_PENDING;
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => onSelect(order)}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl p-4 text-left"
                  style={{ background: "#FFF8F2", border: `1.5px solid ${VERDE}14` }}
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-black"
                    style={{ background: VERDE, color: ROSA }}
                  >
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-xl font-black">{order.id}</span>
                    <span className="mt-0.5 block text-xs font-bold opacity-65">
                      Código {deliveryConfirmationCode(order)} · {new Date(order.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </span>
                  <span className="rounded-full px-3 py-2 text-[10px] font-black uppercase" style={{ background: ROSA, color: VERDE }}>
                    {status.label}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ActiveOrderBanner({
  order,
  onOpen,
}: {
  order: Order;
  onOpen: () => void;
}) {
  const current = STATUS_INDEX[order.status] ?? 0;
  const status =
    order.status === "PAYMENT_PENDING" &&
    String(order.paymentStatus ?? "").toLowerCase() !== "approved"
      ? STATUS_COPY.PAYMENT_PENDING
      : STATUS_COPY[order.status] ?? STATUS_COPY.PAYMENT_PENDING;

  return (
    <button
      onClick={onOpen}
      className="sticky top-0 z-40 w-full border-0 px-4 py-4 text-left"
      style={{
        background: "#65001F",
        color: "#FFB3CC",
        boxShadow: "0 16px 36px rgba(101,0,31,0.28)",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest opacity-75">
              Pedido em andamento
            </p>
            <p
              className="truncate font-black"
              style={{
                fontFamily: "var(--menfis-font-display)",
                fontSize: "1.75rem",
                lineHeight: 1,
                letterSpacing: "0.04em",
              }}
            >
              {order.id} · {order.customerName || "Cliente"}
            </p>
            <p className="mt-1 text-xs font-bold opacity-80">
              {status.copy} · estimativa {status.eta}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-wide"
            style={{ background: "#FFB3CC", color: "#65001F" }}
          >
            {status.label}
          </span>
        </div>

        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))` }}
        >
          {STEPS.map((step, index) => {
            const done = index <= current;
            const active = index === current;
            const Icon = step.icon;
            return (
              <div key={step.label} className="min-w-0">
                <div
                  className="mb-1 h-1.5 rounded-full"
                  style={{ background: done ? "#FFB3CC" : "rgba(255,179,204,0.22)" }}
                />
                <div className="flex items-center gap-1.5">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: active ? "#FFB3CC" : done ? "rgba(255,179,204,0.3)" : "rgba(255,255,255,0.08)",
                      color: active ? "#65001F" : "#FFB3CC",
                      border: `1px solid ${done ? "#FFB3CC" : "rgba(255,179,204,0.24)"}`,
                    }}
                  >
                    <Icon size={14} strokeWidth={2.5} />
                  </span>
                  <span className="truncate text-[10px] font-black uppercase tracking-wide opacity-90">
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </button>
  );
}
