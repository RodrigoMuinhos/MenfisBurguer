import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
}

const COLORS = [
  "#a78bfa", "#f472b6", "#fb923c", "#34d399", "#60a5fa",
  "#facc15", "#f87171", "#818cf8", "#2dd4bf", "#e879f9",
];

let nextId = 0;

function createParticle(x: number, y: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 1.5 + Math.random() * 3;
  return {
    id: nextId++,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 4 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    opacity: 1,
  };
}

export function ParticleButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const animFrameRef = useRef<number>(0);
  const spawnIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const spawnParticles = useCallback((count: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = mouseRef.current.x - rect.left;
    const cy = mouseRef.current.y - rect.top;
    const newParticles = Array.from({ length: count }, () => createParticle(cx, cy));
    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    const tick = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.08,
            opacity: p.opacity - 0.018,
            size: p.size * 0.97,
          }))
          .filter((p) => p.opacity > 0 && p.size > 0.5)
      );
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const startSpawning = useCallback(() => {
    spawnParticles(6);
    spawnIntervalRef.current = setInterval(() => spawnParticles(3), 60);
  }, [spawnParticles]);

  const stopSpawning = useCallback(() => {
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    startSpawning();
  }, [startSpawning]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    stopSpawning();
  }, [stopSpawning]);

  const handleClick = useCallback(() => {
    setIsPressed(true);
    spawnParticles(24);
    setTimeout(() => setIsPressed(false), 150);
  }, [spawnParticles]);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      style={{ isolation: "isolate" }}
    >
      {/* Particle canvas layer */}
      <div
        className="absolute inset-0 pointer-events-none overflow-visible"
        style={{ zIndex: 10 }}
      >
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: p.opacity,
              transform: "translate(-50%, -50%)",
              boxShadow: `0 0 ${p.size * 1.5}px ${p.color}`,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>

      <motion.button
        ref={buttonRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        animate={{
          scale: isPressed ? 0.94 : isHovered ? 1.04 : 1,
          boxShadow: isHovered
            ? "0 0 40px rgba(167,139,250,0.6), 0 0 80px rgba(244,114,182,0.3)"
            : "0 0 0px rgba(167,139,250,0)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="relative px-10 py-4 rounded-2xl font-semibold text-white cursor-pointer select-none overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #db2777 60%, #ea580c 100%)",
          border: "1px solid rgba(255,255,255,0.15)",
          fontSize: "1.1rem",
          letterSpacing: "0.04em",
        }}
      >
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
          }}
        />

        {/* Inner glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{ opacity: isHovered ? 0.6 : 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)",
          }}
        />

        <span className="relative z-10 flex items-center gap-2">
          <AnimatePresence mode="wait">
            {isHovered ? (
              <motion.span
                key="hovered"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                ✨ Hover Magic
              </motion.span>
            ) : (
              <motion.span
                key="default"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                Hover Me
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </motion.button>
    </div>
  );
}
