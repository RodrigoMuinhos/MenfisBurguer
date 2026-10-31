const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', source)((id) => {
    if (id === '@/components/order/checkout') return { DEFAULT_SPECIAL_OFFER_SETTINGS: { productId: 'triple-combo' } };
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}.ts`);
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), `${id}.ts`)));
    return require(id);
  }, module, module.exports);
  return module.exports;
}
const menu = load('src/features/catalog/menu.ts');
const catalog = load('src/components/product/screen/productCatalog.ts');
const { useProductCustomizerModel } = load('src/components/product/customizer/useProductCustomizerModel.ts');

test('regular and kiosk menus preserve prices and inactive products', () => {
  const rows = [{ id: 'burger', active: true, salePrice: 31.9 }, { id: menu.MONSTER_ID, active: true, salePrice: 33.9 }, { id: 'double-burger', active: false, salePrice: 35.9 }];
  assert.deepEqual(catalog.applyPricingToMenu(rows).map(item => [item.id, item.price]), [['burger', 31.9]]);
  assert.deepEqual(catalog.applyPricingToMenu(rows, true).map(item => [item.id, item.price]), [[menu.MONSTER_ID, 33.9]]);
});
test('Monster requires neither meat point nor sauce and offers event sides at their individual prices', () => {
  const state = { item: menu.KIOSK_MENU_ITEMS[0], meatPoints: [], sauces: [], drinks: [], extras: {}, qty: 1, note: '' };
  const model = useProductCustomizerModel(state, () => {});
  assert.equal(model.valid, true);
  assert.equal(model.needsMeatPoint, false);
  assert.equal(model.needsSauce, false);
  assert.deepEqual(model.extraOptions.map(item => [item.id, item.price]), [[menu.MONSTER_ADDON_ID, 20.9], ["monster-coca-zero", 8.9], ["monster-batata-150g", 16.9]]);
  for (const extra of model.extraOptions) {
    const total = useProductCustomizerModel({ ...state, extras: { [extra.id]: 1 } }, () => {}).total;
    assert.ok(Math.abs(total - (33.9 + extra.price)) < 0.001);
    assert.equal(catalog.CUSTOMIZER_ADDON_IDS.has(extra.id), true);
  }
  assert.equal(model.total, 33.9);
  assert.ok(Math.abs(useProductCustomizerModel({ ...state, extras: { [menu.MONSTER_ADDON_ID]: 1 } }, () => {}).total - 54.8) < 0.001);
  assert.equal(useProductCustomizerModel({ ...state, item: menu.MENU_ITEMS[0] }, () => {}).valid, false);
});
test('event account can sign in without an invented phone; regular profiles keep their requirements', () => {
  assert.equal(catalog.hasRequiredCustomerProfile({ name: 'Halloween', email: 'halloween@gmail.com', phone: '' }), true);
  assert.equal(catalog.hasRequiredCustomerProfile({ name: 'Cliente', email: 'cliente@example.com', phone: '' }), false);
  assert.equal(catalog.hasRequiredCustomerProfile(null), false);
});
