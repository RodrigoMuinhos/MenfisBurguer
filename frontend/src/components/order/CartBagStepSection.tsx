import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { CartItem } from "@/types/order";
import { VERDE } from "@/utils/theme";
import { fmt } from "./checkout";
import { SuggestedCard } from "./SuggestedCard";

type SuggestedExtra = {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  message?: string;
};

const SANDWICH_TO_COMBO: Record<string, string> = {
  burger: "combo",
  "double-burger": "double-combo",
  "menfis-chicken": "chicken-combo",
  "double-menfis-chicken": "double-chicken-combo",
  "menfis-bacon": "bacon-combo",
  "double-menfis-bacon": "double-bacon-combo",
};

const PRODUCT_LOOKUP: Record<string, { name: string; price: number }> = {
  burger: { name: "Menfi's Burger", price: 25.9 },
  "double-burger": { name: "BIG Menfi's", price: 29.9 },
  "menfis-chicken": { name: "Menfi's Chicken", price: 24.9 },
  "double-menfis-chicken": { name: "BIG Menfi's Chicken", price: 32.9 },
  "menfis-bacon": { name: "Menfi's Bacon", price: 27.9 },
  "double-menfis-bacon": { name: "BIG Menfi's Bacon", price: 35.9 },
  combo: { name: "Combo Menfi's", price: 34.9 },
  "double-combo": { name: "Combo BIG Menfi's", price: 42.9 },
  "chicken-combo": { name: "Combo Menfi's Chicken", price: 38.9 },
  "double-chicken-combo": { name: "Combo BIG Menfi's Chicken", price: 46.9 },
  "bacon-combo": { name: "Combo Menfi's Bacon", price: 40.9 },
  "double-bacon-combo": { name: "Combo BIG Menfi's Bacon", price: 48.9 },
};

const FRIES_PRODUCTS = {
  small: { id: "batata-pequena", name: "Batata Frita Pequena 90g", price: 9.9 },
  medium: { id: "batata-media", name: "Batata Frita Média 180g", price: 14.9 },
  large: { id: "batata", name: "Batata Frita Grande 270g", price: 19.9 },
};

const DEFAULT_SUGGESTIONS: SuggestedExtra[] = [
  {
    id: "batata-pequena",
    name: "Batata Frita Pequena",
    price: 9.9,
    description: "90g crocante",
    image: "/EXTRAS/batata.jpg",
  },
  {
    id: "batata-media",
    name: "Batata Frita Média",
    price: 14.9,
    description: "180g crocante",
    image: "/EXTRAS/batata.jpg",
  },
  {
    id: "batata",
    name: "Batata Frita Grande",
    price: 19.9,
    description: "270g para compartilhar",
    image: "/EXTRAS/batata.jpg",
  },
  {
    id: "nuggets-90g",
    name: "Menfi's Nuggets 90g",
    price: 12.9,
    description: "Acompanha molho e ketchup",
    image: "/nuggetfries.jpg",
  },
  {
    id: "nuggets-180g",
    name: "Menfi's Nuggets 180g",
    price: 18.9,
    description: "180g com molho e ketchup",
    image: "/nuggetfries.jpg",
  },
  {
    id: "nuggets-grande",
    name: "Menfi's Nuggets 270g",
    price: 29.9,
    description: "270g para compartilhar",
    image: "/nuggetfries.jpg",
  },
  { id: "coca-zero", name: "Coca-Cola Zero", price: 8.9, description: "Lata 350ml gelada", image: "/EXTRAS/cocazero.jpg" },
  { id: "guarana-zero", name: "Guaraná Zero", price: 6.9, description: "Lata 350ml gelada", image: "/EXTRAS/Gurarana.jpg" },
  { id: "agua-com-gas", name: "Água com gás", price: 5.9, description: "Garrafa gelada", image: "/EXTRAS/aguaComGas.png" },
];

const COMBO_OFFER_BUNDLES: SuggestedExtra[][] = [
  [
    {
      id: "batata-pequena",
      name: "Batata Frita Pequena",
      price: 9.9,
      description: "90g crocante",
      image: "/EXTRAS/batata.jpg",
      message: "Seu combo já vem com batata e refri. Quer deixar ainda melhor com nuggets e uma porção extra?",
    },
    {
      id: "nuggets-180g",
      name: "Menfi's Nuggets 180g",
      price: 18.9,
      description: "180g com molho e ketchup",
      image: "/nuggetfries.jpg",
    },
    { id: "guarana-zero", name: "Guaraná Zero", price: 6.9, description: "Lata 350ml gelada", image: "/EXTRAS/Gurarana.jpg" },
  ],
  [
    {
      id: "batata-media",
      name: "Batata Frita Média",
      price: 14.9,
      description: "180g crocante",
      image: "/EXTRAS/batata.jpg",
      message: "Outra combinação para aumentar o ticket: batata média, nuggets pequeno e Coca gelada.",
    },
    {
      id: "nuggets-90g",
      name: "Menfi's Nuggets 90g",
      price: 12.9,
      description: "Acompanha molho e ketchup",
      image: "/nuggetfries.jpg",
    },
    { id: "coca-zero", name: "Coca-Cola Zero", price: 8.9, description: "Lata 350ml gelada", image: "/EXTRAS/cocazero.jpg" },
  ],
  [
    {
      id: "batata",
      name: "Batata Frita Grande",
      price: 19.9,
      description: "270g para compartilhar",
      image: "/EXTRAS/batata.jpg",
      message: "Para dividir melhor: batata grande, nuggets grande e bebida extra.",
    },
    {
      id: "nuggets-grande",
      name: "Menfi's Nuggets 270g",
      price: 29.9,
      description: "270g com molho e ketchup",
      image: "/nuggetfries.jpg",
    },
    { id: "agua-com-gas", name: "Água com gás", price: 5.9, description: "Garrafa gelada", image: "/EXTRAS/aguaComGas.png" },
  ],
];

export function CartBagStepSection({
  cart,
  addToCart,
  clearCart,
  goToMenu,
}: {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "qty">) => void;
  clearCart: () => void;
  goToMenu: () => void;
}) {
  const suggestions = buildUpsellSuggestions(cart);
  const [suggestionPage, setSuggestionPage] = useState(0);
  const visibleSuggestions = useMemo(
    () => rotatingWindow(suggestions, suggestionPage, 3),
    [suggestionPage, suggestions],
  );
  const primaryMessage = visibleSuggestions.find((item) => item.message)?.message;

  useEffect(() => {
    setSuggestionPage(0);
  }, [suggestions.map((item) => item.id).join("|")]);

  useEffect(() => {
    if (suggestions.length <= 3) return;
    const timer = window.setInterval(() => {
      setSuggestionPage((page) => (page + 3) % suggestions.length);
    }, 9000);
    return () => window.clearInterval(timer);
  }, [suggestions.length]);

  return (
    <>
      <div
        className="rounded-[26px] p-4"
        style={{
          background: "#fff",
          border: `1px solid ${VERDE}10`,
          boxShadow: "0 14px 36px rgba(31,61,46,0.06)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image
              src="/logo_M.jpeg"
              alt="Menfi's"
              width={48}
              height={48}
              className="rounded-full"
            />
            <div>
              <p className="text-lg font-black" style={{ color: "#18181B" }}>
                Menfi's Burger
              </p>
              <button
                onClick={goToMenu}
                className="mt-0.5 text-left text-sm font-black"
                style={{
                  color: VERDE,
                  border: 0,
                  background: "transparent",
                  padding: 0,
                }}
              >
                Adicionar mais itens
              </button>
            </div>
          </div>
          <button
            onClick={clearCart}
            className="text-sm font-bold"
            style={{ color: VERDE, background: "transparent", border: 0 }}
          >
            Limpar
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xl font-black" style={{ color: "#1F1F1F" }}>
          Peça também
        </h3>
        {primaryMessage && (
          <p className="mb-3 rounded-2xl px-4 py-3 text-xs font-black leading-relaxed" style={{ background: "#FFF8F2", color: VERDE, border: `1px solid ${VERDE}12` }}>
            {primaryMessage}
          </p>
        )}
        <div className="grid grid-cols-3 gap-3 overflow-hidden pb-2">
          {visibleSuggestions.slice(0, 3).map((suggestion) => (
            <SuggestedCard
              key={suggestion.id}
              id={suggestion.id}
              name={suggestion.name}
              price={suggestion.price}
              description={suggestion.description}
              image={suggestion.image}
              qty={cart.find((item) => item.id === suggestion.id)?.qty ?? 0}
              onAdd={addToCart}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function buildUpsellSuggestions(cart: CartItem[]): SuggestedExtra[] {
  const ids = new Set(cart.map((item) => item.id));
  const hasCombo = cart.some((item) => item.id.includes("combo"));
  const hasNuggets = cart.some((item) => item.id.includes("nuggets"));
  const hasFries = cart.some((item) => item.id === "batata" || item.id.startsWith("batata-") || item.id.includes("combo"));
  const hasDrink = cart.some((item) => ["coca-zero", "guarana-zero", "agua-com-gas"].includes(item.id) || item.id.includes("combo"));
  const sandwich = cart.find((item) => SANDWICH_TO_COMBO[item.id]);
  const hasSmallFries = cart.some((item) => item.id === FRIES_PRODUCTS.small.id);
  const hasMediumFries = cart.some((item) => item.id === FRIES_PRODUCTS.medium.id);
  const hasLargeFries = cart.some((item) => item.id === FRIES_PRODUCTS.large.id);

  if (hasSmallFries && !hasMediumFries && !hasLargeFries) {
    const mediumDiff = FRIES_PRODUCTS.medium.price - FRIES_PRODUCTS.small.price;
    const largeDiff = FRIES_PRODUCTS.large.price - FRIES_PRODUCTS.small.price;
    return [
      {
        id: "upgrade-batata-pequena-media",
        name: "Upgrade para Batata Média",
        price: mediumDiff,
        description: "180g, o dobro de batata",
        image: "/EXTRAS/batata.jpg",
        message: `Vale mais a pena: por mais ${fmt(mediumDiff)}, você leva a Batata Média com o dobro de batata: 180g.`,
      },
      {
        id: "upgrade-batata-pequena-grande",
        name: "Upgrade para Batata Grande",
        price: largeDiff,
        description: "270g para compartilhar",
        image: "/EXTRAS/batata.jpg",
        message: `Melhor para dividir: por mais ${fmt(largeDiff)}, você transforma em Batata Grande com 270g para compartilhar.`,
      },
      ...DEFAULT_SUGGESTIONS.filter((item) => !ids.has(item.id) && !item.id.startsWith("batata")),
    ].slice(0, 5);
  }

  if (hasMediumFries && !hasLargeFries) {
    const largeDiff = FRIES_PRODUCTS.large.price - FRIES_PRODUCTS.medium.price;
    return prependUnique(
      {
        id: "upgrade-batata-media-grande",
        name: "Upgrade para Batata Grande",
        price: largeDiff,
        description: "270g para compartilhar",
        image: "/EXTRAS/batata.jpg",
        message: `Por mais ${fmt(largeDiff)}, você transforma sua Batata Média em Batata Grande com 270g.`,
      },
      ids,
    );
  }

  if (hasLargeFries && !hasNuggets) {
    return prependUnique(
      {
        id: "nuggets-90g",
        name: "Menfi's Nuggets 90g",
        price: 12.9,
        description: "Acompanha molho e ketchup",
        image: "/nuggetfries.jpg",
        message: "Quer completar com uma porção de Menfi's Nuggets?",
      },
      ids,
    );
  }

  if (sandwich && !hasFries && !hasDrink) {
    const combo = PRODUCT_LOOKUP[SANDWICH_TO_COMBO[sandwich.id]];
    const base = PRODUCT_LOOKUP[sandwich.id];
    const diff = Math.max(0, (combo?.price ?? 0) - (base?.price ?? sandwich.price));
    return prependUnique(
      {
        id: `upgrade-${sandwich.id}-combo`,
        name: "Upgrade para combo",
        price: diff,
        description: "Troque por combo completo",
        image: "/menu/combomenfis.png",
        message: `Por mais ${fmt(diff)} você transforma seu ${base?.name ?? sandwich.name} em combo com batata + refrigerante.`,
      },
      ids,
    );
  }

  if (sandwich && hasFries && !hasDrink) {
    return prependUnique(
      {
        id: "guarana-zero",
        name: "Guaraná Zero",
        price: 6.9,
        description: "Falta só o refrigerante",
        image: "/EXTRAS/Gurarana.jpg",
        message: "Falta só o refrigerante para completar seu combo.",
      },
      ids,
    );
  }

  if (sandwich && hasDrink && !hasFries) {
    return prependUnique(
      {
        id: "batata-pequena",
        name: "Batata frita pequena",
        price: 9.9,
        description: "Falta só a batata",
        image: "/EXTRAS/batata.jpg",
        message: "Falta só a batata para completar seu combo.",
      },
      ids,
    );
  }

  if (hasCombo && !hasNuggets) {
    return buildComboOfferRotation(ids);
  }

  if (hasCombo && hasNuggets) {
    return buildComboOfferRotation(ids);
  }

  return DEFAULT_SUGGESTIONS.filter((item) => !ids.has(item.id));
}

function prependUnique(primary: SuggestedExtra, cartIds: Set<string>) {
  const rest = DEFAULT_SUGGESTIONS.filter((item) => item.id !== primary.id && !cartIds.has(item.id));
  return [primary, ...rest].slice(0, 5);
}

function buildComboOfferRotation(cartIds: Set<string>) {
  const suggestions = COMBO_OFFER_BUNDLES.flatMap((bundle) => {
    const available = bundle.filter((item) => !cartIds.has(item.id));
    if (available.length >= 3) return available.slice(0, 3);
    const fill = DEFAULT_SUGGESTIONS.filter(
      (item) => !cartIds.has(item.id) && !available.some((current) => current.id === item.id),
    );
    return [...available, ...fill].slice(0, 3);
  });
  return suggestions.length ? suggestions : DEFAULT_SUGGESTIONS.filter((item) => !cartIds.has(item.id));
}

function rotatingWindow<T>(items: T[], start: number, size: number) {
  if (items.length <= size) return items;
  return Array.from({ length: size }, (_, index) => items[(start + index) % items.length]);
}
