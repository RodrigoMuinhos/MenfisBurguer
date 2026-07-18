"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent, type UIEvent } from "react";
import { Beef, Check, Crown, Flame, Plus, Star } from "lucide-react";
import type { MenuItem } from "@/features/catalog/types";
import type { CarouselCardSettings } from "@/components/order/checkout";
import { fmt } from "../shared";
import type { CarouselAction, CarouselSlide as SlideData } from "./product-carousel.types";
import styles from "./product-carousel.module.css";

export function ProductCarousel({ products, cards, intervalSeconds = 3, onOpenProduct, onAddProduct }: { products: MenuItem[]; cards: CarouselCardSettings[]; intervalSeconds?: number; onOpenProduct: (product: MenuItem) => void; onAddProduct: (product: MenuItem) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [adding, setAdding] = useState(false);
  const [paused, setPaused] = useState(false);
  const slides: SlideData[] = cards.filter((card) => card.enabled).map((card, index) => {
    const product = products.find((item) => item.id === card.productId);
    return {
      id: index + 1,
      productId: card.productId || undefined,
      eyebrow: card.eyebrow,
      title: card.title || product?.name || "Destaque Menfi's",
      subtitle: card.subtitle,
      image: card.image || (typeof product?.image === "string" ? product.image : product?.image?.src) || "/carrosel/omaisvendido.png",
      imageAlt: card.title || product?.name || "Destaque Menfi's",
      variant: card.productId === "smash-nutella-marshmallow" ? "closeup" : "hero",
      features: product?.tags?.slice(0, 4),
      showPrice: Boolean(product),
      primaryAction: product ? { label: card.actionLabel || "Ver produto", action: "open-product" } : undefined,
    };
  });

  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => goTo((active + 1) % slides.length), Math.max(2, intervalSeconds) * 1000);
    return () => window.clearInterval(timer);
  }, [active, paused, slides.length, intervalSeconds]);

  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    trackRef.current?.children[next]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setActive(next);
  };
  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const track = event.currentTarget;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let distance = Number.POSITIVE_INFINITY;
    Array.from(track.children).forEach((child, index) => {
      const element = child as HTMLElement;
      const nextDistance = Math.abs(element.offsetLeft + element.offsetWidth / 2 - center);
      if (nextDistance < distance) { distance = nextDistance; closest = index; }
    });
    setActive(closest);
  };
  const handleAction = (action: CarouselAction, product?: MenuItem) => {
    if (action === "open-product" && product) return onOpenProduct(product);
    if (action === "open-site") return document.getElementById("menfis-products")?.scrollIntoView({ behavior: "smooth" });
    setAdding(true);
    if (product) onAddProduct(product);
    window.setTimeout(() => setAdding(false), 700);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight") { event.preventDefault(); goTo(active + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); goTo(active - 1); }
  };

  return (
    <section className={styles.section} aria-roledescription="carrossel" aria-label="Destaques do cardápio Menfi's" onKeyDown={handleKeyDown} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} tabIndex={0}>
      <div ref={trackRef} className={styles.track} onScroll={handleScroll}>
        {slides.map((slide, index) => <CarouselSlide key={slide.id} slide={slide} product={slide.productId ? products.find((product) => product.id === slide.productId) : undefined} priority={index === 0} adding={adding} total={slides.length} onAction={handleAction} />)}
      </div>
      <div className={styles.indicators} aria-label="Selecionar slide">
        {slides.map((slide, index) => <button key={slide.id} type="button" aria-label={`Ir para slide ${index + 1}`} aria-current={active === index} onClick={() => goTo(index)} className={`${styles.indicator} ${active === index ? styles.indicatorActive : ""}`} />)}
      </div>
    </section>
  );
}

function CarouselSlide({ slide, product, priority, adding, total, onAction }: { slide: SlideData; product?: MenuItem; priority: boolean; adding: boolean; total: number; onAction: (action: CarouselAction, product?: MenuItem) => void }) {
  const dark = slide.variant !== "cta";
  return (
    <article className={`${styles.card} group`} style={{ background: dark ? "#16070c" : "#fffafa", color: dark ? "#fffafa" : "#750020" }} aria-label={`${product?.name || slide.title}. Slide de ${total}`}>
      <div className={`absolute inset-0 ${slide.variant === "ingredients" ? "left-[38%]" : ""}`}>
        <Image src={slide.image} alt={slide.imageAlt} fill priority={priority} sizes="100vw" className={styles.image} style={{ objectPosition: slide.variant === "closeup" ? "52% center" : "center" }} />
      </div>
      {slide.variant !== "cta" && <div className="absolute inset-0" style={{ background: slide.variant === "closeup" ? "linear-gradient(to top,rgba(22,7,12,.96),transparent 70%)" : "linear-gradient(to bottom,rgba(22,7,12,.9),transparent 38%,rgba(22,7,12,.93))" }} />}
      <div className="relative flex h-full flex-col justify-between p-6 md:p-10">
        <div>
          {slide.eyebrow && <span className="inline-flex items-center gap-2 rounded-full bg-[#ff3f87] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#16070c]">{slide.id === 1 && <Crown size={13} />}{slide.eyebrow}</span>}
          <h2 className="mt-3 uppercase" style={{ fontFamily: "var(--menfis-font-display)", fontSize: "clamp(2.7rem,5vw,4rem)", lineHeight: .88 }}>{product?.name || slide.title}</h2>
          {slide.variant === "closeup" && <div className="mt-3 flex gap-1 text-[#ff3f87]">{[1,2,3,4,5].map((star) => <Star key={star} size={18} fill="currentColor" />)}</div>}
        </div>
        <div>
          {slide.features && <div className="mb-5 grid gap-2">{slide.features.map((feature) => <div key={feature} className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-xs font-black uppercase"><FeatureIcon label={feature} />{feature}</div>)}</div>}
          {slide.showPrice && product && <p className="mb-4 text-4xl font-black text-[#ff3f87]">{fmt(product.price)}</p>}
          {slide.subtitle && <p className="mb-4 text-base font-black uppercase tracking-wide opacity-90">{slide.subtitle}</p>}
          {slide.primaryAction && <button type="button" disabled={adding && slide.primaryAction.action === "add-to-cart"} onClick={() => onAction(slide.primaryAction!.action, product)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff3f87] px-5 text-xs font-black uppercase text-[#16070c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffc6da] disabled:opacity-60">{adding && slide.primaryAction.action === "add-to-cart" ? "Abrindo opções..." : slide.primaryAction.label}<Plus size={17} /></button>}
          {slide.secondaryAction && <a href={slide.secondaryAction.href} target="_blank" rel="noreferrer" className="mt-3 flex min-h-12 items-center justify-center rounded-2xl border-2 border-[#750020] px-5 text-xs font-black uppercase">{slide.secondaryAction.label}</a>}
        </div>
      </div>
    </article>
  );
}

function FeatureIcon({ label }: { label: string }) { return label.includes("carne") ? <Beef size={16} /> : label.includes("Cheddar") ? <Flame size={16} /> : <Check size={16} />; }
