import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { CartItem } from "@/types/order";
import { VERDE } from "@/utils/theme";
import { fmt } from "./checkout";

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

const FRY_SUGGESTIONS = DEFAULT_SUGGESTIONS.filter((item) =>
  item.id.startsWith("batata") || item.id.includes("nuggets"),
);

const DRINK_SUGGESTIONS = DEFAULT_SUGGESTIONS.filter((item) =>
  ["coca-zero", "guarana-zero", "agua-com-gas"].includes(item.id),
);

const SWEET_SUGGESTIONS: SuggestedExtra[] = [
  {
    id: "sweet-menfis-classic",
    name: "Sweet Menfi's Classic",
    price: 8.9,
    description: "Caixinha com 4 doces clássicos",
    image: "/sweet2.jpg",
  },
  {
    id: "sweet-menfis-plus",
    name: "Sweet Menfi's Plus",
    price: 12.9,
    description: "Caixinha com 4 doces premium",
    image: "/s2.jpg",
  },
];

const EXTRA_SUGGESTIONS: SuggestedExtra[] = [
  { id: "extra-maionese-barbecue", name: "Maionse Grill", price: 2.5, description: "Molho extra", image: "/EXTRAS/MaioneseBarbecue.jpg" },
  { id: "extra-maionese-alho-frito", name: "Maionese Alho Frito", price: 2.5, description: "Molho extra", image: "/EXTRAS/MaionseAlhoFrito.jpg" },
  { id: "extra-cheddar", name: "Adicional de cheddar", price: 6.9, description: "Cheddar extra", image: "/queijo.jpg" },
];

const BURGER_SUGGESTIONS: SuggestedExtra[] = [
  { id: "burger", name: "Menfi's Burger", price: 25.9, description: "Burger 130g", image: "/menu/menfisburguer.png" },
  { id: "menfis-chicken", name: "Menfi's Chicken", price: 24.9, description: "Chicken crocante", image: "/menu/CHICKEN.png" },
  { id: "menfis-bacon", name: "Menfi's Bacon", price: 27.9, description: "Burger 130g com bacon", image: "/menu/BACON.png" },
];

const COMBO_OFFER_BUNDLES: SuggestedExtra[][] = [
  [
    {
      id: "batata-pequena",
      name: "Batata Frita Pequena",
      price: 9.9,
      description: "90g crocante",
      image: "/EXTRAS/batata.jpg",
      message: "Seu combo já vem com batata e refri. Quer completar com uma fritura, um doce e uma bebida?",
    },
    SWEET_SUGGESTIONS[0],
    { id: "guarana-zero", name: "Guaraná Zero", price: 6.9, description: "Lata 350ml gelada", image: "/EXTRAS/Gurarana.jpg" },
  ],
  [
    {
      id: "batata-media",
      name: "Batata Frita Média",
      price: 14.9,
      description: "180g crocante",
      image: "/EXTRAS/batata.jpg",
      message: "Outra opção para completar: uma fritura, um extra e um burger.",
    },
    EXTRA_SUGGESTIONS[0],
    BURGER_SUGGESTIONS[0],
  ],
  [
    {
      id: "nuggets-grande",
      name: "Menfi's Nuggets 270g",
      price: 29.9,
      description: "270g com molho e ketchup",
      image: "/nuggetfries.jpg",
      message: "Quer variar? Fritura, doce e bebida sempre aparecem como opção.",
    },
    SWEET_SUGGESTIONS[1],
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
  const suggestions = buildHeroSuggestions(cart);
  const [suggestionPage, setSuggestionPage] = useState(0);
  const activeSuggestion = suggestions[suggestionPage % Math.max(suggestions.length, 1)];
  const primaryMessage = activeSuggestion?.message;

  useEffect(() => {
    setSuggestionPage(0);
  }, [suggestions.map((item) => item.id).join("|")]);

  useEffect(() => {
    if (suggestions.length <= 1) return;
    const timer = window.setInterval(() => {
      setSuggestionPage((page) => (page + 1) % suggestions.length);
    }, 5000);
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
        {activeSuggestion && (
          <div className="overflow-hidden rounded-[22px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.button
                key={activeSuggestion.id}
                type="button"
                onClick={() => addToCart(activeSuggestion)}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="grid w-full grid-cols-[42%_1fr] overflow-hidden rounded-[22px] text-left sm:grid-cols-[48%_1fr]"
                style={{ background: "#fff", border: `2px solid ${VERDE}10`, boxShadow: "0 10px 24px rgba(101,0,31,0.06)" }}
              >
                <div className="relative min-h-44 overflow-hidden sm:min-h-52" style={{ background: "#FCEFF2" }}>
                  <Image src={activeSuggestion.image} alt={activeSuggestion.name} fill sizes="50vw" className="object-cover" />
                </div>
                <div className="relative flex min-w-0 flex-col justify-center p-5 sm:p-7">
                  <p className="text-lg font-black sm:text-2xl" style={{ color: VERDE }}>{fmt(activeSuggestion.price)}</p>
                  <p className="mt-2 text-base font-black leading-tight sm:text-xl" style={{ color: "#222" }}>{activeSuggestion.name}</p>
                  <p className="mt-2 text-xs leading-relaxed sm:text-sm" style={{ color: VERDE, opacity: 0.58 }}>{activeSuggestion.description}</p>
                  <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "#fff", color: VERDE, boxShadow: "0 8px 18px rgba(0,0,0,0.14)" }}>
                    {(cart.find((item) => item.id === activeSuggestion.id)?.qty ?? 0) > 0
                      ? <span className="text-sm font-black">{cart.find((item) => item.id === activeSuggestion.id)?.qty}</span>
                      : <Plus size={22} strokeWidth={2.7} />}
                  </span>
                </div>
              </motion.button>
            </AnimatePresence>
            {suggestions.length > 1 && (
              <div className="mt-3 flex justify-center gap-1.5" aria-label="Ofertas disponíveis">
                {suggestions.map((suggestion, index) => (
                  <button key={suggestion.id} type="button" aria-label={`Ver ${suggestion.name}`} onClick={() => setSuggestionPage(index)} className="h-1.5 rounded-full transition-all duration-300" style={{ width: index === suggestionPage ? 24 : 6, background: VERDE, opacity: index === suggestionPage ? 1 : 0.22 }} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function buildHeroSuggestions(cart: CartItem[]): SuggestedExtra[] {
  const cartIds = new Set(cart.map((item) => item.id));
  const nuggetsOnly = DEFAULT_SUGGESTIONS.filter((item) => item.id.includes("nuggets"));
  const garlicMayo = EXTRA_SUGGESTIONS.find((item) => item.id === "extra-maionese-alho-frito")!;

  // O hero tem sempre três páginas: nugget, molho e doce.
  return [
    pickAvailable(nuggetsOnly, cartIds) ?? nuggetsOnly[0],
    garlicMayo,
    pickAvailable(SWEET_SUGGESTIONS, cartIds) ?? SWEET_SUGGESTIONS[0],
  ];
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

  return buildMixedOfferRotation(ids);
}

function prependUnique(primary: SuggestedExtra, cartIds: Set<string>) {
  const rest = buildMixedOfferRotation(cartIds).filter((item) => item.id !== primary.id);
  return [primary, ...rest].slice(0, 6);
}

function buildComboOfferRotation(cartIds: Set<string>) {
  const suggestions = COMBO_OFFER_BUNDLES.flatMap((bundle) => {
    const available = bundle.filter((item) => !cartIds.has(item.id));
    if (available.length >= 3) return available.slice(0, 3);
    const fill = buildMixedOfferRotation(cartIds).filter(
      (item) => !cartIds.has(item.id) && !available.some((current) => current.id === item.id),
    );
    return [...available, ...fill].slice(0, 3);
  });
  return suggestions.length ? suggestions : buildMixedOfferRotation(cartIds);
}

function pickAvailable(group: SuggestedExtra[], cartIds: Set<string>, offset = 0) {
  const available = group.filter((item) => !cartIds.has(item.id));
  if (!available.length) return null;
  return available[offset % available.length];
}

function buildMixedOfferRotation(cartIds: Set<string>) {
  const bundles = [
    [pickAvailable(FRY_SUGGESTIONS, cartIds, 0), pickAvailable(SWEET_SUGGESTIONS, cartIds, 0), pickAvailable(DRINK_SUGGESTIONS, cartIds, 0)],
    [pickAvailable(FRY_SUGGESTIONS, cartIds, 1), pickAvailable(EXTRA_SUGGESTIONS, cartIds, 0), pickAvailable(BURGER_SUGGESTIONS, cartIds, 0)],
    [pickAvailable(FRY_SUGGESTIONS, cartIds, 2), pickAvailable(SWEET_SUGGESTIONS, cartIds, 1), pickAvailable(DRINK_SUGGESTIONS, cartIds, 1)],
    [pickAvailable(FRY_SUGGESTIONS, cartIds, 3), pickAvailable(EXTRA_SUGGESTIONS, cartIds, 1), pickAvailable(BURGER_SUGGESTIONS, cartIds, 1)],
  ];
  const seen = new Set<string>();
  return bundles.flatMap((bundle) =>
    bundle.filter((item): item is SuggestedExtra => {
      if (!item || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }),
  );
}
