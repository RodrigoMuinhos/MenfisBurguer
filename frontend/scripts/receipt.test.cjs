const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const ESC = '\x1b';
const GS = '\x1d';
const INVERT_ON = `${GS}B\x01`;

function loadShared() {
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '../src/components/admin/shared.tsx'), 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
  }).outputText;
  const stub = new Proxy({}, { get: (_target, key) => (key === '__esModule' ? true : () => null) });
  vm.runInNewContext(js, {
    exports,
    require: (name) => {
      if (name.includes('/tracking')) return { deliveryConfirmationCode: () => 'COD9', scheduledOrderInfo: () => null };
      if (name.includes('/address')) return { formatAddressForReceipt: (value) => value };
      return stub;
    },
    process: { env: {} },
    console,
  });
  return exports;
}

function order(overrides = {}) {
  return {
    id: '#1432',
    channel: 'KIOSK',
    deliveryType: 'retirada',
    customerName: 'TTT',
    customerAddress: 'Retirada no balcao',
    timestamp: Date.UTC(2026, 8, 26, 17, 6),
    items: [{ id: 'agua', name: 'Agua com gas', qty: 1, price: 4.9 }],
    total: 4.9,
    status: 'PAID',
    paymentMethod: 'presencial',
    paymentStatus: 'awaiting_counter',
    ...overrides,
  };
}

test('order number prints large and inverted before the customer block', () => {
  const { generateCustomerReceipt } = loadShared();
  const receipt = generateCustomerReceipt(order());
  const lines = receipt.split('\n');
  const numberLine = lines.findIndex((value) => value.includes(' 1432 '));
  assert.ok(numberLine >= 0, 'order number line missing');
  assert.ok(lines[numberLine].includes(INVERT_ON), 'order number is not inverted');
  assert.ok(lines[numberLine].includes(`${GS}!\x22`), 'order number is not enlarged');
  assert.ok(numberLine < lines.indexOf('CLIENTE'), 'order number must come before CLIENTE');
});

test('pay-at-counter order prints NAO PAGO inverted', () => {
  const { generateCustomerReceipt, paymentMethodLabel } = loadShared();
  const receipt = generateCustomerReceipt(order());
  const unpaidLine = receipt.split('\n').find((value) => value.includes('NAO PAGO'));
  assert.ok(unpaidLine && unpaidLine.includes(INVERT_ON));
  assert.ok(!receipt.includes('Status: Pago'));
  assert.equal(paymentMethodLabel(order()), 'Pague no Caixa');
});

test('paid orders keep the normal status line', () => {
  const { generateCustomerReceipt } = loadShared();
  const receipt = generateCustomerReceipt(order({ paymentMethod: 'pix', paymentProvider: 'MERCADO_PAGO', paymentStatus: 'approved' }));
  assert.ok(!receipt.includes('NAO PAGO'));
  assert.ok(receipt.includes('Status: Pago'));
});

test('every line fits the 32-column limit of the print bridge', () => {
  const { generateCustomerReceipt } = loadShared();
  for (const id of ['#1432', '#99999']) {
    const receipt = generateCustomerReceipt(order({ id }));
    for (const value of receipt.split('\n')) assert.ok(value.length <= 32, `line too wide: ${JSON.stringify(value)}`);
  }
});

test('browser fallback text has no printer control codes', () => {
  const { generateCustomerReceipt } = loadShared();
  const receipt = generateCustomerReceipt(order(), { escpos: false });
  assert.ok(!receipt.includes(ESC) && !receipt.includes(GS));
  assert.ok(receipt.includes('*** NAO PAGO ***'));
});

test('admin shows unpaid counter orders as Nao pago until confirmed at the till', () => {
  const { paymentStatusLabel, paymentBadge } = loadShared();
  assert.equal(paymentStatusLabel(order()), 'Não pago');
  assert.equal(paymentBadge(order()).bg, '#000000');
  assert.equal(paymentStatusLabel(order({ status: 'IN_PREPARATION' })), 'Não pago');
  assert.equal(paymentStatusLabel(order({ paymentStatus: 'approved' })), 'Pago');
  assert.equal(paymentStatusLabel(order({ status: 'CANCELLED' })), 'Cancelado');
});

test('pay-at-counter receipt always prints NAO PAGO, even after the till confirms', () => {
  const { generateCustomerReceipt } = loadShared();
  for (const paymentStatus of ['approved', 'awaiting_counter', undefined]) {
    const receipt = generateCustomerReceipt(order({ paymentStatus }));
    const unpaidLine = receipt.split(/\r?\n/).find((value) => value.includes('NAO PAGO'));
    assert.ok(unpaidLine && unpaidLine.includes(INVERT_ON), `missing inverted NAO PAGO for ${paymentStatus}`);
    assert.ok(!receipt.includes('Status: Pago'));
  }
});
