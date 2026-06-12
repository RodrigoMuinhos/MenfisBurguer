import { OrderStatus } from "@/types/order";

export const KANBAN_STAGES: OrderStatus[] = ["PAID", "ACCEPTED", "IN_PREPARATION", "READY"];

export const KITCHEN_STAGE_LABEL: Partial<Record<OrderStatus, string>> = {
  PAID: "Recebidos",
  ACCEPTED: "Pedidos aceitos",
  IN_PREPARATION: "Em preparo",
  READY: "Pronto",
};

export const KITCHEN_NEXT_STAGE: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: "ACCEPTED",
  ACCEPTED: "IN_PREPARATION",
  IN_PREPARATION: "READY",
};
