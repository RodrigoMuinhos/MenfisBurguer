# Halloween kiosk and event account — 2026-10-31

The kiosk menu shows only Menfis Monster (R$ 33.90), with an optional Coca-Cola Zero + 150g fries addon (R$ 20.90). It requires neither meat doneness nor a sauce selection. Other channels retain the existing menu and prices.

The Halloween customer account has a dedicated large Monster banner followed by active lemonades. Its login uses the same six-digit numeric PIN policy as other customers. Credentials are stored as BCrypt hashes only.

Migrations V102–V104 add the product, addon and account without disabling existing catalog records. They were applied successfully against an isolated local PostgreSQL database. The regular menu and event customization were checked in the browser locally; no real order or payment was created.

Validation: backend tests, frontend typecheck, SEO, PIN, guest checkout, Halloween catalog regression tests, and production build. The release is based on origin/main c215746 and excludes unrelated work from the development checkout.

Deployment: push to main triggers the existing Vercel frontend and Railway backend integrations. Verify their commit statuses, production catalog and event login after deployment. A pre-deployment pricing snapshot is retained outside the repository for comparison.

Rollback: revert this release commit on main and allow both platforms to redeploy. The additive database rows may remain; the previous frontend does not display the event interface. Deactivate only menfis-monster and monster-coca-zero-batata if a complete catalog rollback is needed; existing prices and active flags were not changed.
## Update: regular layout in dark theme and individual sides

Reuse the existing ProductHeader, ProductCarousel and LemonadeShowcase for the event account. Keep the brand display font, Monster hero and operating-hours data, followed by the lemonade section without its separate hero. Dark styling is optional and defaults remain unchanged for other accounts.

V105 adds event-only Coca-Cola Zero (R$ 8.90) and fries 150g (R$ 16.90). Keep the combined addon at R$ 20.90. Regular drink and fries prices are not changed. The server accepts these addons only with the Monster.

Verified desktop and mobile rendering, brand font, absence of horizontal overflow, the three addon choices, local database prices, backend tests, frontend typecheck, contract tests and production build.
## Update: Monster R$ 29.90 and lemonades 300ml

V106 sets the Monster price to R$ 29.90 in both order and pricing catalogs. Lemonades remain R$ 14.90 and their product descriptions, pricing notes, fallback tags and displayed cup size now specify 300ml. Existing addon prices remain unchanged.

Checked the migration on local PostgreSQL and verified catalog/customizer totals and frontend typecheck before production build and publication.
## Update: in-person event mode and Spooky Night identity

Halloween checkout now follows the counter-service kiosk flow: pickup, no delivery/service fee, counter name/payment prompts and no operating-hours or sold-out gating. The account remains identifiable after reload without inventing a phone number. Phone is optional for this in-person event account, while ordinary customer rules remain unchanged. The backend independently resolves the authenticated event account to KIOSK/RETIRADA before store-hours validation.

Remove the upper header and feature bars from the event page, show the full sandwich as the primary visual, apply the supplied black/orange/purple/green palette and a reference-based bat background, and retain the Monster price (R$ 29.90), optional sides and 300ml lemonades. V107 removes 'agridoce' from the Monster description and registers Framboesa Lemonade at R$ 14.90. This fourth flavor is visible only in the event menu, using the existing purple drink image; existing flavor visibility settings are preserved.

Validation: backend closed-store regression and full test suite (54 tests), frontend catalog/session regressions (5 tests), frontend contract tests, production build, desktop/mobile browser checks and intercepted counter checkout request (no real payment/order).

See HALLOWEEN_ASSETS.md for the generated background path and prompt.
## Update: independent cashier SKUs and combo offer

V108 restores the Monster sandwich to R$ 33.90 and sets the Coca-Cola Zero + 150g fries accompaniment to R$ 16.90. The hero and customizer highlight this combo upgrade; selecting it in the hero preselects one accompaniment. Individual Coke (R$ 8.90) and fries (R$ 16.90) remain available.

Monster customization emits independently quantified cart/order lines. Sandwich quantity no longer multiplies accompaniment quantity. Each side is a standalone products/pricing_products row with a separate cashier code:

- menfis-monster: MONSTER
- monster-coca-zero-batata: MONSTER-COMBO-ADD
- monster-coca-zero: MONSTER-COCA-ZERO
- monster-batata-150g: MONSTER-BATATA150

Side SKUs are hidden from the ordinary catalog and displayed in explicit event accompaniment controls. Legacy addon records remain compatible with cached clients, but new Monster cart lines have no embedded addon IDs. Quantities can be changed independently in the cart, and sides can be added on their own from the event menu.

Verified the local migration and cashier codes, frontend typecheck/build/contract tests, eight event regression tests, and mobile browser scenarios: 2 sandwiches + 1 combo accompaniment = R$ 84.70; 1 sandwich + 2 combo accompaniments = R$ 67.70. Browser checks inspect cart rows only and block every order POST URL on all hosts before transmission.
