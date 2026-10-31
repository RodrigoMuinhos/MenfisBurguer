import Image from "next/image";
import type { MenuItem } from "@/features/catalog/types";
import { KIOSK_MENU_ITEMS } from "@/features/catalog/menu";
import { fmt, imageSrc } from "./shared";

export const isHalloweenAccount = (profile: { email?: string } | null) => profile?.email?.trim().toLowerCase() === "halloween@gmail.com";

export function HalloweenMenu({ items, onAdd, onProfile, onCart, cartCount }: {
  items: MenuItem[]; onAdd: (item: MenuItem) => void; onProfile: () => void; onCart: () => void; cartCount: number;
}) {
  const monster = KIOSK_MENU_ITEMS[0];
  const lemonades = items.filter(item => item.id.endsWith("-lemonade"));
  return <main className="min-h-screen bg-[#100c12] pb-24 text-white">
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 p-4">
      <span className="font-black">MENFIS · HALLOWEEN</span>
      <div className="flex gap-4"><button onClick={onProfile}>Minha conta</button><button onClick={onCart}>Sacola ({cartCount})</button></div>
    </header>
    <section className="relative mx-auto grid max-w-7xl overflow-hidden md:min-h-[650px] md:grid-cols-2" aria-label="Promoção de Halloween">
      <div className="relative aspect-square"><Image src="/menu/MenfisMonster.png" alt="Menfis Monster no pão brioche negro" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-contain" /></div>
      <div className="flex flex-col justify-center p-6 md:p-12">
        <p className="font-black uppercase tracking-widest text-orange-400">Especial de Halloween</p>
        <h1 className="mt-3 text-5xl font-black md:text-7xl">Menfis Monster</h1>
        <p className="mt-5 text-lg leading-relaxed text-white/80">{monster.desc}</p>
        <p className="mt-6 text-4xl font-black text-orange-400">{fmt(monster.price)}</p>
        <p className="mt-4 text-sm text-white/70">Adicional: Coca-Cola Zero + batata 150g por R$ 20,90.</p>
        <button onClick={() => onAdd(monster)} className="mt-6 rounded-2xl bg-orange-500 px-8 py-5 text-lg font-black text-black">Quero o meu Monster</button>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-4 py-10" aria-label="Menu de lemonades">
      <h2 className="mb-6 text-3xl font-black">Lemonades</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{lemonades.map(item => <article key={item.id} className="overflow-hidden rounded-3xl bg-white text-[#65001F]">
        <div className="relative aspect-square"><Image src={imageSrc(item.image)} alt={item.name} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-contain" /></div>
        <div className="p-5"><h3 className="text-xl font-black">{item.name}</h3><p className="mt-2 text-sm">{item.desc}</p><button onClick={() => onAdd(item)} className="mt-4 w-full rounded-xl bg-[#65001F] p-4 font-black text-white">Adicionar · {fmt(item.price)}</button></div>
      </article>)}</div>
    </section>
  </main>;
}
