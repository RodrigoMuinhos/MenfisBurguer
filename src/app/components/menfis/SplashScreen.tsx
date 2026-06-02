import { motion } from "motion/react";
import completeLogo from "@/imports/complete-logo.png";

const VERDE = "#65001F";
const ROSA  = "#FFBACF";

export function SplashScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        height: "100dvh",
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        position: "relative",
      }}
    >
      {/* ── Logo ── */}
      <div style={{ width: "100%", overflow: "hidden", display: "flex", justifyContent: "center", padding: "0 24px" }}>
        <motion.img
          src={completeLogo.src}
          alt="Menfi's Burger"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            width: "min(82%, 760px)",
            objectFit: "contain",
            mixBlendMode: "multiply",
            display: "block",
            transformOrigin: "center center",
          }}
        />
      </div>

      {/* ── Barra inferior ── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "0 20px 18px",
          background: "transparent",
        }}
      >
        <motion.button
          onClick={onStart}
          whileTap={{ scale: 0.97, transition: { duration: 0.12 } }}
          style={{
            width: "100%",
            height: 56,
            background: ROSA,
            color: VERDE,
            border: "none",
            borderRadius: 16,
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: "0.1em",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(255,214,227,0.6)",
          }}
        >
          INICIAR PEDIDO
        </motion.button>
      </motion.div>
    </div>
  );
}
