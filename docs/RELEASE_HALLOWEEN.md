# Halloween kiosk and event account — 2026-10-31

The kiosk menu shows only Menfis Monster (R$ 33.90), with an optional Coca-Cola Zero + 150g fries addon (R$ 20.90). It requires neither meat doneness nor a sauce selection. Other channels retain the existing menu and prices.

The Halloween customer account has a dedicated large Monster banner followed by active lemonades. Its login uses the same six-digit numeric PIN policy as other customers. Credentials are stored as BCrypt hashes only.

Migrations V102–V104 add the product, addon and account without disabling existing catalog records. They were applied successfully against an isolated local PostgreSQL database. The regular menu and event customization were checked in the browser locally; no real order or payment was created.

Validation: backend tests, frontend typecheck, SEO, PIN, guest checkout, Halloween catalog regression tests, and production build. The release is based on origin/main c215746 and excludes unrelated work from the development checkout.

Deployment: push to main triggers the existing Vercel frontend and Railway backend integrations. Verify their commit statuses, production catalog and event login after deployment. A pre-deployment pricing snapshot is retained outside the repository for comparison.

Rollback: revert this release commit on main and allow both platforms to redeploy. The additive database rows may remain; the previous frontend does not display the event interface. Deactivate only menfis-monster and monster-coca-zero-batata if a complete catalog rollback is needed; existing prices and active flags were not changed.
