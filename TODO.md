# THREE D HOUSE — pending items

Tracked launch checklist. Update this file as items get resolved.

## Confirmed working (2026-09-03)
- [x] Site is public, live, HTTPS, current Netlify deploy is "ready"
- [x] `/admin` correctly redirects unauthenticated visitors to `/account?next=/admin` (owner-only guard works)
- [x] `/account` login/signup/forgot-password form renders

## Open
- [ ] `/shop` route 404s — the homepage's "SHOP" nav link is a same-page anchor, not a real route, so a direct link/bookmark to `/shop` breaks. Confirm whether this is intentional or a bug.
- [ ] Haven't yet reviewed the actual product listing/catalog UI on the homepage
- [ ] Login/signup flow untested end-to-end (no test account created yet — creating one sends a real Resend confirmation email, so do this deliberately)
- [ ] Database/order flow untested
- [ ] Checkout still disabled (`CHECKOUT_ENABLED=false` in Netlify env) — pending the above being verified
- [ ] SSL/HTTPS certificate validity/expiry not explicitly inspected (site loads fine over HTTPS, but cert details unchecked)
