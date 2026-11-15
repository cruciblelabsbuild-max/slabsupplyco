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
