import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { CartItem } from "@/types/order";
import {
  KIOSK_IDLE_SCREEN_MS,
  Screen,
} from "../appState";

export function useKioskIdle({
  kioskMode,
  screen,
  started,
  setCart,
  setScreen,
}: {
  kioskMode: boolean;
  screen: Screen;
  started: boolean;
  setCart: Dispatch<SetStateAction<CartItem[]>>;
  setScreen: (screen: Screen) => void;
}) {
  const [showIdlePrompt, setShowIdlePrompt] = useState(false);
  const [showIdleScreen, setShowIdleScreen] = useState(false);
  const paymentActiveRef = useRef(false);
  useEffect(() => {
    const update = (event: Event) => {
      paymentActiveRef.current = Boolean((event as CustomEvent).detail);
      lastInteractionRef.current = Date.now();
    };
    window.addEventListener("menfis-payment-active", update);
    return () => window.removeEventListener("menfis-payment-active", update);
  }, []);
  const lastInteractionRef = useRef<number>(Date.now());

  const resetKioskActivity = useCallback(() => {
    lastInteractionRef.current = Date.now();
    setShowIdlePrompt(false);
    setShowIdleScreen(false);
  }, []);

  const openKioskIdleScreen = useCallback(() => {
    setCart([]);
    setScreen("product");
    setShowIdlePrompt(false);
    setShowIdleScreen(true);
    lastInteractionRef.current = Date.now();
  }, [setCart, setScreen]);

  useEffect(() => {
    if (!started || !kioskMode) return;

    let lastMouseMoveAt = 0;
    const mark = (event?: Event) => {
      if (showIdleScreen) return;
      if (event?.type === "mousemove") {
        const now = Date.now();
        if (now - lastMouseMoveAt < 1200) return;
        lastMouseMoveAt = now;
      }
      resetKioskActivity();
    };

    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("pointerdown", mark, opts);
    window.addEventListener("touchstart", mark, opts);
    window.addEventListener("keydown", mark);
    window.addEventListener("mousemove", mark, opts);
    window.addEventListener("wheel", mark, opts);

    return () => {
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("touchstart", mark);
      window.removeEventListener("keydown", mark);
      window.removeEventListener("mousemove", mark);
      window.removeEventListener("wheel", mark);
    };
  }, [kioskMode, resetKioskActivity, showIdleScreen, started]);

  useEffect(() => {
    if (!started || !kioskMode) return;
    if (screen === "admin") return;

    const timer = window.setInterval(() => {
      const idleFor = Date.now() - lastInteractionRef.current;
      if (paymentActiveRef.current || showIdleScreen || idleFor < KIOSK_IDLE_SCREEN_MS) return;
      openKioskIdleScreen();
    }, 1000);

    return () => window.clearInterval(timer);
  }, [kioskMode, screen, openKioskIdleScreen, showIdleScreen, started]);

  return {
    showIdlePrompt,
    showIdleScreen,
    resetKioskActivity,
    openKioskIdleScreen,
  };
}
