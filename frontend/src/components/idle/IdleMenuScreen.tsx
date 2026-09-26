import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CategoryId } from "@/components/product/shared";
import { preloadClientImages } from "@/components/product/screen/productCatalog";

const BACKGROUND_SRC = "/event/TelaInicalEventoFundo.png";

// The card art is opaque with white corners outside its rounded border;
// `radius` (horizontal % / vertical % of the image) clips them away.
const IDLE_MENU_BUTTONS: Array<{
  category: CategoryId;
  src: string;
  alt: string;
  radius: string;
}> = [
  { category: "combo", src: "/event/btcombo.png", alt: "Combos", radius: "4.2% / 11.9%" },
  { category: "lemonade", src: "/event/bt%20lemon.png", alt: "Lemonades", radius: "4% / 9.4%" },
  { category: "bebida", src: "/event/tbebida.png", alt: "Bebidas", radius: "3.3% / 7.6%" },
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
            paddingTop: "22vh",
            paddingBottom: "8vh",
            gap: "2.4vh",
            touchAction: "manipulation",
          }}
          onClick={() => {
            if (!selectedRef.current) onDismiss();
          }}
        >
          {IDLE_MENU_BUTTONS.map(({ category, src, alt, radius }, index) => (
            <motion.button
              key={category}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 * index }}
              onClick={(event) => {
                event.stopPropagation();
                select(category);
              }}
              className="block shrink-0 cursor-pointer overflow-hidden border-0 bg-transparent p-0 outline-none"
              // ~2.3–2.8:1 cards: 43vh wide keeps all three (plus gaps) within ~57vh.
              style={{
                width: "min(84vw, 43vh)",
                borderRadius: radius,
                boxShadow: "0 12px 32px rgba(101,0,31,0.16)",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <img
                src={src}
                alt={alt}
                draggable={false}
                className="pointer-events-none block h-auto w-full"
              />
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
