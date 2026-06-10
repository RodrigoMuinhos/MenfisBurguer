import { CartItem, Order, PaymentMethod } from "@/types/order";
import { fmt } from "./checkout";

const WHATSAPP_DISPLAY = "(85) 99788-3764";
const LINE = "=================================";

const DEFAULT_COMPOSITION: Record<string, string[]> = {
  combo: ["Menfi's Burger", "Coca-Cola 350ml", "Batata Frita 250g"],
  "double-combo": ["Double Menfi's", "Coca-Cola 350ml", "Batata Frita 250g"],
  combo2: ["2x Menfi's Burger", "2 bebidas", "Batata Frita 250g"],
  "bacon-combo": ["Menfi's Bacon", "Coca-Cola 350ml", "Batata Frita 250g"],
  "double-bacon-combo": ["Double Menfi's Bacon", "Coca-Cola 350ml", "Batata Frita 250g"],
  "bacon-super-combo": ["2x Menfi's Bacon", "2 bebidas", "Batata Frita 250g"],
  "chicken-combo": ["Menfi's Chicken", "Coca-Cola 350ml", "Batata Frita 250g"],
  "double-chicken-combo": ["Double Menfi's Chicken", "Coca-Cola 350ml", "Batata Frita 250g"],
  "chicken-super-combo": ["2x Menfi's Chicken", "2 bebidas", "Batata Frita 250g"],
};

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
    .flatMap((item) => {
      const name = `${item.qty}x ${titleCaseItem(item.name)}`.slice(0, 27);
      const components = item.components?.length
        ? item.components
        : DEFAULT_COMPOSITION[item.productId ?? item.id] ?? [];
      return [
        `${name.padEnd(29, " ")} ${fmt(item.price * item.qty)}`,
        ...components.map((component) => `* ${component}`),
        ...(item.note ? ["Observacao:", item.note] : []),
      ];
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
