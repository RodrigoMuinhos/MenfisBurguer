"use client";

import { useState } from "react";
import { SplashScreen } from "./components/menfis/SplashScreen";
import { ProductScreen } from "./components/menfis/ProductScreen";
import { CartScreen } from "./components/menfis/CartScreen";
import { TrackingScreen } from "./components/menfis/TrackingScreen";
import { AdminPanel } from "./components/menfis/AdminPanel";
import { CartItem, Order, OrderStatus, CREME } from "./components/menfis/types";

type Screen = "product" | "cart" | "tracking" | "admin";

let orderCounter = 1000;

export default function App() {
  const [started, setStarted] = useState(false);
  const [screen, setScreen] = useState<Screen>("product");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastOrderId, setLastOrderId] = useState<string>("");

  const goHome = () => setScreen("product");

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
            onAdminOpen={() => setScreen("admin")}
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
            onClose={goHome}
          />
        )}
      </div>
    </div>
  );
}
