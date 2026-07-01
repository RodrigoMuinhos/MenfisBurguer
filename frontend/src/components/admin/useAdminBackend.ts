import { useEffect, useState } from "react";
import type { Coupon } from "./shared";
import { API_URL, COUPON_STORAGE_KEY } from "./shared";
import type { Movement, StockItem } from "./EstoqueView";
import {
  deleteStockItem,
  fetchAdminCoupons,
  fetchAdminStock,
  moveStockItem,
  saveStockItem,
} from "./adminBackend";

interface UseAdminBackendProps {
  adminToken: string;
  kitchenOnly: boolean;
  setStockItems: (items: StockItem[]) => void;
  setStockMovements: (movements: Movement[]) => void;
  setCustomCoupons: (coupons: Coupon[]) => void;
}

export function useAdminBackend({
  adminToken,
  kitchenOnly,
  setStockItems,
  setStockMovements,
  setCustomCoupons,
}: UseAdminBackendProps) {
  const [adminDataError, setAdminDataError] = useState("");

  const syncInventory = async () => {
    if (!API_URL || !adminToken) return;
    try {
      const data = await fetchAdminStock(API_URL, adminToken);
      if (data.items.length > 0) setStockItems(data.items);
      setStockMovements(data.movements);
      setAdminDataError("");
    } catch {
      setAdminDataError("Não foi possível carregar dados de estoque do backend.");
    }
  };

  const syncCoupons = async () => {
    if (!API_URL || !adminToken || kitchenOnly) return;
    try {
      const coupons = await fetchAdminCoupons(API_URL, adminToken);
      if (coupons.length > 0) {
        setCustomCoupons(coupons);
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupons));
      }
      setAdminDataError("");
    } catch {
      setAdminDataError("Não foi possível carregar cupons do backend.");
    }
  };

  useEffect(() => {
    syncInventory();
    syncCoupons();
  }, [adminToken, kitchenOnly]);

  const persistStockItem = async (item: StockItem) => {
    if (!API_URL || !adminToken) return;
    try {
      await saveStockItem(API_URL, adminToken, item);
      await syncInventory();
    } catch {
      setAdminDataError("Estoque alterado localmente, mas o backend não recebeu.");
    }
  };

  const persistStockMovement = async (
    item: StockItem,
    type: "entrada" | "saida",
    quantity: number,
    note: string,
  ) => {
    if (!API_URL || !adminToken) return;
    try {
      await moveStockItem(API_URL, adminToken, item.id, type, quantity, note);
      await syncInventory();
    } catch {
      setAdminDataError("Movimento registrado localmente, mas o backend não recebeu.");
    }
  };

  const persistStockDelete = async (item: StockItem) => {
    if (!API_URL || !adminToken) return;
    try {
      await deleteStockItem(API_URL, adminToken, item.id);
      await syncInventory();
    } catch {
      setAdminDataError("Item removido localmente, mas o backend não recebeu.");
    }
  };

  return {
    adminDataError,
    setAdminDataError,
    syncCoupons,
    persistStockItem,
    persistStockMovement,
    persistStockDelete,
  };
}
