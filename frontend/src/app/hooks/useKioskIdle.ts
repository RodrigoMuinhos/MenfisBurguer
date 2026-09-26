import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { CartItem } from "@/types/order";
import { KIOSK_IDLE_TIMEOUT_MS, Screen } from "../appState";

const ACTIVITY_EVENTS = [
  "pointerdown",
  "pointermove",
  "touchstart",
  "click",
  "keydown",
  "wheel",
] as const;

export function useKioskIdle({
  kioskMode,
  screen,
  started,
  blocked,
  setCart,
  setScreen,
}: {
  kioskMode: boolean;
  screen: Screen;
  started: boolean;
  /** True while a payment/Pix/finalization step is on screen. */
  blocked: boolean;
  setCart: Dispatch<SetStateAction<CartItem[]>>;
  setScreen: (screen: Screen) => void;
}) {
  const [showIdleScreen, setShowIdleScreen] = useState(false);
  const [paymentActive, setPaymentActive] = useState(false);
  const lastInteractionRef = useRef<number>(Date.now());
  const enabled =
    started &&
    kioskMode &&
    screen !== "admin" &&
    !blocked &&
    !paymentActive &&
    !showIdleScreen;

  // MercadoPagoPixModal announces itself through this window event.
  useEffect(() => {
    const update = (event: Event) => {
      setPaymentActive(Boolean((event as CustomEvent).detail));
    };
    window.addEventListener("menfis-payment-active", update);
    return () => window.removeEventListener("menfis-payment-active", update);
  }, []);

  const resetKioskActivity = useCallback(() => {
    lastInteractionRef.current = Date.now();
    setShowIdleScreen(false);
  }, []);

  const openIdleScreen = useCallback(() => {
    setScreen("product");
    setShowIdleScreen(true);
  }, [setScreen]);

  const openKioskIdleScreen = useCallback(() => {
    setCart([]);
    setScreen("product");
    setShowIdleScreen(true);
  }, [setCart, setScreen]);

  useEffect(() => {
    if (!enabled) return;

    // Each (re)activation — app start, leaving a blocked flow, closing the
    // idle screen — gets a full timeout window.
    lastInteractionRef.current = Date.now();
    let timer = 0;

    // Activity only stamps a ref; the single timeout re-arms itself for the
    // remaining time instead of being cleared on every pointermove.
    const schedule = () => {
      const remaining =
        KIOSK_IDLE_TIMEOUT_MS - (Date.now() - lastInteractionRef.current);
      if (remaining <= 0) {
        setShowIdleScreen(true);
        return;
      }
      timer = window.setTimeout(schedule, remaining);
    };
    const mark = () => {
      lastInteractionRef.current = Date.now();
    };

    // Capture phase so components that stopPropagation still count as activity.
    const opts: AddEventListenerOptions = { capture: true, passive: true };
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, mark, opts));
    schedule();

    return () => {
      window.clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, mark, { capture: true }),
      );
    };
  }, [enabled]);

  return {
    showIdleScreen,
    resetKioskActivity,
    openIdleScreen,
    openKioskIdleScreen,
  };
}
