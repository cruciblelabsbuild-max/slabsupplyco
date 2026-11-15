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

The site uses the `DB` D1 binding declared in `.openai/hosting.json`. After the first build, apply the local migrations in order:

```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_gigantic_shatterstar.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_quiet_komodo.sql
```

Start the built preview:

```bash
npm start -- --port 4317
```

No environment variables are required for the current version. The hosted Sites deployment provisions the D1 database and applies committed migrations.

## Data model

- `waitlist_entries`: member interest, source attribution, consent, and referral code
- `trade_in_interests`: grader, value band, timing, and card details
- `analytics_events`: page view and conversion funnel events
- `site_notes`: collector questions, requests, consent, and follow-up status

Do not place certification numbers, payment details, or sensitive identity data in the forms. Before a public commercial launch, connect an email provider for confirmations and operational notifications, replace the legal placeholders, and complete trademark/domain clearance for the Slab Supply Co. name.

## Brand and card imagery

Slab Supply Co. is independent and not affiliated with Nintendo, The Pokémon Company, Game Freak, Creatures, PSA, CGC, BGS, or any marketplace. Product imagery is used to identify reference examples; confirm commercial image-usage rights or replace with licensed photography before a broad public launch.
