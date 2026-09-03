# THREE D HOUSE — Netlify + Supabase migration
Updated September 2, 2026.

This is a source migration of your uploaded GitHub ZIP. Nothing has been deployed,
no DNS records changed, and no paid service activated.

## What changed
- Standard Next.js build for Netlify, with the existing storefront design preserved.
- Supabase Auth email/password login, confirmation, reset and customer profile page.
- Server-verified sessions; owner-only administration configured by Supabase user UUID.
- Supabase PostgreSQL product, category, order and quote APIs.
- Product/category photos managed in GitHub; no active R2 or video-upload dependency.
- COD checkout uses server prices, row locks, aggregated quantity checks and a retry UUID.
- Checkout and quote submission are OFF by default. Online payment endpoints are disabled.

Read NETLIFY-SETUP.md before uploading this to GitHub or changing your domain.

## Important limits
This is NOT a launch-ready, fully tested live store. You still need to configure Supabase,
apply the SQL, verify email delivery and owner access, add real products/photos, and
perform the launch checklist. Existing live database rows and remote media were not
included in your source ZIP and have NOT been migrated.

Razorpay needs a separate payment integration pass for this backend. Do not add live
payment keys yet. Refunds, payment reconciliation and automatic courier integration
are not included. Cancelled/deleted COD orders do not automatically restock; adjust
inventory deliberately after confirming cancellation. Administration shows the newest
200 orders/quotes; pagination and full-store analytics need follow-up as volume grows.

Sessions expire after at most one hour and require sign-in again (no silent refresh).
Customers only see orders placed while signed into their own account. The printable
document is an order summary, not a GST-compliant tax invoice.

## Local commands
Use Node.js 22.13+ and npm on Windows, macOS or Linux:
```
npm ci
npm test
npm run build:netlify
npm run dev
```
Set local configuration in .env.local using .env.example; never commit real values.
The package lock and dependency versions are unchanged. No new package is required.

Old Cloudflare files (worker/, db/, drizzle/, vite.config.ts and the original hosting
metadata) remain as historical source only. Next.js excludes them from type checking;
the active app routes no longer import them. Do NOT run the old Sites/Cloudflare build
or migration commands to deploy this version. Never run the SQLite drizzle SQL in Supabase.

## Validation
- Production Next.js build and TypeScript validation: passed.
- Automated tests: 14 passed, 0 failed.
- ESLint: 0 errors; 15 warnings about plain image elements. Images deliberately
  use static files without an image transformation service.
- Targeted tests cover image restrictions, CSRF origins, exact owner allowlisting,
  remote session verification, private order filtering, payload validation and SQL guards.
- SQL checks are static only: the PostgreSQL migration has NOT been executed here.
- No authenticated Supabase, SMTP, Netlify adapter, browser, load or real checkout test
  has been performed. Follow the launch checklist before enabling orders.
