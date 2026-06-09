const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const targets = [
  path.join(root, "electron", "kiosk-app"),
  path.join(root, "electron-admin", "admin-app"),
];

targets.forEach((target) => {
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(path.join(target, "_next"), { recursive: true });
  for (const route of ["delivery", "kiosk", "adm", "kds"]) {
    const routeDir = path.join(target, route);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.copyFileSync(
      path.join(root, ".next", "server", "app", `${route}.html`),
      path.join(routeDir, "index.html"),
    );
  }
  fs.cpSync(path.join(root, ".next", "static"), path.join(target, "_next", "static"), {
    recursive: true,
  });
  fs.cpSync(path.join(root, "public"), target, { recursive: true });
});
