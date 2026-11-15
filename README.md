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
5. Redeploy. `/join` shows test checkout only when all required test settings are present. Otherwise checkout reports that it is unavailable. Complete a Stripe test checkout, review the confirmed return page, and exercise renewal/cancellation through the test portal. Use Stripe's documented test card details, never real payment data.

Stripe is the source of truth for this test subscription flow. Payment details are entered on Stripe, not this website. The return page retrieves the actual Stripe session and active subscription before confirming a test payment. It does not reveal customer details or grant access. Request retries reuse an idempotency key, the price is fixed server-side, and the API rejects cross-origin checkout requests. Clerk authenticates website accounts. Checkout requires a signed-in account with a verified email and stores its immutable Clerk user ID on the Stripe session and subscription. The protected member area checks Stripe for an active test subscription owned by that ID. Stripe’s emailed portal login remains the billing-management flow.

**Not a live billing implementation:** there are no webhook-driven entitlements, inventory reservations, fulfillment, or private member accounts yet. Before live enrollment, add verified/idempotent webhook processing for renewals/cancellations/failed payments, member access rules, real inventory and order handling, final business/legal/refund/shipping policies, and complete end-to-end testing. Live billing deliberately cannot be enabled through an environment flag in this version.

### Verification

`npm test` covers test/live key gating, portal URL validation, fixed annual price checks, canonical return origins, payment-status verification, checkout request safeguards, session parameters, and idempotent retry keys. `npm run build` checks TypeScript and builds all routes. Stripe-hosted payment and portal completion require your connected sandbox account and cannot be verified with placeholder credentials.

The legacy founding-list endpoint, trade-in, contact, and analytics routes require the D1 credentials documented above. They report errors if persistence is unavailable; they do not simulate saved submissions.


## Website sign-in and member area

Clerk development authentication is provisioned locally. `.env.local` and `.clerk/` are ignored and must never be committed. Claim the development application with `npx clerk auth login` from this checkout to manage it in your Clerk account.

For Vercel, configure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` for the same Clerk application, then redeploy. The public key is used in browser code; the secret key stays server-side. The code fixes the sign-in/sign-up routes to `/sign-in` and `/sign-up`, returning to `/account`. Without configured keys the site remains in an explicit guest state, sign-in shows a setup message, and protected pages redirect to sign-in.

- `/account`, `/account/billing`, and `/account/profile` verify the Clerk session on the server.
- The mobile header shows Sign in for guests, and a named account button and signed-in strip for authenticated users. Its menu adds account, billing, settings, and sign-out controls.
- The home page sticky mobile action changes from Join the club to My account after sign-in.
- Sign-up establishes sign-in credentials and returns to `/join` to complete the $99 annual test subscription. There is no separate collector-account offering; sign-in alone does not activate membership.
- Membership status is verified server-side from a matching Stripe subscription, using `clerk_user_id` metadata. Neither local storage, a URL parameter, nor a client-supplied email grants membership.
- Stripe search can be eventually consistent after checkout. The verified checkout confirmation is immediate; account membership can take time to appear. No live entitlements are granted by the test flow.
- Before a real launch, claim/configure the Clerk application for your production domain, set final authentication policies, and complete the Stripe webhook/entitlement work described above.

A synthetic `+clerk_test@example.com` user was created only in the new development application to verify sign-in, the protected area, and sign-out. It contains no customer information.


The home page signup card retains its established design and starts real Clerk registration. It prefills first name and email through Clerk's redirect API. Collecting interests and email-update consent are saved as private account preferences after verified sign-in; they are not used as proof of membership. The account-preferences endpoint verifies the session and request origin. The home form no longer posts to the legacy waitlist endpoint.

Stripe test membership is configured at $99 USD per year. The test billing portal supports invoices, payment method updates, and cancellation at period end. Production Vercel environment variables store the server-only test key and billing settings; no Stripe secrets are committed.

## Member experience readiness

Signed-in visitors enter `/account`; the public homepage design is retained. Club navigation links directly to deals, trade-in guidelines, releases, and settings. Enrollment completion links back to the club. Checkout accepts only the explicit custom and deployment origins, and returns to the same approved origin.

Internal release work (do not expose as product promises):
- Supply verified inventory and exact slab data before enabling card sales. Sample catalog records are not listed in member deals.
- Supply actual release dates, inventory, and purchase rules before publishing releases. No fictional release detail is exposed.
- Connect durable D1 submission storage and operational review before exposing trade-in or help forms. These forms are gated on configured credentials.
- Complete Stripe test payment/renewal/cancellation verification and production entitlement/webhook work before switching to live billing. Checkout remains test mode.
