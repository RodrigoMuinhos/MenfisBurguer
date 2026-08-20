export type DiningTable = {
  id: string; name: string; code: string; area: string; active: boolean;
  positionX?: number | null; positionY?: number | null;
};

export type TableKit = {
  id: string; name: string; code: string; qrToken: string;
  status: "AVAILABLE" | "IN_USE" | "OFFLINE" | "DISABLED";
  lightState: "NORMAL" | "BLUE" | "GREEN" | "RED" | "OFF";
  active: boolean; deviceId?: string | null;
};

export type DiningSession = {
  id: string; publicId: string; status: "OPEN" | "CLOSED" | "CANCELLED";
  openedAt: string; closedAt?: string | null; customerName?: string | null;
  table: DiningTable; kit: TableKit;
};

export type DiningOrder = {
  publicOrderId: string; number: number; status: string; tableName: string;
  customerName?: string | null; items: Array<Record<string, unknown>>; total: number;
  paymentRequestedAt: string; paymentMethod?: string | null; lightState: string;
};

export type DiningDashboard = {
  tables: DiningTable[]; availableKits: TableKit[]; openSessions: DiningSession[];
};

export const diningHeaders = (token: string, json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  ...(token && token !== "cookie" ? { Authorization: `Bearer ${token}` } : {}),
});

export async function diningRequest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/backend${path}`, {
    cache: "no-store",
    credentials: "include",
    ...init,
    headers: { ...diningHeaders(token, Boolean(init?.body)), ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Erro ${response.status}`);
  }
  return response.json() as Promise<T>;
}
