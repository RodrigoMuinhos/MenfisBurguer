import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CATEGORIES, type CategoryId } from "@/components/product/shared";
import { preloadClientImages } from "@/components/product/screen/productCatalog";

const BACKGROUND_SRC = "/event/TelaInicalEventoFundo.png";

// Normalized cards (same size and frame) generated from the event art by
// scripts/build-idle-cards.py: wide cards stacked in portrait, square cards in
// a 2x2 grid in landscape. "Menu" opens the cardápio on its first tab.
const IDLE_MENU_BUTTONS: Array<{ category: CategoryId; card: string; alt: string }> = [
  { category: CATEGORIES[0].id, card: "menu", alt: "Menu" },
  { category: "combo", card: "combos", alt: "Combos" },
  { category: "lemonade", card: "lemonades", alt: "Lemonades" },
  { category: "bebida", card: "bebidas", alt: "Bebidas" },
];
const wideSrc = (card: string) => `/event/cards/${card}.webp`;
const squareSrc = (card: string) => `/event/cards/${card}-square.webp`;
const LANDSCAPE = "(orientation: landscape)";

const IDLE_MENU_CSS = `
.idle-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.8vh;
  /* Keep the cards below the "Menfi's Burger" logo. */
  padding: 21vh 0 4vh;
}
.idle-menu-card {
  width: min(86vw, 50vh);
  aspect-ratio: 1800 / 608;
}
@media ${LANDSCAPE} {
  .idle-menu {
    display: grid;
    grid-template-columns: repeat(2, auto);
    align-content: center;
    justify-content: center;
    gap: 3vh;
    padding: 4vh 0;
  }
  .idle-menu-card {
    width: min(42vh, 40vw);
    aspect-ratio: 1;
  }
}
`;

export function IdleMenuScreen({
  open,
  enabled,
  preload,
  onSelectCategory,
  onDismiss,
}: {
  open: boolean;
  enabled: boolean;
  preload: boolean;
  onSelectCategory: (category: CategoryId) => void;
  onDismiss: () => void;
}) {
  const selectedRef = useRef(false);

  useEffect(() => {
    if (!preload) return;
    preloadClientImages([
      BACKGROUND_SRC,
      ...IDLE_MENU_BUTTONS.flatMap(({ card }) => [wideSrc(card), squareSrc(card)]),
    ]);
  }, [preload]);

  useEffect(() => {
    if (open) selectedRef.current = false;
  }, [open]);

  const select = (category: CategoryId) => {
    // Ignore a second tap while the overlay fades out.
    if (selectedRef.current) return;
    selectedRef.current = true;
    onSelectCategory(category);
  };

  return (
    // initial={false}: when the page loads on the idle screen, show it at once.
    <AnimatePresence initial={false}>
      {enabled && open && (
        <motion.div
          key="idle-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="idle-menu fixed inset-0 z-[120] select-none overflow-hidden"
          style={{
            width: "100vw",
            height: "100vh",
            backgroundColor: "#fde4ea",
            backgroundImage: `url("${BACKGROUND_SRC}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            touchAction: "manipulation",
          }}
          onClick={() => {
            if (!selectedRef.current) onDismiss();
          }}
        >
          <style>{IDLE_MENU_CSS}</style>
          {IDLE_MENU_BUTTONS.map(({ category, card, alt }, index) => (
            <motion.button
              key={alt}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 * index }}
              onClick={(event) => {
                event.stopPropagation();
                select(category);
              }}
              className="idle-menu-card block shrink-0 cursor-pointer border-0 bg-transparent p-0 outline-none"
              style={{
                filter: "drop-shadow(0 10px 24px rgba(101,0,31,0.16))",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <picture className="block h-full w-full">
                <source media={LANDSCAPE} srcSet={squareSrc(card)} />
                <img
                  src={wideSrc(card)}
                  alt={alt}
                  draggable={false}
                  className="pointer-events-none block h-full w-full"
                />
              </picture>
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
