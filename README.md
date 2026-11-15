# Slab Supply Co. early-access site

Production-ready market-validation landing page for Slab Supply Co., an independent graded-card buying club.

## What is included

- Responsive editorial storefront experience
- Early-access signup with durable D1 storage
- Trade-in interest flow with durable D1 storage
- General note/contact flow with durable D1 storage
- Duplicate signup handling and personal referral links
- Honeypot, timing checks, input limits, and basic rate limiting
- First-party conversion events stored in D1
- Privacy and terms placeholders
- No payment collection

## Local setup

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run build
```

## Vercel deployment

Vercel uses the Next.js framework preset, `npm run build`, and the default `.next` output directory. Local production preview: `npm start`.

The API routes access Cloudflare D1 through its server-side REST API. Configure these environment variables in Vercel before using the signup, trade-in, note, and analytics endpoints:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_D1_API_TOKEN` (a token with D1 read/write access)

Use the existing database with the committed migrations applied, or provision a D1 database and apply `drizzle/0000_gigantic_shatterstar.sql` followed by `drizzle/0001_quiet_komodo.sql`. Vercel does not provision the original Sites database binding or apply migrations automatically. These credentials stay on the server; do not prefix them with `NEXT_PUBLIC_`.

The public pages build without database credentials. Database-backed submissions return an error until the credentials and database are configured; they never report a successful save without storage.

## Data model

- `waitlist_entries`: member interest, source attribution, consent, and referral code
- `trade_in_interests`: grader, value band, timing, and card details
- `analytics_events`: page view and conversion funnel events
- `site_notes`: collector questions, requests, consent, and follow-up status

Do not place certification numbers, payment details, or sensitive identity data in the forms. Before a public commercial launch, connect an email provider for confirmations and operational notifications, replace the legal placeholders, and complete trademark/domain clearance for the Slab Supply Co. name.

## Brand and card imagery

Slab Supply Co. is independent and not affiliated with Nintendo, The Pokémon Company, Game Freak, Creatures, PSA, CGC, BGS, or any marketplace. Product imagery is used to identify reference examples; confirm commercial image-usage rights or replace with licensed photography before a broad public launch.

## Club pages and subscription test phase

The site includes `/membership`, `/join`, `/account`, `/membership/welcome`, `/membership/terms`, `/shop`, `/shop/[slug]`, `/drops`, `/trade-ins`, and `/help`. The member shelf is a searchable reference collection with individual card pages. It is not live inventory: there is no card purchase button, cart, reservation, or fictional order history.

### Connect Stripe in test mode

1. Create a Stripe account and switch to a sandbox/test mode.
2. Create a product for founding annual membership with a **USD $99.00 recurring price every year** (one licensed unit). Copy its `price_...` identifier.
3. Activate the test customer portal login link in Stripe Billing settings. Enable invoices, payment-method updates, and cancellation **at the end of the billing period**. Enable Stripe's "limit customers to one subscription" / redirect existing subscribers to the portal setting.
4. Set these server-only environment variables in Vercel (and `.env.local` for local work):
   - `STRIPE_SECRET_KEY`: an `sk_test_...` key; live keys are rejected.
   - `STRIPE_ANNUAL_PRICE_ID`: the annual test Price ID.
   - `STRIPE_CUSTOMER_PORTAL_URL`: activated `https://billing.stripe.com/p/login/test_...` login link, not a temporary portal session URL.
   - `APP_URL`: canonical origin, e.g. `https://slabsupplyco.vercel.app` (or `http://localhost:4317` locally). Set this to the exact preview origin if testing a preview deployment.
5. Redeploy. `/join` shows test checkout only when all required test settings are present. Otherwise it offers the free founding list. Complete a Stripe test checkout, review the confirmed return page, and exercise renewal/cancellation through the test portal. Use Stripe's documented test card details, never real payment data.

Stripe is the source of truth for this test subscription flow. Payment details are entered on Stripe, not this website. The return page retrieves the actual Stripe session and active subscription before confirming a test payment. It does not reveal customer details or grant access. Request retries reuse an idempotency key, the price is fixed server-side, and the API rejects cross-origin checkout requests. Billing is authenticated using Stripe's emailed portal login link; there is no custom website login or member entitlement database in this phase.

**Not a live billing implementation:** there are no webhook-driven entitlements, inventory reservations, fulfillment, or private member accounts yet. Before live enrollment, add authenticated member identity, verified/idempotent webhook processing for renewals/cancellations/failed payments, member access rules, real inventory and order handling, final business/legal/refund/shipping policies, and complete end-to-end testing. Live billing deliberately cannot be enabled through an environment flag in this version.

### Verification

`npm test` covers test/live key gating, portal URL validation, fixed annual price checks, canonical return origins, payment-status verification, checkout request safeguards, session parameters, and idempotent retry keys. `npm run build` checks TypeScript and builds all routes. Stripe-hosted payment and portal completion require your connected sandbox account and cannot be verified with placeholder credentials.

The founding-list, trade-in, contact, and analytics forms still require the D1 credentials documented above. They report errors if persistence is unavailable; they do not simulate saved submissions.
