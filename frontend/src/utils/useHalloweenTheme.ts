import { useSyncExternalStore } from "react";
import { MEMBER_KEY, MEMBER_TOKEN_KEY } from "@/components/product/shared";
import { CUSTOMER_SESSION_CHANGED_EVENT, isHalloweenAccount } from "./halloween";

function subscribe(onChange: () => void) {
  window.addEventListener(CUSTOMER_SESSION_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CUSTOMER_SESSION_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
function snapshot() {
  try {
    return Boolean(localStorage.getItem(MEMBER_TOKEN_KEY)) && isHalloweenAccount(JSON.parse(localStorage.getItem(MEMBER_KEY) ?? "null"));
  } catch { return false; }
}
export function useHalloweenTheme() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
