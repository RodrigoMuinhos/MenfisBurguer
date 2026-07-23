import { ChevronLeft, ChevronRight, Heart, Plus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { MenuItem } from "@/features/catalog/types";
import { fmt } from "./shared";

const LEMONADE_IDS = ["pink-lemonade", "purple-lemonade", "sunset-lemonade"] as const;
const LEMONADE_HEROS = [
  { src: "/Lemonade/hero.png", alt: "Lemonades especiais Menfi's" },
  { src: "/Lemonade/hero2.png", alt: "Sunset Lemonade Menfi's" },
  { src: "/Lemonade/hero3.png", alt: "Purple Lemonade Menfi's" },
] as const;

const FLAVOR_THEME: Record<string, { color: string; soft: string }> = {
  "pink-lemonade": { color: "#C80B50", soft: "#FFF0F5" },
  "purple-lemonade": { color: "#7B367D", soft: "#F7EDFA" },
  "sunset-lemonade": { color: "#F04B16", soft: "#FFF1E9" },
};

export function isLemonade(item: MenuItem) {
  return LEMONADE_IDS.includes(item.id as (typeof LEMONADE_IDS)[number]);
}

export function LemonadeShowcase({
  items,
  onAdd,
}: {
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
}) {
  const [activeHero, setActiveHero] = useState(0);
  const lemonades = LEMONADE_IDS
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is MenuItem => Boolean(item));

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveHero((current) => (current + 1) % LEMONADE_HEROS.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const changeHero = (direction: number) => {
    setActiveHero((current) => (current + direction + LEMONADE_HEROS.length) % LEMONADE_HEROS.length);
  };

  return (
    <div className="overflow-hidden bg-white text-[#5B1230]">
      <section className="relative aspect-[1672/941] overflow-hidden bg-[#FFE7EF]" aria-roledescription="carrossel">
        {LEMONADE_HEROS.map((hero, index) => (
          <button
            key={hero.src}
            type="button"
            onClick={() => document.getElementById("lemonade-flavors")?.scrollIntoView({ behavior: "smooth" })}
            className="absolute inset-0 h-full w-full transition-opacity duration-700"
            style={{ opacity: activeHero === index ? 1 : 0, pointerEvents: activeHero === index ? "auto" : "none" }}
            aria-label={`${hero.alt}. Ver sabores`}
            aria-hidden={activeHero !== index}
          >
            <img src={hero.src} alt={hero.alt} className="h-full w-full object-cover" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => changeHero(-1)}
          className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#A81249] shadow-lg backdrop-blur-sm md:left-5 md:h-12 md:w-12"
          aria-label="Hero anterior"
        ><ChevronLeft size={24} strokeWidth={2.8} /></button>
        <button
          type="button"
          onClick={() => changeHero(1)}
          className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#A81249] shadow-lg backdrop-blur-sm md:right-5 md:h-12 md:w-12"
          aria-label="Próximo hero"
        ><ChevronRight size={24} strokeWidth={2.8} /></button>
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full bg-white/75 px-3 py-2 shadow-md backdrop-blur-sm md:bottom-5">
          {LEMONADE_HEROS.map((hero, index) => (
            <button
              key={hero.src}
              type="button"
              onClick={() => setActiveHero(index)}
              className="h-2.5 rounded-full transition-all"
              style={{ width: activeHero === index ? 28 : 10, background: activeHero === index ? "#EC1767" : "#DCA7BA" }}
              aria-label={`Mostrar hero ${index + 1}`}
              aria-current={activeHero === index}
            />
          ))}
        </div>
      </section>

      <section id="lemonade-flavors" className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 text-[#EC1767]">
            <Heart size={18} fill="currentColor" />
            <h2 className="text-2xl font-black uppercase tracking-[0.12em] md:text-4xl">
              Escolha sua Lemonade
            </h2>
            <Heart size={18} fill="currentColor" />
          </div>
          <p className="mt-2 text-sm font-semibold text-[#8C5369] md:text-base">
            Três sabores únicos, feitos especialmente para você.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {lemonades.map((item) => {
            const theme = FLAVOR_THEME[item.id] ?? FLAVOR_THEME["pink-lemonade"];
            return (
              <article
                key={item.id}
                className="group overflow-hidden rounded-[28px] bg-white shadow-[0_16px_45px_rgba(92,18,48,0.10)]"
                style={{ border: `1px solid ${theme.color}24` }}
              >
                <div className="relative aspect-[3/4] overflow-hidden" style={{ background: theme.soft }}>
                  <img src={String(item.image)} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-widest" style={{ color: theme.color }}>
                    Novo
                  </span>
                  <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90" style={{ color: theme.color }}>
                    <Heart size={19} />
                  </span>
                </div>
                <div className="p-5 md:p-6">
                  <h3 className="text-xl font-black uppercase" style={{ color: theme.color }}>{item.name}</h3>
                  <p
                    className="mt-2 min-h-10 overflow-hidden text-sm font-semibold leading-5 text-[#704053]"
                    style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}
                  >
                    {item.desc}
                  </p>
                  <div className="mt-6 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: theme.color }}>Copo 500ml</p>
                    </div>
                    <p className="text-2xl font-black" style={{ color: theme.color }}>{fmt(item.price)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAdd(item)}
                    className="mt-4 flex h-12 w-full items-center justify-center gap-3 rounded-xl text-sm font-black uppercase text-white shadow-lg"
                    style={{ background: `linear-gradient(100deg, ${theme.color}, ${theme.color}D9)` }}
                  >
                    Adicionar <Plus size={18} strokeWidth={3} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-7 flex items-center gap-4 rounded-[24px] border border-[#EC176722] bg-[#FFF4F7] px-5 py-5 md:px-8">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#EC1767]"><Sparkles size={22} /></span>
          <div>
            <p className="font-black uppercase text-[#A81249]">Bebida gelada, feita na hora</p>
            <p className="mt-1 text-sm font-semibold text-[#8C5369]">Adoçada na medida certa e perfeita para qualquer momento.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
