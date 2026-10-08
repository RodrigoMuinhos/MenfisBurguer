const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = resolve(__dirname, "..");
const modal = readFileSync(resolve(root, "src/components/product/member/MemberAuthModal.tsx"), "utf8");
const validation = readFileSync(resolve(root, "src/utils/memberPin.ts"), "utf8");
const service = readFileSync(resolve(root, "src/services/customerSession.ts"), "utf8");

test("cadastro apresenta o campo como PIN numérico", () => {
  assert.match(modal, /label="PIN numérico"/);
  assert.match(modal, /label="Confirmar PIN numérico"/);
  assert.match(modal, /Não use letras ou símbolos/);
});

test("campos de PIN solicitam teclado exclusivamente numérico", () => {
  assert.match(modal, /inputMode="numeric"/);
  assert.match(modal, /pattern="\[0-9\]\*"/);
  assert.match(modal, /maxLength=\{6\}/);
});

test("regra compartilhada remove caracteres não numéricos e exige seis números", () => {
  assert.match(validation, /replace\(\/\\D\/g, ""\)/);
  assert.match(validation, /\/\^\\d\{6\}\$\//);
});

test("serviço do frontend bloqueia PIN inválido antes do envio", () => {
  assert.match(service, /isValidMemberPin\(payload\.password\)/);
  assert.match(service, /customer_pin_confirmation_invalid/);
  assert.ok(service.indexOf("isValidMemberPin(payload.password)") < service.indexOf("fetch(`${API_URL}/customers/session`"));
});
