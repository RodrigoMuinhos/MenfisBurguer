import Image from "next/image";
import { Plus } from "lucide-react";
import { ROSA, VERDE } from "@/utils/theme";
import { fmt } from "./checkout";

export function SuggestedCard({
  id,
  name,
  price,
  description,
  image,
  qty,
  onAdd,
}: {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  qty: number;
  onAdd: (item: { id: string; name: string; price: number }) => void;
}) {
  return (
    <button
      onClick={() => onAdd({ id, name, price })}
      className="min-w-[142px] text-left rounded-2xl p-3"
      style={{
        background: qty > 0 ? `${ROSA}45` : "#fff",
        border: `2px solid ${qty > 0 ? VERDE : `${VERDE}10`}`,
        boxShadow:
          qty > 0
            ? "0 14px 30px rgba(101,0,31,0.16)"
            : "0 10px 24px rgba(101,0,31,0.06)",
      }}
    >
      <div
        className="relative mb-3 h-24 overflow-hidden rounded-2xl"
        style={{ background: `${ROSA}55` }}
      >
        <Image
          src={image}
          alt={name}
          fill
          sizes="142px"
          style={{ objectFit: "cover" }}
        />
        <span
          className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full"
          style={{
            background: "#fff",
            color: VERDE,
            boxShadow: "0 8px 18px rgba(0,0,0,0.14)",
          }}
        >
          {qty > 0 ? (
            <span className="text-sm font-black">{qty}</span>
          ) : (
            <Plus size={20} strokeWidth={2.7} />
          )}
        </span>
      </div>
      <p className="text-sm font-black" style={{ color: VERDE }}>
        {fmt(price)}
      </p>
      <p className="mt-1 text-xs font-bold leading-snug" style={{ color: "#222" }}>
        {name}
      </p>
      <p className="mt-1 text-[10px] leading-snug" style={{ color: VERDE, opacity: 0.52 }}>
        {description}
      </p>
    </button>
  );
}
