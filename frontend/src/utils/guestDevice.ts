const GUEST_DEVICE_COOKIE = "menfis_guest_device";
const GUEST_ORDER_IDENTITY_KEY = "menfis_guest_order_identity";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

type GuestOrderIdentity = {
  deviceId: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  cep: string;
  updatedAt: number;
};

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const prefix = `${encodeURIComponent(name)}=`;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length) ?? "";
}

function newDeviceId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function ensureGuestDeviceId() {
  const current = decodeURIComponent(readCookie(GUEST_DEVICE_COOKIE));
  if (current) return current;
  const deviceId = newDeviceId();
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${GUEST_DEVICE_COOKIE}=${encodeURIComponent(deviceId)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  return deviceId;
}

export function saveGuestOrderIdentity(input: Omit<GuestOrderIdentity, "deviceId" | "updatedAt">) {
  if (typeof window === "undefined") return;
  const identity: GuestOrderIdentity = {
    ...input,
    deviceId: ensureGuestDeviceId(),
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.replace(/\D/g, ""),
    cep: input.cep.replace(/\D/g, ""),
    updatedAt: Date.now(),
  };
  localStorage.setItem(GUEST_ORDER_IDENTITY_KEY, JSON.stringify(identity));
}

export function clearGuestOrderIdentity() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_ORDER_IDENTITY_KEY);
}
