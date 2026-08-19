import { API_URL } from "@/app/appState";
import { MEMBER_TOKEN_KEY } from "@/components/product/shared";

export const KIOSK_AUTO_ACCEPT_KEY = "menfis_kiosk_auto_accept";

export function kioskAutoAcceptanceEnabled() {
  return typeof window !== "undefined" && localStorage.getItem(KIOSK_AUTO_ACCEPT_KEY) === "1";
}

export function setKioskAutoAcceptance(enabled: boolean) {
  localStorage.setItem(KIOSK_AUTO_ACCEPT_KEY, enabled ? "1" : "0");
  window.dispatchEvent(new CustomEvent("menfis:kiosk-auto-accept", { detail: enabled }));
}

export async function acceptKioskOrder(orderId: string) {
  const token = localStorage.getItem(MEMBER_TOKEN_KEY);
  if (!token) return false;
  try {
    const response = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}/kiosk-accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}
