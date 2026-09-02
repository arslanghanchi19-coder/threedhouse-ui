# THREE D HOUSE — source export

Updated September 2, 2026. Source commit 4e567793532da5c147d4d31f8635daeea002b23e.

This source includes the new monochrome editorial storefront design, inspired by the House of Rare reference. It is not a completed Cloudflare migration or a standalone HTML site. The redesign has not been published to the live website.

## Design update

- Black-and-white theme with uppercase sans-serif headings, compact navigation and an image-led two-panel campaign.
- Responsive collection tiles and product grid; restyled custom-print form, cart, checkout and footer.
- Separate search visibility, price/name sorting, accessible navigation labels, reduced-motion styling and honest missing-image placeholders.
- Uses THREE D HOUSE branding and existing collection images, not copied reference-site branding or photography.
- Store styling lives in app/storefront.css and is scoped to avoid changing administration styles. Existing data, payment and storage API implementations are unchanged.
- Production build passed. Targeted storefront checks passed (4 tests). Lint found zero errors and image-optimization warnings. Browser visual QA and live checkout were not run; the design has not been verified as a pixel-exact match. The full legacy test suite was not rerun.

## Included

- Storefront, cart, image galleries, admin screens, order/payment API code.
- React/Next.js-compatible Vinext application, styles, reusable UI components.
- Database schema and SQL migrations, Worker entrypoint, package lockfile.
- Bundled logo and category images under public/.

## Not included

- Live database rows (products, orders, quotes, customers).
- Product images and videos uploaded to remote object storage.
- Passwords, runtime environment files, payment secrets, API keys, dependencies, build output, or Git history.
- A working Supabase customer-account integration. Supabase/Resend dashboard setup has been underway separately; it is not wired into this source.

## Developer handoff

Start with app/storefront.tsx, app/admin/dashboard.tsx, app/api/, db/schema.ts, worker/index.ts and package.json. The original README contains starter-specific guidance, not proof that this store is ready for production.

The project requires Node.js >=22.13.0. Its shell helpers target Linux; on Windows use WSL with Linux Node installed. npm ci installs locked dependencies; npm run dev runs the development server and npm run build invokes the existing build helper. The build was rerun successfully for this redesign. Run node --test tests/storefront-theme.test.mjs for the targeted checks. Remote database content and credentials are not recreated by installing packages.

Existing runtime dependencies include Cloudflare D1 (DB), R2 (BUCKET), and Sites-managed authentication. The .openai/hosting.json file identifies the original Site; preserve it for that Site, but do not deploy a new independent copy as though it were the original project. A separate Cloudflare deployment needs explicit bindings, deployment configuration, and replacement authentication.

## Before public deployment

Replace the platform-forwarded authentication-header trust with verified sessions on an independently hosted server. Existing administrative guards check for a signed-in user, not a robust owner-only role; enforce owner-only access on every admin page and write/read API before accepting customer accounts. Do not trust user-supplied identity headers.

Complete and test account registration, email verification, password recovery, profile ownership, and private order access. Review payment order binding/replay protection and atomic inventory updates. Configure secrets through the target host, and transfer live records and uploaded media separately with an appropriate backup and migration plan.

This export is for development/handoff and is not a production-security certification.
