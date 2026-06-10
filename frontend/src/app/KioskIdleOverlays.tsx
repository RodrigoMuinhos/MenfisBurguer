import { AnimatePresence, motion } from "motion/react";
import { ROSA, VERDE } from "@/utils/theme";
import { Screen } from "./appState";

export function KioskIdleOverlays({
  kioskMode,
  showIdlePrompt,
  showIdleScreen,
  screen,
  onActivity,
}: {
  kioskMode: boolean;
  showIdlePrompt: boolean;
  showIdleScreen: boolean;
  screen: Screen;
  onActivity: () => void;
}) {
  const hidden = screen === "admin" || screen === "admin-login";

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
        {showIdleScreen && !hidden && (
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
              <img
                src="/descanso.png"
                alt="Toque para iniciar pedido"
                className="h-full w-full object-cover"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
