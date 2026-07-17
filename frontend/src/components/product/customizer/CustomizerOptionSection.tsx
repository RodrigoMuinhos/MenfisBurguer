import type React from "react";
import { ROSA, VERDE } from "@/utils/theme";

export function OptionSection({ title, subtitle, count, total, required, children }: { title: string; subtitle: string; count?: number; total?: number; required?: boolean; children: React.ReactNode }) {
  const showCounter = typeof count === "number" && typeof total === "number";
  return <section><div className="flex items-center justify-between gap-3 px-5 py-4" style={{ background: "#F5F5F5" }}><div><p className="text-lg font-black text-black/62">{title}</p><p className="text-sm text-black/50">{subtitle}</p></div>{required && <div className="flex items-center gap-2">{showCounter && <span className="rounded-full px-3 py-1 text-[11px] font-black" style={{ background: count >= total ? VERDE : ROSA, color: count >= total ? ROSA : VERDE }}>{count}/{total}</span>}<span className="rounded-lg bg-black px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">Obrigatório</span></div>}</div>{children}</section>;
}

export function OptionThumb({ src, alt }: { src: string; alt: string }) {
  return <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ background: "#F4F4F4" }}><img src={src} alt={alt} loading="lazy" className="block h-full w-full object-cover" /></span>;
}
