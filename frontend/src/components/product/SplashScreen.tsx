import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import completeLogo from "@/imports/complete-logo.png";

const VINHO = "#65001F";
const ROSA = "#FFAAC6";
const ROSA_FORTE = "#EC1767";

export function SplashScreen({ onStart }: { onStart: () => void }) {
  const startedRef = useRef(false);

  const finish = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    onStart();
  };

  useEffect(() => {
    const timer = window.setTimeout(finish, 3100);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main
      className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6"
      style={{
        background: ROSA,
        color: VINHO,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.38), rgba(255,255,255,0) 38%)",
        }}
      />

      <section className="relative z-10 grid w-full max-w-sm place-items-center">
        <motion.div
          className="relative h-52 w-72"
          initial={{ opacity: 0, y: 28, scale: 0.86 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [28, 0, 0, -8],
            scale: [0.86, 1, 1, 0.96],
          }}
          transition={{
            duration: 2.18,
            times: [0, 0.28, 0.76, 1],
            ease: "easeOut",
          }}
        >
          <motion.img
            src="/menu/menfisburguer.png"
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            initial={{ rotate: -3 }}
            animate={{ rotate: [-3, 2, -1] }}
            transition={{ duration: 1.7, ease: "easeInOut" }}
            style={{ filter: "drop-shadow(0 22px 24px rgba(101,0,31,0.18))" }}
          />
          {[0, 1, 2].map((bite) => (
            <motion.span
              key={bite}
              className="absolute rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.08, 1], opacity: [0, 1, 1] }}
              transition={{
                delay: 1.1 + bite * 0.28,
                duration: 0.24,
                ease: "easeOut",
              }}
              style={{
                right: bite === 0 ? 26 : bite === 1 ? 58 : 88,
                top: bite === 0 ? 54 : bite === 1 ? 78 : 46,
                width: bite === 1 ? 72 : 58,
                height: bite === 1 ? 72 : 58,
                background: ROSA,
                boxShadow: "0 0 0 2px rgba(255,255,255,0.16)",
              }}
            />
          ))}
          <motion.span
            className="absolute left-1/2 top-4 h-10 w-12 rounded-full blur-md"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: [0, 0.45, 0], y: [8, -12, -28] }}
            transition={{ delay: 0.65, duration: 1.4, ease: "easeOut" }}
            style={{ background: "rgba(255,255,255,0.72)" }}
          />
        </motion.div>

        <motion.img
          src={completeLogo.src}
          alt="Menfi's Burger"
          className="absolute w-[min(78vw,330px)] object-contain"
          initial={{ opacity: 0, scale: 0.86, y: 18 }}
          animate={{ opacity: [0, 0, 1], scale: [0.86, 0.86, 1], y: [18, 18, 0] }}
          transition={{ duration: 2.75, times: [0, 0.74, 1], ease: "easeOut" }}
          style={{
            filter: "drop-shadow(0 18px 24px rgba(101,0,31,0.18))",
            mixBlendMode: "multiply",
          }}
        />
      </section>

      <motion.button
        type="button"
        onClick={finish}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.15, duration: 0.38, ease: "easeOut" }}
        className="absolute inset-x-4 bottom-5 flex h-14 items-center justify-center rounded-2xl text-sm font-black uppercase tracking-[0.18em]"
        style={{
          background: "#fff",
          color: VINHO,
          border: `1px solid ${ROSA_FORTE}22`,
          boxShadow: "0 18px 36px rgba(101,0,31,0.14)",
        }}
      >
        Iniciar pedido
      </motion.button>
    </main>
  );
}
