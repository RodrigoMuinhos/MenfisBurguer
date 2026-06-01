"use client";

import { useState } from "react";
import { SplashScreen } from "./components/menfis/SplashScreen";
import { ProductScreen } from "./components/menfis/ProductScreen";
import { CartScreen } from "./components/menfis/CartScreen";
import { TrackingScreen } from "./components/menfis/TrackingScreen";
import { AdminPanel } from "./components/menfis/AdminPanel";
import { CartItem, Order, OrderStatus, CREME } from "./components/menfis/types";
import logoMini from "../../public/logo_M.jpeg";

type Screen = "product" | "cart" | "tracking" | "admin" | "admin-login";

const ADMIN_LOGIN = "04411750317";
const ADMIN_PASSWORD = "rodrigo123";

let orderCounter = 1000;

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

  const handlePlaceOrder = (
    deliveryType: "retirada" | "delivery",
    customerPhone?: string,
    customerAddress?: string,
    removedByItemId?: Record<string, string[]>,
  ) => {
    orderCounter += 1;
    const newOrder: Order = {
      id: `#${orderCounter}`,
      number: orderCounter,
      items: [...cart],
      removedByItemId:
        removedByItemId && Object.keys(removedByItemId).length > 0
          ? removedByItemId
          : undefined,
      deliveryType,
      customerPhone,
      customerAddress,
      total:
        cart.reduce((s, i) => s + i.price * i.qty, 0) +
        (deliveryType === "delivery" ? 5.1 : 0),
      timestamp: Date.now(),
      status: "recebido",
    };
    setOrders((prev) => [...prev, newOrder]);
    setLastOrderId(newOrder.id);
    setCart([]);
    setScreen("tracking");
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
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
            orderPlaced={true}
            orderId={lastOrderId}
            order={orders.find((o) => o.id === lastOrderId)}
            goHome={goHome}
            autoReturnMs={30000}
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
          className="mx-auto mb-4 flex items-center justify-center rounded-[28px]"
          style={{
            width: 92,
            height: 92,
            background: "#fff",
            border: `2px solid ${VERDE}12`,
            boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <img
            src={logoMini.src}
            alt="Menfi's Burger"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
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
