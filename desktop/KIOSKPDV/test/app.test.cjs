const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(path.resolve(__dirname, "../src/main.cjs"), "utf8");
const frontendRoot = path.resolve(__dirname, "../../../frontend/src/components/order");
test("abre o deploy no modo kiosk", () => assert.match(source, /\?kiosk=1/));
test("imprime silenciosamente na POS-58", () => {
  assert.match(source, /silent:\s*true/);
  assert.match(source, /POS-58/);
  assert.match(source, /printer:order/);
});
test("nao inclui runtime PCC 930", () => assert.doesNotMatch(source, /SITEF|PCC|930/));
test("usa perfil persistente e preaquece a conexao", () => {
  assert.match(source, /persist:menfis-kiosk-pdv/);
  assert.match(source, /preconnect/);
  assert.match(source, /force-cache/);
});
test("mantem renderizacao responsiva em segundo plano", () => {
  assert.match(source, /backgroundThrottling:\s*false/);
  assert.match(source, /enable-gpu-rasterization/);
  assert.match(source, /animation-duration:\s*0\.01ms/);
});
test("fluxo kiosk usa PIX de 45 segundos e confirmacao final de 10 segundos", () => {
  const checkout = fs.readFileSync(path.join(frontendRoot, "checkout.ts"), "utf8");
  const overlays = fs.readFileSync(path.join(frontendRoot, "CartOverlays.tsx"), "utf8");
  const payment = fs.readFileSync(path.join(frontendRoot, "PaymentStepSection.tsx"), "utf8");
  assert.match(checkout, /KIOSK_PIX_TIMEOUT_SECONDS = 45/);
  assert.match(payment, /Repetir 45 segundos/);
  assert.match(payment, /Confirmar pagamento/);
  assert.match(overlays, /setTimeout\(resolve, 10000\)/);
  assert.match(overlays, /Pedido confirmado! 🍔/);
});
