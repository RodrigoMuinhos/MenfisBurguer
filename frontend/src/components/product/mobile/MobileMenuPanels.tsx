import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import {
  Beef,
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Drumstick,
  Flame,
  Gift,
  Heart,
  Home,
  MessageCircle,
  Package,
  Percent,
  Plus,
  Search,
  ShoppingCart,
  Star,
  Tag,
  Ticket,
  Utensils,
  UserRound,
  X,
  CalendarClock,
  Candy,
  CheckCircle2,
} from "lucide-react";
import { MenuItem } from "@/features/catalog/types";
import { ROSA } from "@/utils/theme";
import { API_URL, PromoCard, PromoCardIcon, SUPPORT_WHATSAPP_URL, normalizePromoCards } from "@/components/order/checkout";
import { fmt, imageSrc, isSpecialOfferOnlyProduct, isSuperProduct, isSweetBoxProduct, MemberProfile, sortCatalogItems, sweetCardPriceLabel } from "../shared";
import { SoldOutAlertModal, SoldOutBanner, SOLD_OUT_MESSAGE } from "../SoldOutNotice";
import { SuperLaunchCard } from "../ProductParts";
import { MAGENTA, PINK, REVIEWS_STORAGE_KEY, VINHO } from "./mobileMenuConfig";

export function MobileBottomNav({
  cartCount,
  cartTotal,
  onHome,
  onSearch,
  onOrders,
  onExtras,
  onProfile,
}: {
  cartCount: number;
  cartTotal: number;
  onHome: () => void;
  onSearch: () => void;
  onOrders: () => void;
  onExtras: () => void;
  onProfile: () => void;
}) {
  const items = [
    { label: "Inicio", icon: Home, onClick: onHome, active: true },
    { label: "Buscar", icon: Search, onClick: onSearch },
    {
      label: "Pedidos",
      icon: ClipboardList,
      onClick: onOrders,
      badge: cartCount,
    },
    { label: "Extras", icon: Plus, onClick: onExtras },
    { label: "Perfil", icon: UserRound, onClick: onProfile },
  ];
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 overflow-hidden border-t bg-white shadow-[0_-14px_32px_rgba(101,0,31,0.10)]"
      style={{ borderColor: `${VINHO}12` }}
    >
      {cartCount > 0 && (
        <button
          type="button"
          onClick={onOrders}
          className="flex h-[74px] w-full items-center gap-3 border-b px-4 text-left"
          style={{ borderColor: `${VINHO}10`, color: VINHO }}
        >
          <span
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: `${ROSA}55` }}
          >
            <ShoppingCart size={23} strokeWidth={2.6} />
            <span
              className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-black"
              style={{ background: PINK, color: "#fff" }}
            >
              {cartCount}
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black leading-tight">
              {cartCount} {cartCount === 1 ? "item" : "itens"}
            </span>
            <span className="block text-2xl font-black leading-tight">
              {fmt(cartTotal)}
            </span>
          </span>
          <span
            className="flex h-12 shrink-0 items-center gap-2 rounded-2xl px-4 text-xs font-black uppercase"
            style={{ background: PINK, color: "#fff" }}
          >
            Ver pedido <ChevronRight size={17} strokeWidth={2.8} />
          </span>
        </button>
      )}
      <nav className="grid grid-cols-5 px-2 pb-2 pt-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-black"
              style={{ color: item.active ? VINHO : `${VINHO}99` }}
            >
              <span className="relative">
                <Icon size={21} strokeWidth={2.4} />
                {Boolean(item.badge) && (
                  <span
                    className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black"
                    style={{ background: PINK, color: "#fff" }}
                  >
                    {item.badge}
                  </span>
                )}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function PanelShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] bg-[rgba(101,0,31,0.42)]"
      onClick={onClose}
    >
      <section
        className="absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-auto rounded-t-[28px] bg-white p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black uppercase tracking-wide">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: `${ROSA}70`, color: VINHO }}
            aria-label="Fechar"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function ReviewsPanel({ onClose }: { onClose: () => void }) {
  const defaultReviews = [
    { score: "4.9", text: "Melhor hamburguer que ja pedi." },
    { score: "5.0", text: "Chegou quente e muito rapido." },
    { score: "5.0", text: "Vale cada centavo." },
  ];
  const [reviews, setReviews] = useState<Array<{ name?: string; score: string; text: string; createdAt?: string }>>(() => {
    if (typeof window === "undefined") return defaultReviews;
    try {
      const saved = JSON.parse(localStorage.getItem(REVIEWS_STORAGE_KEY) ?? "[]");
      return [...defaultReviews, ...(Array.isArray(saved) ? saved : [])];
    } catch {
      return defaultReviews;
    }
  });
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [score, setScore] = useState("5");
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");

  const submitReview = () => {
    const cleanName = name.trim();
    const cleanText = text.trim();
    if (!cleanName || !cleanText) {
      setFeedback("Informe seu nome e escreva sua avaliacao.");
      return;
    }
    const review = {
      name: cleanName,
      score: `${Number(score).toFixed(1)}`,
      text: cleanText,
      createdAt: new Date().toISOString(),
    };
    const nextReviews = [...reviews, review];
    setReviews(nextReviews);
    if (typeof window !== "undefined") {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(nextReviews.slice(defaultReviews.length)));
    }
    setName("");
    setScore("5");
    setText("");
    setFeedback("Avaliacao enviada.");
    setFormOpen(false);
  };

  return (
    <PanelShell title="Avaliacoes Menfi's" onClose={onClose}>
      <div className="mt-4 rounded-2xl p-4" style={{ background: "#fff" }}>
        <p
          style={{
            fontFamily: "'Bebas Neue','Arial Black',sans-serif",
            fontSize: "3.2rem",
            lineHeight: 0.9,
          }}
        >
          4.9
        </p>
        <p className="mt-1 text-sm font-black uppercase tracking-wide">
          Avaliacao media dos clientes
        </p>
        <p className="mt-2 text-sm font-semibold opacity-70">
          Prova social real para decidir rapido.
        </p>
        <button
          type="button"
          onClick={() => {
            setFormOpen((current) => !current);
            setFeedback("");
          }}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl text-xs font-black uppercase tracking-wide"
          style={{ background: `${ROSA}70`, color: VINHO }}
        >
          Inserir sua avaliacao
        </button>
      </div>
      {formOpen && (
        <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4" style={{ border: `1px solid ${VINHO}12` }}>
          <label className="grid gap-1">
            <span className="text-[10px] font-black uppercase tracking-wide opacity-55">Nome</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              className="h-11 rounded-2xl px-4 text-sm font-bold outline-none"
              style={{ border: `1px solid ${VINHO}14`, color: VINHO }}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[10px] font-black uppercase tracking-wide opacity-55">Nota</span>
            <select
              value={score}
              onChange={(event) => setScore(event.target.value)}
              className="h-11 rounded-2xl px-4 text-sm font-bold outline-none"
              style={{ border: `1px solid ${VINHO}14`, color: VINHO }}
              aria-label="Escolha sua nota"
            >
              <option value="5">5 estrelas</option>
              <option value="4">4 estrelas</option>
              <option value="3">3 estrelas</option>
              <option value="2">2 estrelas</option>
              <option value="1">1 estrela</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-[10px] font-black uppercase tracking-wide opacity-55">Observacao</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Conte como foi sua experiencia com a Menfi's"
              className="min-h-24 resize-none rounded-2xl px-4 py-3 text-sm font-bold outline-none"
              style={{ border: `1px solid ${VINHO}14`, color: VINHO }}
            />
          </label>
          <button
            type="button"
            onClick={submitReview}
            className="flex h-12 w-full items-center justify-center rounded-2xl text-xs font-black uppercase tracking-wide"
            style={{ background: VINHO, color: ROSA }}
          >
            Enviar avaliacao
          </button>
        </div>
      )}
      {feedback && (
        <p className="mt-3 rounded-2xl px-4 py-3 text-xs font-black" style={{ background: `${ROSA}55`, color: VINHO }}>
          {feedback}
        </p>
      )}
      <div className="mt-4 grid gap-3">
        {reviews.map((review) => (
          <article
            key={`${review.text}-${review.createdAt ?? review.score}`}
            className="rounded-2xl bg-white p-4"
            style={{ border: `1px solid ${VINHO}12` }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black">{"★".repeat(Math.max(1, Math.round(Number(review.score))))}</p>
              <p className="font-black">{review.score}</p>
            </div>
            {review.name && <p className="mt-2 text-xs font-black uppercase tracking-wide opacity-60">{review.name}</p>}
            <p className="mt-2 text-sm font-semibold leading-relaxed opacity-70">
              "{review.text}"
            </p>
          </article>
        ))}
      </div>
    </PanelShell>
  );
}


