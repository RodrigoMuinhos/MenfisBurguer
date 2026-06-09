import { MemberProfile, MEMBER_KEY, MEMBER_TOKEN_KEY } from "@/components/product/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

type CustomerPayload = {
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  birthYear?: number;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  reference?: string;
};

export async function saveCustomerSession(payload: CustomerPayload) {
  if (!API_URL) throw new Error("api_missing");
  const res = await fetch(`${API_URL}/customers/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.customer || !data.token) throw new Error(data.error || "customer_save_failed");
  const profile = normalizeCustomer(data.customer);
  localStorage.setItem(MEMBER_TOKEN_KEY, data.token);
  localStorage.setItem(MEMBER_KEY, JSON.stringify(profile));
  return profile;
}

export async function loadCustomerSession() {
  const token = localStorage.getItem(MEMBER_TOKEN_KEY);
  if (!API_URL || !token) return null;
  const res = await fetch(`${API_URL}/customers/me`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const profile = normalizeCustomer(await res.json());
  localStorage.setItem(MEMBER_KEY, JSON.stringify(profile));
  return profile;
}

export function logoutCustomerSession() {
  localStorage.removeItem(MEMBER_TOKEN_KEY);
  localStorage.removeItem(MEMBER_KEY);
}

function normalizeCustomer(raw: any): MemberProfile {
  const orders = Number(raw.orderCount ?? raw.orders ?? 0);
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    phone: String(raw.phone ?? ""),
    email: raw.email ?? undefined,
    birthday: raw.birthday ?? undefined,
    birthYear: raw.birthYear ?? undefined,
    avatarUrl: raw.avatarUrl ?? undefined,
    defaultAddress: raw.defaultAddress ?? undefined,
    freeShipping: orders === 0,
    orders,
    rewards: Math.floor(orders / 10),
    createdAt: Date.now(),
  };
}
