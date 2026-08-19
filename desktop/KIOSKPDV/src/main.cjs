const { app, BrowserWindow, dialog, ipcMain, net, powerSaveBlocker, session, shell } = require("electron");
const path = require("node:path");

const BASE_URL = process.env.MENFIS_URL || "https://www.menfisburguer.com.br/";
const APP_URL = new URL("?kiosk=1&performance=1", BASE_URL).toString();
const ALLOWED_ORIGIN = new URL(BASE_URL).origin;
let mainWindow;

// Mantém renderização, timers e rede ativos mesmo quando algum modal ou janela
// de impressão recebe foco. O cache de GPU reduz o custo em computadores lentos.
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");

function selectedPrinter() {
  return app.commandLine.getSwitchValue("menfis-printer") || process.env.MENFIS_PRINTER || "POS-58";
}

function allowed(rawUrl) {
  try { return new URL(rawUrl).origin === ALLOWED_ORIGIN; } catch { return false; }
}

async function printText(content) {
  if (typeof content !== "string" || !content.trim() || content.length > 100000) {
    return { ok: false, error: "Conteúdo de impressão inválido" };
  }
  const receipt = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  const escaped = content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!doctype html><meta charset="utf-8"><style>@page{size:58mm auto;margin:2mm}body{width:54mm;margin:0;font:11px/1.25 Consolas,monospace;white-space:pre-wrap;color:#000}</style><body>${escaped}</body>`;
  try {
    await receipt.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    return await new Promise((resolve) => receipt.webContents.print({
      silent: true,
      printBackground: false,
      deviceName: selectedPrinter(),
      margins: { marginType: "none" },
    }, (success, failureReason) => resolve(success ? { ok: true, printer: selectedPrinter() } : { ok: false, error: failureReason })));
  } finally {
    receipt.destroy();
  }
}

ipcMain.handle("printer:order", (event, content) => {
  if (!allowed(event.senderFrame?.url || "")) return { ok: false, error: "Origem não autorizada" };
  return printText(content);
});
ipcMain.handle("printer:list", async () => mainWindow.webContents.getPrintersAsync());
ipcMain.handle("printer:select", async (_event, name) => ({ ok: typeof name === "string" && name.length > 0, printer: name }));
ipcMain.handle("printer:test", () => printText("MENFI'S KIOSKPDV\nTESTE DE IMPRESSAO\nPOS-58\n\n"));

async function warmRuntime() {
  const kioskSession = session.fromPartition("persist:menfis-kiosk-pdv");
  kioskSession.setSpellCheckerEnabled(false);
  kioskSession.preconnect({ url: ALLOWED_ORIGIN, numSockets: 6 });
  try {
    await net.fetch(APP_URL, { method: "GET", cache: "force-cache", signal: AbortSignal.timeout(8000) });
  } catch {
    // A janela mantém seu tratamento normal de reconexão quando a internet falha.
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: "Menfis KIOSKPDV",
    kiosk: true,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#fff8f2",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: false,
      backgroundThrottling: false,
      partition: "persist:menfis-kiosk-pdv",
      v8CacheOptions: "bypassHeatCheck",
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.webContents.on("dom-ready", () => {
    // Perfil exclusivo do executável: remove efeitos caros sem alterar o site.
    void mainWindow.webContents.insertCSS(`
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-delay: 0ms !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      [class*="backdrop-blur"], [style*="backdrop-filter"] {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
    `);
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (allowed(url)) return { action: "allow" };
    void shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!allowed(url)) { event.preventDefault(); void shell.openExternal(url); }
  });
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === "q") { event.preventDefault(); app.quit(); }
    if (input.control && ["r", "f5"].includes(input.key.toLowerCase())) { event.preventDefault(); mainWindow.webContents.reloadIgnoringCache(); }
  });
  mainWindow.webContents.on("did-fail-load", (_event, code, description, _url, mainFrame) => {
    if (!mainFrame || code === -3) return;
    void dialog.showMessageBox(mainWindow, { type: "warning", title: "KIOSKPDV sem conexão", message: description, buttons: ["Tentar novamente"] }).then(() => mainWindow.loadURL(APP_URL));
  });
  mainWindow.loadURL(APP_URL);
}

app.setName("Menfis KIOSKPDV");
app.setAppUserModelId("com.menfisburguer.kioskpdv");
app.whenReady().then(async () => {
  powerSaveBlocker.start("prevent-display-sleep");
  app.setLoginItemSettings({ openAtLogin: true });
  await warmRuntime();
  createWindow();
});
app.on("window-all-closed", () => app.quit());
