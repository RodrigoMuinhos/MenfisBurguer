import { CartItem, Order, PaymentMethod } from "@/types/order";
import { fmt } from "./checkout";

const WHATSAPP_DISPLAY = "(85) 99788-3764";
const LINE = "=================================";

type ReceiptInput = {
  id?: string;
  items: CartItem[];
  total: number;
  paymentMethod?: PaymentMethod;
  timestamp?: number;
};

export function buildWhatsappReceipt(input: ReceiptInput) {
  const now = new Date(input.timestamp ?? Date.now());
  const date = now.toLocaleDateString("pt-BR");
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const items = input.items
    .map((item) => {
      const name = `${item.qty}x ${titleCaseItem(item.name)}`.slice(0, 27);
      return `${name.padEnd(29, " ")} ${fmt(item.price * item.qty)}`;
    })
    .join("\n");
  const method = input.paymentMethod ?? "pix";

  return [
    LINE,
    "MENFI'S BURGUER",
    "",
    `Pedido ${input.id ?? "em aberto"}`,
    "",
    "Item                         Valor",
    "",
    items,
    "",
    "-----",
    "",
    `TOTAL                 ${fmt(input.total)}`,
    "",
    "Forma de Pagamento:",
    `${method === "pix" || method === "whatsapp" ? "(X)" : "( )"} PIX`,
    `${method === "cartao" ? "(X)" : "( )"} Cartao`,
    `${method === "dinheiro" || method === "pagar_na_entrega" ? "(X)" : "( )"} Dinheiro`,
    "",
    `Data: ${date}`,
    `Hora: ${time}`,
    "",
    LINE,
    "MENFI'S BURGUER",
    "",
    "Obrigado pela preferencia!",
    "",
    "Feito na hora.",
    "Ingredientes selecionados.",
    "Sabor que marca.",
    "",
    "WhatsApp:",
    WHATSAPP_DISPLAY,
    "",
    LINE,
    `TOTAL: ${fmt(input.total)}`,
  ].join("\n");
}

export function buildOrderWhatsappReceipt(order: Order) {
  return buildWhatsappReceipt({
    id: order.id,
    items: order.items,
    total: order.total,
    paymentMethod: order.paymentMethod,
    timestamp: order.timestamp,
  });
}

function titleCaseItem(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)(\S)/g, (match) => match.toLocaleUpperCase("pt-BR"));
}
