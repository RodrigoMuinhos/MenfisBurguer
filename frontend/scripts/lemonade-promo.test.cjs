const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadCheckout() {
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '../src/components/order/checkout.ts'), 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(js, { exports, require: () => ({}), process: { env: {} }, console });
  return exports;
}

const { buildCheckoutPricing, cartItemsTotal, lemonadePairDiscount } = loadCheckout();

const lemonade = (qty, overrides = {}) => ({
  id: `pink-lemonade-${qty}`,
  productId: 'pink-lemonade',
  name: 'PINK LEMONADE',
  price: 24.9,
  basePrice: 24.9,
  qty,
  ...overrides,
});

test('lemonade pairs cost 37.90 and an unpaired one keeps full price', () => {
  const expected = { 1: 24.9, 2: 37.9, 3: 62.8, 4: 75.8, 5: 100.7, 6: 113.7, 8: 151.6 };
  for (const [qty, total] of Object.entries(expected)) {
    assert.equal(cartItemsTotal([lemonade(Number(qty))]), total, `${qty} lemonades`);
  }
});

test('pairs mix flavors across cart lines', () => {
  const cart = [
    lemonade(1),
    { ...lemonade(1), id: 'sunset-lemonade-1', productId: 'sunset-lemonade' },
    { ...lemonade(1), id: 'purple-lemonade-1', productId: 'purple-lemonade' },
  ];
  assert.equal(cartItemsTotal(cart), 62.8);
});

test('add-ons are charged in full and other products are untouched', () => {
  const withVodka = lemonade(2, { price: 27.9, addonIds: ['adicional-vodka'] });
  const burger = { id: 'burger', productId: 'burger', name: 'BURGER', price: 34.9, qty: 1 };
  assert.equal(lemonadePairDiscount([withVodka, burger]), 11.9);
  assert.equal(cartItemsTotal([withVodka, burger]), 78.8);
});

test('checkout pricing applies the promotion before the coupon', () => {
  const pricing = buildCheckoutPricing({
    items: [lemonade(2)],
    delivery: 'retirada',
    coupon: { code: 'DEZ', type: 'percent', value: 10 },
  });
  assert.equal(pricing.promoDiscount, 11.9);
  assert.equal(pricing.couponDiscount, 3.79);
  assert.equal(pricing.discount, 15.69);
  assert.equal(pricing.total, 34.11);
});
