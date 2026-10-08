const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = resolve(__dirname, "..");
const cart = readFileSync(resolve(root, "src/components/order/CartScreen.tsx"), "utf8");
const checkout = readFileSync(resolve(root, "src/components/order/useCartCheckout.ts"), "utf8");
const delivery = readFileSync(resolve(root, "src/components/order/DeliveryFormSection.tsx"), "utf8");
const tracking = readFileSync(resolve(root, "src/components/order/TrackingScreen.tsx"), "utf8");
const finalize = readFileSync(resolve(root, "src/components/order/cartFinalize.ts"), "utf8");
const guestDevice = readFileSync(resolve(root, "src/utils/guestDevice.ts"), "utf8");
const trackingTimeline = readFileSync(resolve(root, "src/components/order/tracking/TrackingTimelineSection.tsx"), "utf8");

test("checkout não bloqueia visitante com tela de perfil", () => {
  assert.doesNotMatch(cart, /CheckoutProfileGate/);
  assert.doesNotMatch(checkout, /hasCustomerSession/);
  assert.doesNotMatch(checkout, /Entre ou crie seu perfil Menfi's para finalizar/);
  assert.doesNotMatch(finalize, /customer_session_required/);
});

test("pedido visitante exige nome, WhatsApp e endereço", () => {
  assert.match(checkout, /customerName\.trim\(\)\.length >= 2/);
  assert.match(checkout, /phone\.replace\(\/\\D\/g, ""\)\.length >= 10/);
  assert.match(checkout, /cep\.replace\(\/\\D\/g, ""\)\.length === 8/);
  assert.match(checkout, /number\.trim\(\)\.length > 0/);
  assert.match(delivery, /<SectionLabel>WhatsApp<\/SectionLabel>/);
});

test("convite de perfil aparece somente depois do pedido", () => {
  assert.match(tracking, /FINISH PAY\/HEROPROMO\.png/);
  assert.match(tracking, /onClick=\{onCreateProfile\}/);
  assert.match(tracking, /aria-label="Criar meu perfil e ganhar 10% de desconto na próxima compra"/);
});

test("pagamento por WhatsApp mantém o acompanhamento aberto", () => {
  assert.match(finalize, /await onPlaceOrder[\s\S]*sendWhatsappReceipt\(whatsappOrder\)/);
  assert.match(finalize, /window\.open\(url, "_blank", "noopener,noreferrer"\)/);
  assert.doesNotMatch(finalize, /window\.location\.assign\(url\)/);
});

test("pedido visitante em andamento permanece acessível pelo menu Pedidos", () => {
  const app = readFileSync(resolve(root, "src/app/App.tsx"), "utf8");
  assert.match(app, /setLastOrderId\(pendingOrderId\)/);
  assert.match(app, /loadOrderById\(pendingOrderId\)/);
  assert.match(app, /const finished = selectedOrder/);
  assert.match(app, /guestOrderMatchesScope/);
});

test("dispositivo visitante recebe cookie opaco e cache do pedido", () => {
  assert.match(guestDevice, /menfis_guest_device/);
  assert.match(guestDevice, /SameSite=Lax/);
  assert.match(guestDevice, /Secure/);
  assert.match(guestDevice, /crypto\.randomUUID/);
  assert.match(guestDevice, /menfis_guest_order_identity/);
  assert.doesNotMatch(guestDevice, /trackingToken/);
});

test("hero de contato abre o WhatsApp do pedido pendente", () => {
  assert.match(trackingTimeline, /FINISH PAY\/HEROCONTACT\.png/);
  assert.match(trackingTimeline, /waitingPayment && whatsappPayment/);
  assert.match(trackingTimeline, /WHATSAPP_URL/);
  assert.match(trackingTimeline, /Falar com atendente no WhatsApp sobre o pedido/);
});
