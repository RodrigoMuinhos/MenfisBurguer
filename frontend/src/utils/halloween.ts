export const HALLOWEEN_EMAIL = "halloween@gmail.com";
export const RASPBERRY_LEMONADE_ID = "raspberry-lemonade";
export function isHalloweenAccount(profile: { email?: string } | null | undefined) {
  return profile?.email?.trim().toLowerCase() === HALLOWEEN_EMAIL;
}

export const CUSTOMER_SESSION_CHANGED_EVENT = "menfis:customer-session-changed";
export function notifyCustomerSessionChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CUSTOMER_SESSION_CHANGED_EVENT));
}
