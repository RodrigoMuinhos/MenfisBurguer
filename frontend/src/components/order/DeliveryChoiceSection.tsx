import type { ElementType } from "react";
import { Bike, Clock, MapPin, Store } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import {
  ALLOWED_DELIVERY_TYPES,
  DeliveryType,
  PICKUP_ADDRESS,
  deliveryEta,
  fmt,
} from "./checkout";

export function DeliveryChoiceSection({
  delivery,
  setDelivery,
  freeShipping,
  fee,
}: {
  delivery: DeliveryType;
  setDelivery: (delivery: DeliveryType) => void;
  freeShipping: boolean;
  fee: number;
}) {
  const choices = (
    [
      {
        id: "delivery",
        label: "Entrega",
        copy: `${deliveryEta} · ${freeShipping ? "grátis" : fmt(5.1)}`,
        Icon: Bike,
      },
      {
        id: "retirada",
        label: "Retirada",
        copy: "Buscar na loja · grátis",
        Icon: Store,
      },
    ] as {
      id: DeliveryType;
      label: string;
      copy: string;
      Icon: ElementType;
    }[]
  ).filter(({ id }) => id === "delivery" && ALLOWED_DELIVERY_TYPES.includes(id));

  return (
    <div>
      <p
        className="text-[10px] font-black uppercase tracking-widest mb-1.5"
        style={{ color: VERDE, opacity: 0.4 }}
      >
        Tipo do pedido
      </p>
      <div
        className={`mb-3 grid gap-2 ${choices.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {choices.map(({ id, label, copy, Icon }) => {
          const active = delivery === id;
          return (
            <button
              key={id}
              onClick={() => setDelivery(id)}
              className="rounded-2xl p-3 text-left"
              style={{
                background: active ? ROSA : "#fff",
                border: `1.5px solid ${active ? VERDE : `${VERDE}14`}`,
                color: VERDE,
              }}
            >
              <Icon size={17} strokeWidth={2.4} />
              <p className="mt-2 text-xs font-black uppercase tracking-wide">
                {label}
              </p>
              <p className="mt-1 text-[10px] font-semibold opacity-60">
                {copy}
              </p>
            </button>
          );
        })}
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2" style={{ color: VERDE }}>
        <div
          className="rounded-xl px-3 py-2"
          style={{
            background: `${VERDE}08`,
            border: `1px solid ${VERDE}12`,
          }}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
            <Clock size={12} strokeWidth={2.2} />
            Prazo médio
          </div>
          <p className="text-xs font-bold mt-1">{deliveryEta}</p>
        </div>
        <div
          className="rounded-xl px-3 py-2"
          style={{
            background: `${VERDE}08`,
            border: `1px solid ${VERDE}12`,
          }}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
            <MapPin size={12} strokeWidth={2.2} />
            {delivery === "retirada" ? "Retirada" : "Delivery"}
          </div>
          <p className="text-xs font-bold mt-1">
            {delivery === "retirada"
              ? "Grátis na loja"
              : freeShipping
                ? "Frete grátis"
                : `${fmt(fee)} de taxa`}
          </p>
        </div>
      </div>
      {delivery === "retirada" && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: "#fff",
            border: `1px solid ${VERDE}14`,
            color: VERDE,
          }}
        >
          <p className="text-xs font-black uppercase tracking-wide">
            Endereço para retirada
          </p>
          <p className="mt-1 text-sm font-bold">{PICKUP_ADDRESS}</p>
          <p className="mt-1 text-[11px] opacity-60">
            Avise no WhatsApp quando chegar. Seu pedido entra na fila após
            confirmação do pagamento.
          </p>
        </div>
      )}
    </div>
  );
}
