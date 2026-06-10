export type OrderChannel = "DELIVERY" | "KIOSK";

export type OrderStatus =
  | "CREATED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "IN_PREPARATION"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type DeliveryType = "retirada" | "delivery";
export type PaymentMethod =
  | "pix"
  | "cartao"
  | "credito"
  | "debito"
  | "credit_card"
  | "debit_card"
  | "dinheiro"
  | "presencial"
  | "pagar_na_entrega"
  | "whatsapp";

export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  qty: number;
  components?: string[];
  note?: string;
}

export interface Order {
  id: string;
  number: number;
  deliveryCode?: string;
  channel: OrderChannel;
  items: CartItem[];
  removedByItemId?: Record<string, string[]>;
  deliveryType: DeliveryType;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  total: number;
  paymentProvider?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: string;
  paymentId?: string;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  pixTicketUrl?: string;
  timestamp: number;
  status: OrderStatus;
}
