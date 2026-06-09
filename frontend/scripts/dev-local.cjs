const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const mode = process.argv[2] === "admin" ? "admin" : "kiosk";
const port = process.env.PORT || "3000";
const url =
  mode === "kiosk"
    ? `http://127.0.0.1:${port}/kiosk`
    : `http://127.0.0.1:${port}/adm`;

const next = spawn(
  process.execPath,
  [path.join(root, "node_modules", "next", "dist", "bin", "next"), "dev", "--hostname", "127.0.0.1", "--port", port],
  {
    cwd: root,
    env: { ...process.env, NODE_ENV: "development" },
    stdio: "inherit",
  },
);

async function openWhenReady() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        spawn("powershell.exe", ["-NoProfile", "-Command", `Start-Process '${url}'`], {
          detached: true,
          stdio: "ignore",
          windowsHide: true,
        }).unref();
        console.log(`\nFrontend ${mode} aberto em ${url}`);
        return;
      }
    } catch {
      // Aguarda o Next ficar pronto.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  console.error(`Não foi possível abrir ${url}`);
}

openWhenReady();

function stop() {
  if (!next.killed) next.kill();
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
next.on("exit", (code) => process.exit(code ?? 0));
