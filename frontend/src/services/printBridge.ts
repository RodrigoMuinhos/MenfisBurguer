const PRINT_BRIDGE_HEALTH_URL = "http://127.0.0.1:17777/health";
const PRINT_BRIDGE_LAUNCH_URL = "menfis-print-bridge://start";

export async function printBridgeIsRunning() {
  try {
    const response = await fetch(`${PRINT_BRIDGE_HEALTH_URL}?_=${Date.now()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return false;
    const health = await response.json();
    return health?.ok === true;
  } catch {
    return false;
  }
}

let startingBridge: Promise<boolean> | undefined;

export function startPrintBridge(): Promise<boolean> {
  if (!startingBridge) {
    startingBridge = ensurePrintBridgeRunning().catch(() => false).finally(() => {
      startingBridge = undefined;
    });
  }
  return startingBridge;
}

async function ensurePrintBridgeRunning() {
  if (await printBridgeIsRunning()) return true;

  const launcher = document.createElement("iframe");
  launcher.hidden = true;
  launcher.setAttribute("aria-hidden", "true");
  launcher.src = String(
    process.env.NEXT_PUBLIC_PRINT_BRIDGE_LAUNCH_URL ||
    localStorage.getItem("menfis_print_bridge_launch_url") ||
    PRINT_BRIDGE_LAUNCH_URL,
  ).trim();
  document.body.appendChild(launcher);

  try {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      if (await printBridgeIsRunning()) return true;
    }
    return false;
  } finally {
    launcher.remove();
  }
}
