import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import {
  ChefHat,
  ClipboardList,
  Bike,
  MessageCircle,
  Package,
  TicketPercent,
  TrendingUp,
  Users,
} from "lucide-react";
import { CartItem, Order, OrderStatus, OrderUpdateOptions } from "@/types/order";
import {
  DEFAULT_OPERATING_HOURS,
  DELIVERY_FEE,
  OperatingHoursConfig,
  SERVICE_FEE,
  normalizeOperatingHours,
} from "@/components/order/checkout";
import { VERDE } from "@/utils/theme";
import { EstoqueView, INITIAL_ITEMS, Movement, StockItem } from "./EstoqueView";
import { AdminHeader, AdminTabs, PaymentRequestsAlert } from "./AdminChrome";
import {
  API_URL,
  COUPON_STORAGE_KEY,
  Coupon,
  DEFAULT_COUPONS,
  MENU_STOCK_MAP,
  SupportTicket,
  couponLabel,
  isKioskMobOrder,
  loadStoredCoupons,
  mergeCoupons,
  playAdminPaymentAlert,
  uid,
} from "./shared";
import { CouponsView } from "./views/CouponsView";
import { ConfigView } from "./views/ConfigView";
import { CustomersCrmView, CrmCustomer } from "./views/CustomersCrmView";
import { DashboardView } from "./views/DashboardView";
import { KitchenView } from "./views/KitchenView";
import { OrdersView } from "./views/OrdersView";
import { SupportView } from "./views/SupportView";
import {
  deleteAdminCoupon,
  saveAdminCoupon,
  toggleAdminCoupon,
} from "./adminBackend";
import { useAdminBackend } from "./useAdminBackend";
import { generateDemoOrders, isDemoOrder } from "./demoOrders";

export type AdminTab = "pedidos" | "cozinha" | "entrega" | "dashboard" | "estoque" | "clientes" | "suporte" | "cupons" | "config";

interface Props {
  orders: Order[];
  updateOrderStatus: (id: string, status: OrderStatus) => void | Promise<void>;
  deleteOrder: (id: string) => void | Promise<void>;
  updateOrderItems: (id: string, items: CartItem[], options?: OrderUpdateOptions) => void | Promise<void>;
  onClose: () => void;
  initialTab?: AdminTab;
  adminToken: string;
  kitchenOnly?: boolean;
}

export function AdminPanel({
  orders,
  updateOrderStatus,
  deleteOrder,
  updateOrderItems,
  onClose,
  initialTab = "pedidos",
  adminToken,
  kitchenOnly = false,
}: Props) {
  const [tab, setTab] = useState<AdminTab>(() => {
    if (kitchenOnly || typeof window === "undefined") return initialTab;
    const stored = localStorage.getItem("menfis_admin_tab") as AdminTab | null;
    return stored ?? initialTab;
  });
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [crmCustomers, setCrmCustomers] = useState<CrmCustomer[]>([]);
  const [customCoupons, setCustomCoupons] = useState<Coupon[]>(() =>
    loadStoredCoupons(),
  );
  const [couponCode, setCouponCode] = useState("");
  const [couponValue, setCouponValue] = useState("10");
  const [couponType, setCouponType] = useState<"percent" | "fixed_total">(
    "percent",
  );
  const [couponMaxUsesPerDay, setCouponMaxUsesPerDay] = useState("");
  const [couponMaxUsesTotal, setCouponMaxUsesTotal] = useState("");
  const [couponStartsAt, setCouponStartsAt] = useState("");
  const [couponEndsAt, setCouponEndsAt] = useState("");
  const [couponProductIds, setCouponProductIds] = useState("");
  const [couponOncePerCustomer, setCouponOncePerCustomer] = useState(true);
  const [couponBlockSamePhone, setCouponBlockSamePhone] = useState(true);
  const [editingCouponCode, setEditingCouponCode] = useState("");
  const [payOnDeliveryEnabled, setPayOnDeliveryEnabled] = useState(true);
  const [testModeEnabled, setTestModeEnabled] = useState(false);
  const [demoTableEnabled, setDemoTableEnabled] = useState(false);
  const [featuredProductId, setFeaturedProductId] = useState("chicken-super-combo");
  const [operatingHours, setOperatingHours] = useState<OperatingHoursConfig>(DEFAULT_OPERATING_HOURS);
  const [savedOperatingHours, setSavedOperatingHours] = useState<OperatingHoursConfig>(DEFAULT_OPERATING_HOURS);
  const [savingPayOnDelivery, setSavingPayOnDelivery] = useState(false);
  const [demoOrders, setDemoOrders] = useState<Order[]>(() => generateDemoOrders());

  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_ITEMS);
  const [stockMovements, setStockMovements] = useState<Movement[]>([]);
  const stockItemsRef = useRef(stockItems);
  const notifiedPaymentRequestsRef = useRef<Set<string>>(new Set());
  stockItemsRef.current = stockItems;

  const deductStockForOrder = (order: Order) => {
    const current = stockItemsRef.current;
    const deductions = new Map<string, number>();
    order.items.forEach((cartItem) => {
      (MENU_STOCK_MAP[cartItem.id] ?? []).forEach(({ stockId, qty }) => {
        deductions.set(
          stockId,
          (deductions.get(stockId) ?? 0) + qty * cartItem.qty,
        );
      });
    });

    setStockItems((prev) =>
      prev.map((si) => {
        const d = deductions.get(si.id);
        return d !== undefined ? { ...si, qty: Math.max(0, si.qty - d) } : si;
      }),
    );

    const newMovs: Movement[] = [];
    deductions.forEach((delta, stockId) => {
      const si = current.find((s) => s.id === stockId);
      if (!si || delta <= 0) return;
      newMovs.push({
        id: uid(),
        timestamp: Date.now(),
        type: "saida",
        itemName: si.name,
        delta: -delta,
        qtyBefore: si.qty,
        qtyAfter: Math.max(0, si.qty - delta),
        note: `Pedido ${order.id} aceito`,
      });
    });
    if (newMovs.length > 0) setStockMovements((prev) => [...newMovs, ...prev]);
  };

  const tabs: { id: AdminTab; label: string; Icon: ElementType }[] = [
    { id: "pedidos", label: "Pedidos", Icon: ClipboardList },
    { id: "cozinha", label: "Cozinha", Icon: ChefHat },
    { id: "entrega", label: "Entrega", Icon: Bike },
    { id: "dashboard", label: "Dashboard", Icon: TrendingUp },
    { id: "estoque", label: "Estoque", Icon: Package },
    { id: "clientes", label: "Clientes", Icon: Users },
    { id: "suporte", label: "Suporte", Icon: MessageCircle },
    { id: "cupons", label: "Cupons", Icon: TicketPercent },
  ];

  const visibleOrders = useMemo(
    () => (demoTableEnabled ? [...demoOrders, ...orders] : orders),
    [demoOrders, demoTableEnabled, orders],
  );

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    if (isDemoOrder(id)) {
      setDemoOrders((prev) =>
        prev.map((order) =>
          order.id === id
            ? {
                ...order,
                status,
                paymentStatus: ["PAID", "ACCEPTED", "IN_PREPARATION"].includes(status)
                  ? "Pago"
                  : order.paymentStatus,
              }
            : order,
        ),
      );
      return;
    }
    await updateOrderStatus(id, status);
  };

  const handleDeleteOrder = async (id: string) => {
    if (isDemoOrder(id)) {
      setDemoOrders((prev) => prev.filter((order) => order.id !== id));
      return;
    }
    await deleteOrder(id);
  };

  const handleUpdateOrderItems = async (id: string, items: CartItem[], options?: OrderUpdateOptions) => {
    if (isDemoOrder(id)) {
      setDemoOrders((prev) =>
        prev.map((order) => {
          if (order.id !== id) return order;
          const subtotal = Math.round(items.reduce((sum, item) => sum + item.price * item.qty, 0) * 100) / 100;
          const deliveryType = options?.deliveryType ?? order.deliveryType;
          const deliveryFee = deliveryType === "delivery" && subtotal > 0
            ? Math.max(Number(options?.deliveryFee ?? order.deliveryFee ?? 0), DELIVERY_FEE)
            : Number(options?.deliveryFee ?? order.deliveryFee ?? 0);
          const discount = Math.max(0, Number(options?.discountTotal ?? order.discountTotal ?? 0));
          const serviceFee = deliveryType === "delivery" && subtotal > 0 ? SERVICE_FEE : 0;
          const total = Math.max(
            1,
            Math.round((subtotal + deliveryFee + serviceFee - discount) * 100) / 100,
          );
          const couponCode =
            discount > 0 ? options?.couponCode ?? order.couponCode ?? "" : "";
          return {
            ...order,
            ...options,
            items,
            subtotal,
            deliveryType,
            deliveryFee,
            couponCode: couponCode || undefined,
            discountTotal: discount,
            total,
          };
        }),
      );
      return;
    }
    await updateOrderItems(id, items, options);
  };

  const activeOrders = visibleOrders.filter(
    (o) => !["DELIVERED", "CANCELLED", "CANCELLED"].includes(o.status),
  ).length;
  const openPaymentRequests = visibleOrders.filter(
    (order) =>
      order.status === "PAYMENT_PENDING" &&
      order.paymentMethod === "presencial" &&
      String(order.paymentStatus ?? "").toLowerCase() !== "approved",
  );
  const tabCount: Partial<Record<AdminTab, number>> = {
    pedidos: activeOrders,
    cozinha: visibleOrders.filter((order) =>
      ["PAID", "ACCEPTED", "IN_PREPARATION", "READY"].includes(order.status),
    ).length,
    entrega: visibleOrders.filter(
      (order) =>
        order.deliveryType === "delivery" &&
        !isKioskMobOrder(order) &&
        ["READY", "OUT_FOR_DELIVERY"].includes(order.status),
    ).length,
    estoque: stockItems.filter((item) => item.qty <= item.minQty).length,
    clientes: crmCustomers.length,
    suporte: supportTickets.filter((ticket) => ticket.status !== "RESOLVED")
      .length,
    cupons: mergeCoupons(customCoupons).filter(
      (coupon) => coupon.active !== false,
    ).length,
  };

  useEffect(() => {
    if (kitchenOnly) return;
    localStorage.setItem("menfis_admin_tab", tab);
  }, [kitchenOnly, tab]);

  const {
    adminDataError,
    setAdminDataError,
    syncCoupons,
    persistStockItem,
    persistStockMovement,
    persistStockDelete,
  } = useAdminBackend({
    adminToken,
    kitchenOnly,
    setStockItems,
    setStockMovements,
    setCustomCoupons,
  });

  useEffect(() => {
    const currentIds = new Set(openPaymentRequests.map((order) => order.id));
    const hasNewRequest = openPaymentRequests.some(
      (order) => !notifiedPaymentRequestsRef.current.has(order.id),
    );
    if (hasNewRequest) playAdminPaymentAlert();
    notifiedPaymentRequestsRef.current = currentIds;
    document.title =
      openPaymentRequests.length > 0
        ? `(${openPaymentRequests.length}) Pagamento no caixa - Menfi's`
        : "Menfi's ERP";
    return () => {
      document.title = "Menfi's Burger";
    };
  }, [openPaymentRequests.map((order) => order.id).join("|")]);

  const applyPublicSettings = (settings: Record<string, unknown>) => {
    setPayOnDeliveryEnabled(settings.payOnDeliveryEnabled !== false);
    setTestModeEnabled(settings.testModeEnabled === true);
    setDemoTableEnabled(settings.demoTableEnabled === true);
    setFeaturedProductId(String(settings.featuredProductId ?? "chicken-super-combo"));
    const normalizedHours = normalizeOperatingHours(settings.operatingHours);
    setOperatingHours(normalizedHours);
    setSavedOperatingHours(normalizedHours);
  };

  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/settings/public`, { cache: "no-store" })
      .then((response) => response.json())
      .then((settings) => applyPublicSettings(settings))
      .catch(() => undefined);
  }, []);

  const updateSetting = async (path: string, enabled: boolean) => {
    if (!API_URL || savingPayOnDelivery) return;
    setSavingPayOnDelivery(true);
    try {
      const response = await fetch(`${API_URL}${path}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) return;
      const settings = await response.json();
      applyPublicSettings(settings);
      await syncCoupons();
    } finally {
      setSavingPayOnDelivery(false);
    }
  };

  const togglePayOnDelivery = () =>
    updateSetting("/settings/pay-on-delivery", !payOnDeliveryEnabled);

  const toggleTestMode = () =>
    updateSetting("/settings/test-mode", !testModeEnabled);

  const toggleDemoTable = () =>
    updateSetting("/settings/demo-table", !demoTableEnabled);

  const updateFeaturedProduct = async (productId: string) => {
    setFeaturedProductId(productId);
    if (!API_URL || savingPayOnDelivery) return;
    setSavingPayOnDelivery(true);
    try {
      const response = await fetch(`${API_URL}/settings/featured-product`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });
      if (!response.ok) return;
      const settings = await response.json();
      applyPublicSettings(settings);
    } finally {
      setSavingPayOnDelivery(false);
    }
  };

  const updateOperatingHours = (next: OperatingHoursConfig) => {
    const normalized = normalizeOperatingHours(next);
    setOperatingHours(normalized);
  };

  const saveOperatingHours = async () => {
    if (!API_URL || savingPayOnDelivery) return;
    setSavingPayOnDelivery(true);
    try {
      const response = await fetch(`${API_URL}/settings/operating-hours`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ operatingHours: normalizeOperatingHours(operatingHours) }),
      });
      if (!response.ok) {
        setAdminDataError("Não foi possível salvar os horários de atendimento.");
        return;
      }
      const settings = await response.json();
      applyPublicSettings(settings);
      setAdminDataError("");
    } catch {
      setAdminDataError("Não foi possível salvar os horários de atendimento.");
    } finally {
      setSavingPayOnDelivery(false);
    }
  };

  const resetRealOperation = async () => {
    if (!API_URL || savingPayOnDelivery) return;
    const confirmed = window.confirm("Zerar histórico real, cupons reais e estoque real?");
    if (!confirmed) return;
    setSavingPayOnDelivery(true);
    try {
      const response = await fetch(`${API_URL}/settings/reset-real-operation`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) return;
      await response.json();
      window.location.reload();
    } finally {
      setSavingPayOnDelivery(false);
    }
  };

  const syncSupportTickets = async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/support/tickets`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      setSupportTickets(await res.json());
    } catch {
      // support panel is optional when backend is offline
    }
  };

  useEffect(() => {
    if (tab !== "suporte") return;
    syncSupportTickets();
    const timer = window.setInterval(syncSupportTickets, 10000);
    return () => window.clearInterval(timer);
  }, [tab]);

  const syncCrmCustomers = async () => {
    if (!API_URL || !adminToken) return;
    try {
      const res = await fetch(`${API_URL}/customers/crm`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) setCrmCustomers(await res.json());
    } catch {
      setAdminDataError("Não foi possível carregar o CRM de clientes.");
    }
  };

  useEffect(() => {
    if (tab !== "clientes") return;
    syncCrmCustomers();
  }, [tab, adminToken]);

  const resolveSupportTicket = async (id: string) => {
    setSupportTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === id
          ? {
              ...ticket,
              status: "RESOLVED",
              resolvedAt: new Date().toISOString(),
            }
          : ticket,
      ),
    );
    if (!API_URL) return;
    try {
      await fetch(
        `${API_URL}/support/tickets/${encodeURIComponent(id)}/resolve`,
        {
          method: "PATCH",
        },
      );
      await syncSupportTickets();
    } catch {
      await syncSupportTickets();
    }
  };

  const saveCustomCoupons = (next: Coupon[]) => {
    setCustomCoupons(next);
    localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(next));
  };

  const resetCouponForm = () => {
    setCouponCode("");
    setCouponValue(couponType === "percent" ? "10" : "1");
    setCouponMaxUsesPerDay("");
    setCouponMaxUsesTotal("");
    setCouponStartsAt("");
    setCouponEndsAt("");
    setCouponProductIds("");
    setCouponOncePerCustomer(true);
    setCouponBlockSamePhone(true);
    setEditingCouponCode("");
  };

  const saveCoupon = async () => {
    const code = couponCode.trim();
    const value = Number(couponValue.replace(",", "."));
    if (!code || !Number.isFinite(value) || value <= 0) return;
    const coupon: Coupon = {
      code,
      label: couponLabel(couponType, value),
      type: couponType,
      value,
      active: true,
      maxUsesPerDay: Number(couponMaxUsesPerDay) > 0 ? Number(couponMaxUsesPerDay) : undefined,
      maxUsesTotal: Number(couponMaxUsesTotal) > 0 ? Number(couponMaxUsesTotal) : undefined,
      startsAt: couponStartsAt || undefined,
      endsAt: couponEndsAt || undefined,
      productIds: couponProductIds
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      oncePerCustomer: couponOncePerCustomer,
      blockSamePhone: couponBlockSamePhone,
    };
    const nextCoupons = [
      coupon,
      ...customCoupons.filter(
        (item) =>
          item.code.toLowerCase() !== code.toLowerCase() &&
          item.code.toLowerCase() !== editingCouponCode.toLowerCase(),
      ),
    ];
    saveCustomCoupons(nextCoupons);
    if (API_URL) {
      try {
        await saveAdminCoupon(API_URL, adminToken, coupon);
        await syncCoupons();
      } catch {
        setAdminDataError("Cupom salvo localmente, mas o backend não recebeu.");
      }
    }
    resetCouponForm();
  };

  const editCoupon = (coupon: Coupon) => {
    setEditingCouponCode(coupon.code);
    setCouponCode(coupon.code);
    setCouponValue(String(coupon.value).replace(".", ","));
    setCouponType(coupon.type);
    setCouponMaxUsesPerDay(coupon.maxUsesPerDay ? String(coupon.maxUsesPerDay) : "");
    setCouponMaxUsesTotal(coupon.maxUsesTotal ? String(coupon.maxUsesTotal) : "");
    setCouponStartsAt(coupon.startsAt ?? "");
    setCouponEndsAt(coupon.endsAt ?? "");
    setCouponProductIds((coupon.productIds ?? []).join(", "));
    setCouponOncePerCustomer(coupon.oncePerCustomer !== false);
    setCouponBlockSamePhone(coupon.blockSamePhone !== false);
  };

  const toggleCoupon = async (coupon: Coupon) => {
    const nextCoupon = { ...coupon, active: !coupon.active };
    saveCustomCoupons([
      nextCoupon,
      ...customCoupons.filter(
        (item) => item.code.toLowerCase() !== coupon.code.toLowerCase(),
      ),
    ]);
    if (!API_URL) return;
    try {
      await toggleAdminCoupon(API_URL, adminToken, nextCoupon);
      await syncCoupons();
    } catch {
      setAdminDataError("Cupom alterado localmente, mas o backend não recebeu.");
    }
  };

  const deleteCoupon = async (coupon: Coupon) => {
    const isDefault = DEFAULT_COUPONS.some(
      (item) => item.code.toLowerCase() === coupon.code.toLowerCase(),
    );
    if (isDefault) {
      saveCustomCoupons([
        { ...coupon, active: false },
        ...customCoupons.filter(
          (item) => item.code.toLowerCase() !== coupon.code.toLowerCase(),
        ),
      ]);
      if (editingCouponCode.toLowerCase() === coupon.code.toLowerCase()) {
        resetCouponForm();
      }
      if (API_URL) {
        try {
          await toggleAdminCoupon(API_URL, adminToken, { ...coupon, active: false });
          await syncCoupons();
        } catch {
          setAdminDataError("Cupom desligado localmente, mas o backend não recebeu.");
        }
      }
      return;
    }
    saveCustomCoupons(
      customCoupons.filter(
        (item) => item.code.toLowerCase() !== coupon.code.toLowerCase(),
      ),
    );
    if (editingCouponCode.toLowerCase() === coupon.code.toLowerCase()) {
      resetCouponForm();
    }
    if (!API_URL) return;
    try {
      await deleteAdminCoupon(API_URL, adminToken, coupon.code);
      await syncCoupons();
    } catch {
      setAdminDataError("Cupom removido localmente, mas o backend não recebeu.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#fff",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {!kitchenOnly && (
        <AdminHeader
          activeOrders={activeOrders}
          onClose={onClose}
          onOpenConfig={() => setTab("config")}
        />
      )}
      {!kitchenOnly && (
        <AdminTabs
          tabs={tabs}
          tab={tab}
          tabCount={tabCount}
          onChange={setTab}
        />
      )}
      {/* CONTENT */}
      <div
        style={
          tab === "cozinha"
            ? { padding: 0, paddingBottom: 0 }
            : { padding: "16px", paddingBottom: "40px" }
        }
      >
        {!kitchenOnly && (
          <PaymentRequestsAlert
            orders={openPaymentRequests}
            onConfirm={(id) => handleUpdateOrderStatus(id, "PAID")}
          />
        )}
        {adminDataError && !kitchenOnly && (
          <div
            className="mb-3 rounded-xl px-4 py-3 text-xs font-bold"
            style={{ background: "#FEF2F2", color: "#991B1B" }}
          >
            {adminDataError}
          </div>
        )}
        {tab === "pedidos" && (
          <OrdersView
            orders={visibleOrders}
            updateOrderStatus={handleUpdateOrderStatus}
            deleteOrder={handleDeleteOrder}
            updateOrderItems={handleUpdateOrderItems}
          />
        )}
        {tab === "cozinha" && (
          <KitchenView
            orders={visibleOrders}
            updateOrderStatus={handleUpdateOrderStatus}
            deductStock={deductStockForOrder}
            stockItems={stockItems}
            demoTableEnabled={demoTableEnabled}
          />
        )}
        {tab === "dashboard" && (
          <DashboardView orders={visibleOrders} />
        )}
        {tab === "estoque" && (
          <EstoqueView
            items={stockItems}
            setItems={setStockItems}
            movements={stockMovements}
            setMovements={setStockMovements}
            onSaveItem={persistStockItem}
            onMoveItem={persistStockMovement}
            onDeleteItem={persistStockDelete}
          />
        )}
        {tab === "entrega" && (
          <OrdersView
            orders={visibleOrders.filter(
              (order) =>
                order.deliveryType === "delivery" &&
                !isKioskMobOrder(order) &&
                ["READY", "OUT_FOR_DELIVERY"].includes(order.status),
            )}
            updateOrderStatus={handleUpdateOrderStatus}
            deleteOrder={handleDeleteOrder}
            updateOrderItems={handleUpdateOrderItems}
          />
        )}
        {tab === "clientes" && (
          <CustomersCrmView
            customers={crmCustomers}
            adminToken={adminToken}
            onChanged={syncCrmCustomers}
          />
        )}
        {tab === "suporte" && (
          <SupportView
            tickets={supportTickets}
            onResolve={resolveSupportTicket}
          />
        )}
        {tab === "cupons" && (
          <CouponsView
            coupons={mergeCoupons(customCoupons)}
            couponCode={couponCode}
            couponValue={couponValue}
            couponType={couponType}
            couponMaxUsesPerDay={couponMaxUsesPerDay}
            couponMaxUsesTotal={couponMaxUsesTotal}
            couponStartsAt={couponStartsAt}
            couponEndsAt={couponEndsAt}
            couponProductIds={couponProductIds}
            couponOncePerCustomer={couponOncePerCustomer}
            couponBlockSamePhone={couponBlockSamePhone}
            editingCouponCode={editingCouponCode}
            setCouponCode={setCouponCode}
            setCouponValue={setCouponValue}
            setCouponType={setCouponType}
            setCouponMaxUsesPerDay={setCouponMaxUsesPerDay}
            setCouponMaxUsesTotal={setCouponMaxUsesTotal}
            setCouponStartsAt={setCouponStartsAt}
            setCouponEndsAt={setCouponEndsAt}
            setCouponProductIds={setCouponProductIds}
            setCouponOncePerCustomer={setCouponOncePerCustomer}
            setCouponBlockSamePhone={setCouponBlockSamePhone}
            onSave={saveCoupon}
            onCancelEdit={resetCouponForm}
            onEdit={editCoupon}
            onToggle={toggleCoupon}
            onDelete={deleteCoupon}
          />
        )}
        {tab === "config" && (
          <ConfigView
            payOnDeliveryEnabled={payOnDeliveryEnabled}
            testModeEnabled={testModeEnabled}
            demoTableEnabled={demoTableEnabled}
            featuredProductId={featuredProductId}
            operatingHours={operatingHours}
            hasUnsavedOperatingHours={
              JSON.stringify(normalizeOperatingHours(operatingHours)) !==
              JSON.stringify(normalizeOperatingHours(savedOperatingHours))
            }
            saving={savingPayOnDelivery}
            disabled={!API_URL}
            onTogglePayOnDelivery={togglePayOnDelivery}
            onToggleTestMode={toggleTestMode}
            onToggleDemoTable={toggleDemoTable}
            onFeaturedProductChange={updateFeaturedProduct}
            onOperatingHoursChange={updateOperatingHours}
            onSaveOperatingHours={saveOperatingHours}
            onResetRealOperation={resetRealOperation}
          />
        )}
      </div>
    </div>
  );
}

