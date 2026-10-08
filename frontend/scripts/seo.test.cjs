const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

test("uses the canonical production domain", () => {
  const business = read("src/config/business.ts");
  assert.match(business, /https:\/\/www\.menfisburguer\.com\.br/);
  assert.doesNotMatch(business, /localhost|vercel\.app|railway\.app/);
});

test("sitemap contains only approved public routes", () => {
  const sitemap = read("src/app/sitemap.ts");
  for (const route of [
    'absoluteUrl("/")',
    'absoluteUrl("/menfisbuffet")',
    'absoluteUrl("/politica-de-privacidade")',
    'absoluteUrl("/termos-de-servico")',
    'absoluteUrl("/exclusao-de-dados")',
  ]) {
    assert.ok(sitemap.includes(route), `Missing public route: ${route}`);
  }
  assert.doesNotMatch(
    sitemap,
    /absoluteUrl\("\/(adm|kds|notas|entrega|relatorios|api|backend)/,
  );
});

test("robots points to the sitemap without advertising internal routes", () => {
  const robots = read("src/app/robots.ts");
  assert.ok(robots.includes('absoluteUrl("/sitemap.xml")'));
  for (const route of [
    "/adm",
    "/kds",
    "/notas",
    "/entrega",
    "/relatorios",
    "/api",
    "/backend",
  ]) {
    assert.ok(!robots.includes(`"${route}"`), `Internal route exposed: ${route}`);
  }
});

test("internal pages declare noindex metadata", () => {
  for (const route of ["adm", "kds", "notas", "entrega", "relatorios"]) {
    const layout = read(`src/app/${route}/layout.tsx`);
    assert.ok(layout.includes("internalMetadata"));
  }
  const internalMetadata = read("src/config/internalMetadata.ts");
  assert.match(internalMetadata, /index:\s*false/);
  assert.match(internalMetadata, /follow:\s*false/);
});

test("structured data does not invent sensitive commercial claims", () => {
  const schema = read("src/components/seo/StructuredData.tsx");
  assert.doesNotMatch(
    schema,
    /AggregateRating|Review|openingHours|priceRange|streetAddress/,
  );
  assert.match(schema, /Organization/);
  assert.match(schema, /WebSite/);
});

test("security policy permits only the local Menfis print bridge", () => {
  const config = read("next.config.mjs");
  assert.match(config, /connect-src[^;]*http:\/\/127\.0\.0\.1:17777/);
  assert.match(config, /frame-src 'self' menfis-print-bridge:/);
  assert.match(config, /local-network-access=\(self\)/);
  assert.match(config, /https:\/\/fonts\.googleapis\.com/);
  assert.doesNotMatch(config, /connect-src[^;]*http:\/\/\*/);
});
