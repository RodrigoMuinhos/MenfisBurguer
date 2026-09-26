import { useCallback, useEffect, useRef, useState } from "react";
import { KIOSK_IDLE_TIMEOUT_MS, Screen } from "../appState";

const ACTIVITY_EVENTS = [
  "pointerdown",
  "pointermove",
  "mousemove",
  "touchstart",
  "click",
  "keydown",
  "wheel",
  "scroll",
] as const;

export function useKioskIdle({
  kioskMode,
  screen,
  started,
  blocked,
  onIdle,
}: {
  kioskMode: boolean;
  screen: Screen;
  started: boolean;
  /** True while an order is being sent or a payment is being confirmed. */
  blocked: boolean;
  /** Called after the inactivity timeout; expected to end the session and show the idle screen. */
  onIdle: () => void;
}) {
  // The idle screen is the kiosk's home: every session starts there. The kiosk
  // mode comes from the URL on the server too, so this renders without a flash.
  const [showIdleScreen, setShowIdleScreen] = useState(started && kioskMode);
  const [paymentActive, setPaymentActive] = useState(false);
  const lastInteractionRef = useRef<number>(Date.now());
  const onIdleRef = useRef(onIdle);
  const enabled =
    started &&
    kioskMode &&
    screen !== "admin" &&
    !blocked &&
    !paymentActive &&
    !showIdleScreen;

  useEffect(() => {
    onIdleRef.current = onIdle;
  });

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

  const showIdle = useCallback(() => {
    setShowIdleScreen(true);
  }, []);

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
        onIdleRef.current();
        return;
      }
      timer = window.setTimeout(schedule, remaining);
    };
    const mark = () => {
      lastInteractionRef.current = Date.now();
    };

    // Capture phase so components that stopPropagation (and non-bubbling
    // scroll events) still count as activity.
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
    showIdle,
    resetKioskActivity,
  };
}
