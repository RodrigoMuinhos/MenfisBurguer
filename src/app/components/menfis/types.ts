export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export type OrderStatus = "recebido" | "preparo" | "pronto" | "entregue";
export type DeliveryType = "retirada" | "delivery";

export interface Order {
  id: string;
  number: number;
  items: CartItem[];
  removedByItemId?: Record<string, string[]>;
  deliveryType: DeliveryType;
  customerPhone?: string;
  customerAddress?: string;
  total: number;
  timestamp: number;
  status: OrderStatus;
}

export const VERDE = "#1F3D2E";
export const ROSA = "#FFD6E3";
export const CREME = "#F2E5D5";
