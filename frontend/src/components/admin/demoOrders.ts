import { Order, OrderStatus } from "@/types/order";

const NAMES = [
  "Ana Beatriz Rocha",
  "Carlos Eduardo Lima",
  "Mariana Torres",
  "Joao Pedro Alves",
  "Fernanda Costa",
  "Rafael Nogueira",
  "Bianca Menezes",
  "Lucas Araujo",
  "Camila Farias",
  "Thiago Martins",
];

const ADDRESSES = [
  "Rua Leonardo Mota, Meireles - Fortaleza/CE, 460",
  "Rua Pereira de Miranda, Papicu - Fortaleza/CE, 1402",
  "Rua Eliseu Oriá, Sapiranga-Coité - Fortaleza/CE, 674 AP 205",
  "Rua dos Amigos, Cambeba - Fortaleza/CE, 100",
  "Rua Palmácia, Vila Velha - Fortaleza/CE, 355",
  "Rua Coronel João de Oliveira, Messejana - Fortaleza/CE, 555",
  "Rua Inácio Vasconcelos, Messejana - Fortaleza/CE, 221 APTO 1711",
];

const PRODUCTS = [
  {
    id: "menfis-combo",
    name: "MENFI'S COMBO",
    price: 34.9,
    components: ["Combo Menfi's", "Guaraná Zero", "Batata Frita 250g", "Maionese Barbecue"],
  },
  {
    id: "combo-menfis-bacon",
    name: "COMBO MENFI'S BACON",
    price: 40.9,
    components: ["Combo Menfi's Bacon", "Coca-Cola Zero", "Batata Frita 250g", "Maionese Alho Frito"],
  },
  {
    id: "super-combo",
    name: "SUPER COMBO",
    price: 59.9,
    components: ["Super Combo", "Guaraná Zero", "Coca-Cola Zero", "Batata Frita 250g", "Maionese Barbecue"],
  },
  {
    id: "combo-double-bacon",
    name: "COMBO DOUBLE MENFI'S BACON",
    price: 48.9,
    components: ["Combo Double Menfi's Bacon", "Coca-Cola Zero", "Batata Frita 250g", "Maionese Barbecue"],
  },
];

const STATUS_PLAN: OrderStatus[] = [
  ...Array(6).fill("PAYMENT_PENDING"),
  ...Array(12).fill("ACCEPTED"),
  ...Array(12).fill("IN_PREPARATION"),
  ...Array(10).fill("READY"),
  ...Array(10).fill("OUT_FOR_DELIVERY"),
  ...Array(20).fill("DELIVERED"),
] as OrderStatus[];

export function generateDemoOrders(): Order[] {
  const now = Date.now();
  return STATUS_PLAN.map((status, index) => {
    const product = PRODUCTS[index % PRODUCTS.length];
    const secondProduct = PRODUCTS[(index + 1) % PRODUCTS.length];
    const itemCount = index % 5 === 0 ? 3 : index % 3 === 0 ? 2 : 1;
    const items = Array.from({ length: itemCount }, (_, itemIndex) => {
      const selected = itemIndex % 2 === 0 ? product : secondProduct;
      return {
        id: `${selected.id}-demo-${index}-${itemIndex}`,
        productId: selected.id,
        name: selected.name,
        price: selected.price,
        qty: 1,
        components: selected.components,
      };
    });
    const subtotal = money(items.reduce((sum, item) => sum + item.price * item.qty, 0));
    const deliveryFee = 5.1;
    const serviceFee = status === "PAYMENT_PENDING" || index % 2 === 0 ? 0.99 : 0;
    const total = money(subtotal + deliveryFee + serviceFee);
    const name = NAMES[index % NAMES.length];
    const phoneSuffix = String(9000 + index).padStart(4, "0");
    return {
      id: `#T${String(index + 1).padStart(3, "0")}`,
      number: 9000 + index + 1,
      deliveryCode: `TT${String(index + 1).padStart(2, "0")}`,
      channel: "DELIVERY",
      deliveryType: "delivery",
      customerName: name,
      customerPhone: `(85) 99${String(index % 90).padStart(2, "0")}-${phoneSuffix}`,
      customerAddress: ADDRESSES[index % ADDRESSES.length],
      items,
      subtotal,
      deliveryFee,
      total,
      paymentMethod: index % 4 === 0 ? "pagar_na_entrega" : "presencial",
      paymentStatus: status === "PAYMENT_PENDING" ? "Aguardando Pagamento" : "Pago",
      timestamp: now - index * 8 * 60 * 1000,
      status,
    };
  });
}

export function isDemoOrder(orderOrId?: Order | string | null) {
  const id = typeof orderOrId === "string" ? orderOrId : orderOrId?.id;
  return String(id ?? "").startsWith("#T");
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}
