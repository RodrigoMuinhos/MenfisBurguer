const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");

const HOST = "127.0.0.1";
const PORT = 17777;
const PRINTER = "POS-58";
const MAX_BODY_BYTES = 200_000;
const ALLOWED_ORIGINS = new Set([
  "https://menfisburguer.com.br",
  "https://www.menfisburguer.com.br",
  "http://localhost:3000",
  "http://localhost:3100",
]);

function json(response, status, body, origin) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...(origin ? {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Private-Network": "true",
      Vary: "Origin",
    } : {}),
  });
  response.end(JSON.stringify(body));
}

function allowedOrigin(request) {
  const origin = String(request.headers.origin || "");
  return ALLOWED_ORIGINS.has(origin) ? origin : "";
}

function printRaw(content) {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, "print-raw.ps1");
    const child = spawn("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy", "Bypass",
      "-File", script,
      "-PrinterName", PRINTER,
    ], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    let error = "";
    child.stdout.on("data", (chunk) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk) => { error += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(output.trim());
      else reject(new Error(error.trim() || `Spooler retornou ${code}`));
    });
    child.stdin.end(`${content}\r\n\r\n\r\n`);
  });
}

const server = http.createServer((request, response) => {
  const origin = allowedOrigin(request);
  const url = new URL(request.url || "/", `http://${HOST}:${PORT}`);

  if (request.method === "GET" && url.pathname === "/health") {
    json(response, 200, { ok: true, printer: PRINTER }, origin);
    return;
  }

  if (!origin) {
    json(response, 403, { ok: false, error: "origin_not_allowed" });
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Private-Network": "true",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    });
    response.end();
    return;
  }

  if (request.method !== "POST" || url.pathname !== "/print") {
    json(response, 404, { ok: false, error: "not_found" }, origin);
    return;
  }

  let body = "";
  request.setEncoding("utf8");
  request.on("data", (chunk) => {
    body += chunk;
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) request.destroy();
  });
  request.on("end", async () => {
    try {
      const payload = JSON.parse(body || "{}");
      const content = typeof payload.content === "string" ? payload.content : "";
      if (!content || content.length > 100_000) {
        json(response, 400, { ok: false, error: "invalid_content" }, origin);
        return;
      }
      const longestLine = content.replace(/\r/g, "").split("\n")
        .reduce((longest, line) => Math.max(longest, line.length), 0);
      if (longestLine > 32) {
        json(response, 400, { ok: false, error: "receipt_too_wide", longestLine }, origin);
        return;
      }
      const result = await printRaw(content);
      json(response, 200, { ok: true, transport: "RAW", printer: PRINTER, result }, origin);
    } catch (error) {
      json(response, 503, { ok: false, error: error.message || "print_failed" }, origin);
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Menfis Print Bridge listening at http://${HOST}:${PORT}`);
});

