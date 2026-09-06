# THREE D HOUSE — Netlify + Neon + Clerk

Updated September 6, 2026. This project no longer uses Supabase anywhere — the database
is Neon Postgres (provisioned through Netlify's own Neon extension, no separate account
to manage) and authentication is Clerk.

## What changed
- Standard Next.js build for Netlify, with the existing storefront design preserved.
- Clerk email/password login, email verification, password reset and customer profile page.
- Server-verified sessions (via Clerk's SDK); owner-only administration configured by Clerk user ID.
- Neon PostgreSQL product, category, order and quote APIs.
- Product/category photos managed in GitHub; no active R2 or video-upload dependency.
- COD checkout uses server prices, row locks, aggregated quantity checks and a retry UUID.
- Checkout and quote submission are OFF by default. Online payment endpoints are disabled.

Read NETLIFY-SETUP.md before uploading this to GitHub or changing your domain.

## Important limits
This is NOT a launch-ready, fully tested live store. You still need to verify owner access
on the live site, add real products/photos, and perform the launch checklist.

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

Old Cloudflare files (worker/, drizzle/, vite.config.ts and the original hosting
metadata) remain as historical source only and are unrelated to the live app — the
active `db/schema.sql` is the real, current Neon schema. Next.js excludes the old
files from type checking; the active app routes no longer import them.

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
