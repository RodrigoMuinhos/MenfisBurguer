const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function setup() {
  const exports = {};
  const calls = [];
  const source = fs.readFileSync(path.join(__dirname, '../src/components/order/cartFinalize.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(js, {
    exports,
    require: (name) => name.includes('/normalize')
      ? { normalizeBackendOrder: (order) => ({ ...order, items: [] }) }
      : name === './checkout'
        ? { API_URL: '/backend', resolveRuntimeDeliveryType: value => value }
        : {},
    window: { setTimeout: () => 1, clearTimeout: () => {} },
    localStorage: { getItem: () => null },
    fetch: async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return { ok: true, json: async () => ({ id: '#123', total: 27.9, status: 'PAYMENT_PENDING', paymentStatus: 'pending', trackingToken: 'order-token' }) };
    },
  });
  const placed = [];
  const success = [];
  const errors = [];
  const args = {
    cart: [{ id: 'burger', qty: 1, price: 27.9 }], kioskMode: true, counterServiceMode: false,
    delivery: 'retirada', payment: 'pix', customerName: 'Cliente', phone: '', address: '',
    appliedCoupon: null, discount: 0, total: 27.9, removedByItemId: {},
    onPlaceOrder: (...values) => placed.push(values.at(-1)),
    setPaying: () => {}, setPaymentSlow: () => {}, setKioskSuccessOpen: () => {},
    setPaymentError: message => errors.push(message),
    waitForKioskSuccessConfirm: async order => success.push(order),
  };
  return { submit: exports.submitCheckoutOrder, calls, placed, success, errors, args };
}

test('kiosk Pix waits for server confirmation and passes the order access token', async () => {
  const ctx = setup();
  await ctx.submit({ ...ctx.args, waitForPixPayment: async (order, headers) => {
    assert.equal(order.total, 27.9);
    assert.equal(headers['X-Order-Token'], 'order-token');
    assert.equal(ctx.success.length, 0);
    assert.equal(ctx.placed.length, 0);
    return { ...order, status: 'PAID', paymentStatus: 'approved' };
  } });
  assert.equal(ctx.calls[0].body.paymentMethod, 'PIX');
  assert.equal(ctx.placed[0].paymentProvider, 'mercado_pago');
  assert.equal(ctx.placed[0].paymentStatus, 'approved');
});

test('closing unpaid Pix never prints a success receipt or marks the order paid', async () => {
  const ctx = setup();
  await ctx.submit({ ...ctx.args, waitForPixPayment: async () => null });
  assert.equal(ctx.success.length, 0);
  assert.equal(ctx.placed.length, 0);
  assert.match(ctx.errors[0], /não confirmado/);
});

test('counter Pix obtains the customer name before requesting a charge', async () => {
  const ctx = setup();
  await ctx.submit({ ...ctx.args, kioskMode: false, counterServiceMode: true,
    confirmCounterPayment: async () => 'pix', confirmCounterCustomerName: async () => 'Maria',
    waitForPixPayment: async order => ({ ...order, status: 'PAID', paymentStatus: 'approved' }),
  });
  assert.equal(ctx.calls[0].body.customerName, 'Maria');
  assert.equal(ctx.calls[0].body.paymentMethod, 'PIX');
  assert.equal(ctx.placed[0].paymentStatus, 'approved');
});

test('attendant choice does not request a Mercado Pago Pix charge', async () => {
  const ctx = setup();
  await ctx.submit({ ...ctx.args, kioskMode: false, counterServiceMode: true,
    confirmCounterPayment: async () => 'atendente', confirmCounterCustomerName: async () => 'Maria',
    waitForPixPayment: async () => { throw new Error('Unexpected Pix charge'); },
  });
  assert.equal(ctx.calls[0].body.paymentMethod, 'PRESENCIAL');
  assert.equal(ctx.placed.length, 1);
});
