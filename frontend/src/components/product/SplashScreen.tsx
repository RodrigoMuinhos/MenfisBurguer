import { useEffect, useRef } from "react";
import { motion } from "motion/react";

const SPLASH_FALLBACK_MS = 4200;
const VINHO = "#65001F";

export function SplashScreen({ onStart }: { onStart: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onStart();
  };

  useEffect(() => {
    const fallback = window.setTimeout(finish, SPLASH_FALLBACK_MS);
    const video = videoRef.current;

    if (video) {
      video.play().catch(() => {
        window.setTimeout(finish, 900);
      });
    }

    return () => window.clearTimeout(fallback);
  }, []);

  return (
    <main
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-white"
      style={{
        color: VINHO,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <motion.video
        ref={videoRef}
        src="/abertura.mp4?v=20260630"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="object-cover"
        style={{
          width: "min(100vw, 100dvh)",
          height: "min(100vw, 100dvh)",
          borderRadius: "50%",
          boxShadow: "0 24px 64px rgba(101, 0, 31, 0.2)",
        }}
        aria-label="Abertura Menfi's Burger"
      />
    </main>
  );
}
