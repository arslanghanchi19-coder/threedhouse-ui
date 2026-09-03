# Setup guide — Netlify Free + Supabase Free

## 1. Keep billing off
Stay on the Free plan in both accounts. Do not start a paid trial, activate R2,
purchase add-ons, or enable paid email overages. Your domain renewal is separate.
Free plans have limits and can pause or restrict service; this is not unlimited free hosting.
Netlify currently provides 300 credits/month; production deploys, traffic and compute
share that allowance. Supabase Free can pause after one week of inactivity.
Review the official terms before launch:
- https://www.netlify.com/pricing/
- https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/billing-faq-for-credit-based-plans/
- https://supabase.com/pricing

## 2. Save a backup and update GitHub
Keep your current repository/version as a backup. Extract this ZIP. Copy the contents
of its project folder into your local threedhouse-ui repository; do not create an
extra nested project folder. Review and commit the changes, including netlify.toml,
supabase/001_store.sql and the new app/account and lib/server folders.
Never commit .env.local, passwords, access tokens or service-role keys.
Do not remove the existing domain records or the working old deployment.

## 3. Connect Netlify
Choose Free, import the GitHub repository arslanghanchi19-coder/threedhouse-ui,
and use main as the production branch.
- Base directory: repository root (blank).
- Framework: Next.js — not Vite, Cloudflare Workers or a static HTML site.
- Build command: npm run build:netlify
- Publish directory: .next
- Node: 22 (configured in netlify.toml).
Netlify automatically supplies its Next.js adapter. Do not deploy by dragging only
a static folder: that would omit login, products and orders.
Review https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/

Use the temporary Netlify URL first. A build without Supabase settings can display
the page design, but the catalogue/account features will report that setup is incomplete.
Limit unnecessary production rebuilds to conserve credits. Disable unneeded branch
and PR previews in the dashboard. Do not grant production secrets to untrusted PRs.

## 4. Prepare your EXISTING Supabase project
Open your existing three-d-house-store project and confirm its plan is Free.
Back up any existing data. In SQL Editor, review and run supabase/001_store.sql ONCE.
It creates new tdh_-prefixed tables and one transaction function. It does not copy data
from Cloudflare. If any of those table names already exist, stop: do not delete them
or rerun with destructive changes. The script is transactional and should fail instead
of overwriting them.
Do not use the old drizzle/*.sql files; those are SQLite, not PostgreSQL.
Keep Row Level Security enabled. Browser roles receive no direct table access.
All table access goes through server routes with verified customer/owner checks.

## 5. Add Netlify environment variables
Enter these privately in Project configuration → Environment variables.
Use production context/runtime (Functions) only for real production credentials.
No real value belongs in GitHub or chat.

| Name | Value |
| --- | --- |
| SUPABASE_URL | Your project HTTPS URL from Supabase settings |
| SUPABASE_ANON_KEY | The project's legacy anon JWT API key |
| SUPABASE_SERVICE_ROLE_KEY | The project's legacy service_role JWT; server-only secret |
| ADMIN_USER_IDS | Your verified owner user's UUID from Authentication → Users |
| SITE_URL | Exact temporary Netlify HTTPS origin, without a path |
| CHECKOUT_ENABLED | false initially |

Use the legacy anon/service_role keys for this REST integration, not a database password.
Do not rename any secret with a NEXT_PUBLIC_ prefix. An empty ADMIN_USER_IDS grants
nobody admin access. Never use email, customer-editable metadata or an arbitrary
request header as an admin role. Separate additional owner UUIDs with commas only
when you intentionally want to authorize another owner.
Redeploy after configuration changes.

## 6. Configure authentication and email
In Supabase:
1. Enable Email sign-in and allow signups.
2. Keep Confirm email ON. Set minimum password length to at least 8.
3. Set Authentication → URL Configuration → Site URL to the same SITE_URL.
4. Allow the exact /auth/confirm URL for your temporary site. Avoid wildcard domains.
5. Finish the existing Resend sender-domain verification and custom SMTP setup,
   using only its free allowance. This package does not configure or pay for email.
   Supabase's default sender is restricted and is not suitable for arbitrary customer
   signups. Review https://supabase.com/docs/guides/auth/auth-smtp
6. In the Confirm signup email template, set the confirmation link to:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=signup">Confirm email</a>
```

In the Reset password template:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery">Reset password</a>
```

These links exchange a one-use token on the server and redirect to /account.
If template editing is unavailable, complete SMTP setup first. Do not switch off
email confirmation as a workaround.
Use /account to create and confirm your own account. Copy its UUID into
ADMIN_USER_IDS and redeploy. A regular customer must not be able to open /admin.
The app uses an HttpOnly session cookie; it expires after at most an hour.
Sign in again when prompted. This version intentionally does not store refresh tokens.

## 7. Add real images and catalogue data
Bundled logo/category imagery remains in public/. Remote product images were not
in your uploaded ZIP.
- Add product files to public/products, for example public/products/soap-dish.webp.
- Add category files to public/categories, for example public/categories/bathroom.webp.
- Use short filenames with letters, numbers, hyphens or underscores and .jpg, .jpeg,
  .png or .webp extensions. No spaces, nested folders or external URLs.
- Resize/compress offline; aim for a few hundred KB per product image.
- Commit and deploy the images first.
- In /admin → Products, add the real product and enter products/soap-dish.webp.
  For multiple images use one path per line, without public/ or a leading slash.
- Category Photos uses paths such as categories/bathroom.webp.
Removing an image reference does not delete the file from GitHub. Remove a repository
file only after checking it is no longer used by products or order summaries.
Video uploading/hosting is disabled. The site does not create a Supabase Storage bucket.

## 8. Required tests before real orders
Keep CHECKOUT_ENABLED=false until the schema and owner checks below pass.
Use test users, fictional delivery data and a test product, never a real paid order.
- Signup → email confirmation → login → profile update → logout → login.
- Forgot password → reset link → new password → old password rejected.
- Logged-out and ordinary customer accounts cannot read or change admin data.
- Customer A cannot access customer B's orders or owner notes.
- Product/category CRUD, image links, cart quantities/colours and empty catalogue.
- Missing or invalid credentials produce errors, not success or sample products.

Then, in a controlled staging/local test using the same schema, set
CHECKOUT_ENABLED=true to test COD:
- Checkout requires a verified account and valid delivery details.
- Prices come from the database, not the browser request.
- Retrying a request UUID creates only one order and decrements stock once.
- Two simultaneous orders cannot buy the same last unit.
- Multiple colour lines for one product count against total available stock.
- Order status, tracking details and printable order summary work.

The SQL transaction has not been executed here; concurrency and RLS tests are
mandatory on the actual configured backend. Return checkout to false after staging
tests. Enable production checkout deliberately only when you can process orders.
Razorpay remains disabled even if checkout is true. Payment integration, captured
amount/order binding, idempotent verification, refund handling and reconciliation
must be completed and tested separately before online payment is offered.
Configure edge abuse controls/rate limits before public launch. Supabase limits
its auth requests, but do not assume that protects all app endpoints. The COD
function caps each account at ten new orders per hour.

## 9. Connect threedhouse.in LAST
Only after the temporary deployment works, add threedhouse.in and www.threedhouse.in
in Netlify domain settings. Follow the exact DNS values Netlify supplies in GoDaddy.
Do not guess IPs from old screenshots. Preserve all Resend MX/TXT/DKIM/SPF/DMARC
records and unrelated verification records.
Choose one primary hostname; redirect the other to it. Update SITE_URL and Supabase
Site URL/allowed confirmation URL to that primary HTTPS origin, then redeploy.
You do not need a paid Supabase custom-domain add-on.
No DNS or account changes have been made by this migration.

## Developer notes
The active runtime is Next.js + HTTPS Supabase REST/Auth. The old Cloudflare folders
remain for historical reference only. The original source manifest is not a Netlify
deployment instruction. No Sites deployment should be made from this migration.
No data/secret import, Netlify adapter execution, browser QA, SMTP test or live backend
test was performed. Review the backend, email and security checklist before launch.

