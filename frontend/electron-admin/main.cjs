const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const PORT = 3211;
const ADMIN_URL = `http://127.0.0.1:${PORT}/adm/`;
let mainWindow;
let server;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function startServer() {
  const root = app.isPackaged
    ? path.join(process.resourcesPath, "admin-app")
    : path.join(__dirname, "admin-app");

  return new Promise((resolve, reject) => {
    server = http.createServer((request, response) => {
      const url = new URL(request.url || "/", ADMIN_URL);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === "/_next/image") {
        pathname = decodeURIComponent(url.searchParams.get("url") || "/logo_M_square.png");
      }
      if (pathname === "/") pathname = "/index.html";
      if (pathname.endsWith("/")) pathname += "index.html";
      const filePath = path.resolve(root, `.${pathname}`);
      if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        response.writeHead(404).end("Not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      fs.createReadStream(filePath).pipe(response);
    });
    server.once("error", reject);
    server.listen(PORT, "127.0.0.1", resolve);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    title: "Menfi's Burger - ADM",
    autoHideMenuBar: true,
    backgroundColor: "#FFE9EC",
    width: 1440,
    height: 900,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  mainWindow.maximize();
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(new URL(ADMIN_URL).origin)) event.preventDefault();
  });
  await mainWindow.loadURL(ADMIN_URL);
}

app.whenReady().then(startServer).then(createWindow).catch((error) => {
  fs.writeFileSync(path.join(os.tmpdir(), "menfis-admin-error.log"), error?.stack || String(error));
});
app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => server?.close());
