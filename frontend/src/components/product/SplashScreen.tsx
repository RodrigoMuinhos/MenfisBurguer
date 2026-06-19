import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import completeLogo from "@/imports/complete-logo.png";

const VINHO = "#65001F";
const ROSA = "#FFAACF";
const PINK = "#EC1767";

export function SplashScreen({ onStart }: { onStart: () => void }) {
  const startedRef = useRef(false);

  const finish = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    onStart();
  };

  useEffect(() => {
    const timer = window.setTimeout(finish, 2900);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-white px-6"
      style={{
        color: VINHO,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <motion.div
        className="absolute inset-x-0 top-0 h-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [8, 0] }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(255,170,207,0.34), rgba(255,255,255,0) 62%)",
        }}
      />
      <motion.span
        className="absolute left-7 top-[18%] h-3 w-3 rounded-full"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.72, 0.48], scale: [0, 1, 1.08] }}
        transition={{ delay: 0.28, duration: 1.4, ease: "easeOut" }}
        style={{ background: ROSA }}
      />
      <motion.span
        className="absolute right-8 top-[27%] h-16 w-16 rounded-full"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 0.18, 0.24], scale: [0.6, 1, 1.06] }}
        transition={{ delay: 0.45, duration: 1.6, ease: "easeOut" }}
        style={{ background: PINK }}
      />
      <motion.span
        className="absolute bottom-[18%] left-10 h-10 w-10 rounded-full border"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: [0, 0.34, 0.2], y: [14, 0, -8] }}
        transition={{ delay: 0.72, duration: 1.8, ease: "easeOut" }}
        style={{ borderColor: ROSA }}
      />

      <section className="relative z-10 grid w-full max-w-sm place-items-center gap-8">
        <motion.img
          src={completeLogo.src}
          alt="Menfi's Burger"
          className="w-[min(70vw,290px)] object-contain"
          initial={{ opacity: 0, y: -14, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.38, duration: 0.62, ease: "easeOut" }}
          style={{
            filter: "drop-shadow(0 14px 18px rgba(101,0,31,0.12))",
            mixBlendMode: "multiply",
          }}
        />

        <motion.div
          className="relative h-[min(74vw,300px)] w-[min(74vw,300px)]"
          initial={{ opacity: 0, scale: 0.38, y: 18, rotate: -7 }}
          animate={{
            opacity: [0, 1, 1, 1],
            scale: [0.38, 1.08, 1, 1.03],
            y: [18, 0, 0, -4],
            rotate: [-7, 2, 0, 0],
          }}
          transition={{
            duration: 2.18,
            times: [0, 0.42, 0.72, 1],
            ease: "easeOut",
          }}
        >
          <motion.img
            src="/abertura.png"
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ delay: 1.2, duration: 1.1, ease: "easeInOut" }}
            style={{ filter: "drop-shadow(0 24px 30px rgba(101,0,31,0.18))" }}
          />
          {[0, 1, 2, 3].map((spark) => (
            <motion.span
              key={spark}
              className="absolute rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1, 0.82], opacity: [0, 0.9, 0] }}
              transition={{
                delay: 0.78 + spark * 0.16,
                duration: 0.72,
                ease: "easeOut",
              }}
              style={{
                left: spark === 0 ? 18 : spark === 1 ? "78%" : spark === 2 ? "12%" : "68%",
                top: spark === 0 ? "18%" : spark === 1 ? "24%" : spark === 2 ? "72%" : "82%",
                width: spark % 2 === 0 ? 8 : 12,
                height: spark % 2 === 0 ? 8 : 12,
                background: spark % 2 === 0 ? ROSA : PINK,
              }}
            />
          ))}
        </motion.div>
        <motion.p
          className="text-center text-xs font-black uppercase tracking-[0.28em]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 1, 0.65], y: [10, 0, 0] }}
          transition={{ delay: 1.15, duration: 1.35, ease: "easeOut" }}
          style={{ color: VINHO }}
        >
          Preparando seu pedido
        </motion.p>
      </section>
    </main>
  );
}
