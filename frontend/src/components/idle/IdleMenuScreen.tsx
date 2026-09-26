import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CATEGORIES, type CategoryId } from "@/components/product/shared";
import { preloadClientImages } from "@/components/product/screen/productCatalog";

const BACKGROUND_SRC = "/event/TelaInicalEventoFundo.png";

// Normalized cards (same size and frame) generated from the event art by
// scripts/build-idle-cards.py. "Menu" opens the cardápio on its first tab.
const IDLE_MENU_BUTTONS: Array<{ category: CategoryId; src: string; alt: string }> = [
  { category: CATEGORIES[0].id, src: "/event/cards/menu.webp", alt: "Menu" },
  { category: "combo", src: "/event/cards/combos.webp", alt: "Combos" },
  { category: "lemonade", src: "/event/cards/lemonades.webp", alt: "Lemonades" },
  { category: "bebida", src: "/event/cards/bebidas.webp", alt: "Bebidas" },
];

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
    preloadClientImages([BACKGROUND_SRC, ...IDLE_MENU_BUTTONS.map(({ src }) => src)]);
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
    <AnimatePresence>
      {enabled && open && (
        <motion.div
          key="idle-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex select-none flex-col items-center justify-center overflow-hidden"
          style={{
            width: "100vw",
            height: "100vh",
            backgroundColor: "#fde4ea",
            backgroundImage: `url("${BACKGROUND_SRC}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            // Keep the cards below the "Menfi's Burger" logo.
            paddingTop: "21vh",
            paddingBottom: "4vh",
            gap: "1.8vh",
            touchAction: "manipulation",
          }}
          onClick={() => {
            if (!selectedRef.current) onDismiss();
          }}
        >
          {IDLE_MENU_BUTTONS.map(({ category, src, alt }, index) => (
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
              className="block shrink-0 cursor-pointer border-0 bg-transparent p-0 outline-none"
              // 2.96:1 cards: 50vh wide keeps all four (plus gaps) within ~73vh.
              style={{
                width: "min(86vw, 50vh)",
                aspectRatio: "1800 / 608",
                filter: "drop-shadow(0 10px 24px rgba(101,0,31,0.16))",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <img
                src={src}
                alt={alt}
                draggable={false}
                className="pointer-events-none block h-full w-full"
              />
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
