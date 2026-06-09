const fs = require("node:fs");
const path = require("node:path");

const mode = process.argv[2];
const allowedModes = new Set(["apps", "admin", "kiosk", "desktop"]);

if (!allowedModes.has(mode)) {
  throw new Error("Use apps, admin, kiosk ou desktop para escolher os instaladores a limpar.");
}

const dist = path.resolve(__dirname, "..", "dist-electron");

if (!fs.existsSync(dist)) {
  process.exit(0);
}

const shouldRemove = (fileName) => {
  if (mode === "apps") {
    return /^Menfis-Burger-(Setup|Totem|ADM)-.+\.exe$/i.test(fileName);
  }

  if (mode === "desktop") {
    return /^Menfis-Burger-Setup-.+\.exe$/i.test(fileName);
  }

  const appName = mode === "admin" ? "ADM" : "Totem";
  return new RegExp(`^Menfis-Burger-${appName}-.+\\.exe$`, "i").test(fileName);
};

for (const fileName of fs.readdirSync(dist)) {
  if (shouldRemove(fileName)) {
    fs.rmSync(path.join(dist, fileName), { force: true });
  }
}
