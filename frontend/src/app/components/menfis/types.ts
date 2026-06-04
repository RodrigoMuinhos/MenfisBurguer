export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export type OrderStatus =
  | "aguardando_pagamento"
  | "pagamento_recusado"
  | "recebido"
  | "preparo"
  | "pronto"
  | "saiu_entrega"
  | "entregue"
  | "cancelado";
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
  paymentProvider?: string;
  paymentMethod?: "pix" | "cartao";
  paymentStatus?: string;
  paymentId?: string;
  timestamp: number;
  status: OrderStatus;
}

export const VERDE = "#65001F";
export const ROSA = "#FFBACF";
export const CREME = "#FFE9EC";
