import { OrderStatus } from "@/types/order";

export const KANBAN_STAGES: OrderStatus[] = ["PAID", "IN_PREPARATION", "READY"];

export const KITCHEN_STAGE_LABEL: Partial<Record<OrderStatus, string>> = {
  PAID: "Pedidos aceitos",
  IN_PREPARATION: "Em preparo",
  READY: "Pronto",
};

export const KITCHEN_NEXT_STAGE: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: "IN_PREPARATION",
  IN_PREPARATION: "READY",
};
