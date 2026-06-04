"use client";

import { useCallback, useEffect, useState } from "react";
import { SplashScreen } from "./components/menfis/SplashScreen";
import { ProductScreen } from "./components/menfis/ProductScreen";
import { CartScreen } from "./components/menfis/CartScreen";
import { TrackingScreen } from "./components/menfis/TrackingScreen";
import { AdminPanel } from "./components/menfis/AdminPanel";
import {
  CartItem,
  Order,
  OrderStatus,
  CREME,
  VERDE,
  ROSA,
} from "./components/menfis/types";

type Screen = "product" | "cart" | "tracking" | "admin" | "admin-login";

const ADMIN_LOGIN = "04411750317";
const ADMIN_PASSWORD = "rodrigo123";
const MEMBER_KEY = "menfis_member";
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

function registerMemberOrder() {
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
    // perfil local opcional
  }
}

function normalizeStatus(status: string): OrderStatus {
  const value = status.toUpperCase();
  if (value === "PENDING_PAYMENT" || value === "DRAFT") return "aguardando_pagamento";
  if (value === "AGUARDANDO_PAGAMENTO") return "aguardando_pagamento";
  if (value === "PAYMENT_FAILED" || value === "CANCELED") return value === "CANCELED" ? "cancelado" : "pagamento_recusado";
  if (value === "PAGAMENTO_RECUSADO") return "pagamento_recusado";
  if (value === "RECEIVED" || value === "PAID") return "recebido";
  if (value === "RECEBIDO") return "recebido";
  if (value === "PREPARING") return "preparo";
  if (value === "PREPARO") return "preparo";
  if (value === "READY") return "pronto";
  if (value === "PRONTO") return "pronto";
  if (value === "OUT_FOR_DELIVERY") return "saiu_entrega";
  if (value === "SAIU_ENTREGA") return "saiu_entrega";
  if (value === "DELIVERED") return "entregue";
  if (value === "ENTREGUE") return "entregue";
  if (value === "CANCELADO") return "cancelado";
  return "aguardando_pagamento";
}

function normalizePaymentMethod(value?: string | null): "pix" | "cartao" | undefined {
  if (!value) return undefined;
  return value.toUpperCase() === "CARTAO" ? "cartao" : "pix";
}

function normalizeBackendOrder(raw: any): Order {
  const items = Array.isArray(raw.items)
    ? raw.items.map((item: any) => ({
        id: String(item.productId ?? item.id ?? item.name ?? "item"),
        name: String(item.name ?? item.productId ?? "Item"),
        qty: Number(item.quantity ?? item.qty ?? 1),
        price: Number(item.unitPrice ?? item.price ?? 0),
      }))
    : [];
  return {
    id: String(raw.id),
    number: Number((raw.number ?? String(raw.id).replace(/\D/g, "")) || Date.now()),
    items,
    deliveryType: String(raw.deliveryType ?? raw.delivery_type).toUpperCase() === "RETIRADA" ? "retirada" : "delivery",
    customerPhone: raw.customerPhone ?? raw.customer_phone ?? undefined,
    customerAddress: raw.customerAddress ?? raw.customer_address ?? undefined,
    total: Number(raw.total ?? 0),
    paymentProvider: raw.paymentProvider ?? raw.payment_provider ?? undefined,
    paymentMethod: normalizePaymentMethod(raw.paymentMethod ?? raw.payment_method),
    paymentStatus: raw.paymentStatus ?? raw.payment_status ?? undefined,
    paymentId: raw.paymentId ?? raw.payment_id ?? undefined,
    pixQrCode: raw.pixQrCode ?? raw.pix_qr_code ?? undefined,
    pixQrCodeBase64: raw.pixQrCodeBase64 ?? raw.pix_qr_code_base64 ?? undefined,
    pixTicketUrl: raw.pixTicketUrl ?? raw.pix_ticket_url ?? undefined,
    timestamp: raw.timestamp
      ? Number(raw.timestamp)
      : raw.createdAt
        ? new Date(raw.createdAt).getTime()
        : raw.created_at
          ? new Date(raw.created_at).getTime()
          : Date.now(),
    status: normalizeStatus(String(raw.status ?? "")),
  };
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [screen, setScreen] = useState<Screen>("product");
  const [adminUser, setAdminUser] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastOrderId, setLastOrderId] = useState<string>("");

  const syncOrders = useCallback(async () => {
    try {
      if (API_URL && screen === "tracking" && lastOrderId) {
        const res = await fetch(`${API_URL}/orders/${encodeURIComponent(lastOrderId)}`, { cache: "no-store" });
        if (!res.ok) return;
        const order = normalizeBackendOrder(await res.json());
        setOrders((prev) => {
          const existing = prev.find((o) => o.id === order.id);
          return [
            {
              ...existing,
              ...order,
              pixQrCode: existing?.pixQrCode ?? order.pixQrCode,
              pixQrCodeBase64: existing?.pixQrCodeBase64 ?? order.pixQrCodeBase64,
              pixTicketUrl: existing?.pixTicketUrl ?? order.pixTicketUrl,
            },
            ...prev.filter((o) => o.id !== order.id),
          ];
        });
        return;
      }

      if (API_URL && screen === "admin") {
        const res = await fetch(`${API_URL}/kds/orders`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const rows = [
          ...(Array.isArray(data.received) ? data.received : []),
          ...(Array.isArray(data.preparing) ? data.preparing : []),
          ...(Array.isArray(data.ready) ? data.ready : []),
        ].map(normalizeBackendOrder);
        setOrders(rows);
        return;
      }

      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.orders)) {
        setOrders(data.orders.map((order: any) => ({
          ...order,
          status: normalizeStatus(String(order.status ?? "")),
        })));
      }
    } catch {
      // keep UI running even if backend is temporarily unavailable
    }
  }, [lastOrderId, screen]);

  useEffect(() => {
    if (!started) return;
    if (screen !== "admin" && screen !== "tracking") return;

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
        // invalid event payload: keep polling fallback active
      }
    });

    source.onerror = () => {
      source.close();
    };

    return () => source.close();
  }, [lastOrderId, screen, started]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");

    if (!orderId) return;

    setStarted(true);
    setLastOrderId(orderId);
    setScreen("tracking");
    syncOrders();

    const cleanUrl = `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState({}, "", cleanUrl);
  }, [syncOrders]);

  const goHome = () => setScreen("product");

  const openAdmin = () => {
    setAdminError("");
    if (adminUnlocked) {
      setScreen("admin");
      return;
    }
    setScreen("admin-login");
  };

  const closeAdmin = () => {
    setAdminUnlocked(false);
    setAdminPassword("");
    setAdminError("");
    goHome();
  };

  const handleAdminLogin = () => {
    const user = adminUser.trim();
    const pass = adminPassword.trim();
    if (user === ADMIN_LOGIN && pass === ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      setAdminError("");
      setAdminPassword("");
      setScreen("admin");
      return;
    }
    setAdminError("Login ou senha inválidos.");
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
      setOrders((prev) => [
        createdOrder,
        ...prev.filter((o) => o.id !== createdOrder.id),
      ]);
      setLastOrderId(createdOrder.id);
      setCart([]);
      setScreen("tracking");
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
          setScreen("tracking");
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
      status: "recebido",
    };
    setOrders((prev) => [...prev, newOrder]);
    setLastOrderId(newOrder.id);
    setCart([]);
    setScreen("tracking");
    registerMemberOrder();
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const res = API_URL
        ? await fetch(`${API_URL}/kds/orders/${encodeURIComponent(id)}/advance`, {
            method: "PATCH",
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
          updated,
          ...prev.filter((order) => order.id !== updated.id),
        ]);
      }
    } catch {
      await syncOrders();
    }
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
          <ProductScreen
            cart={cart}
            addToCart={addToCart}
            updateQty={updateQty}
            goToCart={() => setScreen("cart")}
            goBack={goHome}
            onAdminOpen={openAdmin}
          />
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
            updateQty={updateQty}
            onPlaceOrder={handlePlaceOrder}
            goToMenu={goHome}
          />
        )}
        {screen === "tracking" && (
          <TrackingScreen
            orderPlaced={Boolean(lastOrderId)}
            orderId={lastOrderId}
            order={orders.find((o) => o.id === lastOrderId)}
            goHome={goHome}
            autoReturnMs={0}
          />
        )}
        {screen === "admin" && (
          <AdminPanel
            orders={orders}
            updateOrderStatus={updateOrderStatus}
            onClose={closeAdmin}
          />
        )}
      </div>
    </div>
  );
}

function AdminLoginScreen({
  username,
  password,
  error,
  onChangeUsername,
  onChangePassword,
  onSubmit,
  onBack,
}: {
  username: string;
  password: string;
  error: string;
  onChangeUsername: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div
      className="min-h-full flex items-center justify-center px-4 py-8"
      style={{ background: CREME }}
    >
      <div
        className="w-full max-w-sm rounded-[28px] p-6"
        style={{
          background: "#fff",
          boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
        }}
      >
        <div
          className="mx-auto mb-4 flex items-center justify-center rounded-full"
          style={{
            position: "relative",
            width: 128,
            height: 128,
            background: `${VERDE}10`,
            border: `2px solid ${VERDE}24`,
            boxShadow: "0 14px 30px rgba(0,0,0,0.08)",
            overflow: "hidden",
            borderRadius: 999,
          }}
        >
          <div
            aria-label="Menfi's Burger"
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: VERDE,
              color: ROSA,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Bebas Neue','Arial Black',sans-serif",
              fontSize: "3.25rem",
              lineHeight: 1,
              boxShadow: "0 12px 22px rgba(31,61,46,0.28)",
            }}
          >
            M
          </div>
        </div>
        <p
          className="font-black uppercase tracking-[0.2em] text-center"
          style={{
            color: VERDE,
            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
            fontSize: "1.8rem",
            lineHeight: 1,
          }}
        >
          Acesso Admin
        </p>
        <p
          className="text-center mt-2 text-xs"
          style={{ color: VERDE, opacity: 0.55 }}
        >
          Digite seu login e senha para abrir o painel.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: VERDE, opacity: 0.45 }}
            >
              Login
            </span>
            <input
              value={username}
              onChange={(e) => onChangeUsername(e.target.value)}
              autoComplete="username"
              className="rounded-2xl px-4 py-3 outline-none"
              style={{ border: `1.5px solid ${VERDE}18`, color: VERDE }}
              inputMode="numeric"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: VERDE, opacity: 0.45 }}
            >
              Senha
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => onChangePassword(e.target.value)}
              autoComplete="current-password"
              className="rounded-2xl px-4 py-3 outline-none"
              style={{ border: `1.5px solid ${VERDE}18`, color: VERDE }}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit();
              }}
            />
          </label>

          {error && (
            <div
              className="rounded-2xl px-4 py-3 text-sm font-semibold"
              style={{ background: `${ROSA}70`, color: VERDE }}
            >
              {error}
            </div>
          )}

          <button
            onClick={onSubmit}
            className="rounded-2xl px-4 py-3 font-black uppercase tracking-[0.16em]"
            style={{ background: VERDE, color: ROSA }}
          >
            Entrar
          </button>

          <button
            onClick={onBack}
            className="rounded-2xl px-4 py-3 font-black uppercase tracking-[0.12em]"
            style={{
              background: "transparent",
              color: VERDE,
              border: `1.5px solid ${VERDE}18`,
            }}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
