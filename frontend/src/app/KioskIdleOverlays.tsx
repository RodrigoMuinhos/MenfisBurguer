import { AnimatePresence, motion } from "motion/react";
import { ROSA, VERDE } from "@/utils/theme";
import { Screen } from "./appState";
import { PresentationSettings, normalizePresentationSettings } from "@/components/order/checkout";
import { useEffect, useMemo, useState } from "react";

export function KioskIdleOverlays({
  kioskMode,
  showIdlePrompt,
  showIdleScreen,
  screen,
  onActivity,
  presentation,
}: {
  kioskMode: boolean;
  showIdlePrompt: boolean;
  showIdleScreen: boolean;
  screen: Screen;
  onActivity: () => void;
  presentation?: PresentationSettings;
}) {
  const hidden = screen === "admin" || screen === "admin-login";
  const settings = normalizePresentationSettings(presentation);
  const images = useMemo(
    () => settings.images.slice(0, Math.max(1, settings.imageCount)),
    [settings.imageCount, settings.images],
  );
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!showIdleScreen || !settings.enabled || images.length <= 1) {
      setActiveImage(0);
      return;
    }
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % images.length);
    }, settings.intervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [images.length, settings.enabled, settings.intervalSeconds, showIdleScreen]);

  return (
    <>
      <AnimatePresence>
        {kioskMode && showIdlePrompt && !showIdleScreen && !hidden && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center px-6"
            style={{
              background: "rgba(30,0,10,0.45)",
              backdropFilter: "blur(8px)",
            }}
            onClick={onActivity}
          >
            <motion.div
              initial={{ y: 18, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 18, scale: 0.96 }}
              className="w-full max-w-lg rounded-[32px] p-7 text-center"
              style={{
                background: "#fff",
                border: `2px solid ${ROSA}`,
                boxShadow: "0 26px 80px rgba(101,0,31,0.2)",
                color: VERDE,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <p
                className="font-black uppercase"
                style={{
                  fontFamily: "var(--menfis-font-display)",
                  fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
                  lineHeight: 0.95,
                }}
              >
                Vamos continuar?
              </p>
              <p className="mx-auto mt-4 max-w-sm text-base font-bold leading-relaxed opacity-70">
                Você ainda quer continuar a fazer seu pedido?
              </p>
              <button
                onClick={onActivity}
                className="mt-6 w-full rounded-2xl px-8 py-5 text-sm font-black uppercase tracking-[0.18em]"
                style={{ background: ROSA, color: VERDE }}
              >
                Continuar pedido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIdleScreen && !hidden && settings.enabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] overflow-hidden bg-black"
            onClick={onActivity}
          >
            <motion.div
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative h-full w-full overflow-hidden"
            >
              {images.map((image, index) => (
                <img
                  key={`${image}-${index}`}
                  src={image}
                  alt="Toque para iniciar pedido"
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                  style={{ opacity: index === activeImage ? 1 : 0 }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
