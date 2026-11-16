# Trades P0 operations

The trade desk lives at `/trade-admin`. It uses the existing Clerk sign-in. Only a server-owned `privateMetadata.tradeAdmin === true` grants access; membership, profile fields, email naming and browser state never grant permissions. The dedicated admin account has no paid membership requirement. Its credentials are delivered outside this repository.

## Review workflow

1. Select a submission. Review its descriptions, private photos and collection lists. Request missing information before quoting.
2. Issue an aggregate preliminary offer identifying the included cards/lots and count. Record the valuation basis, net credit, any shipping deduction already reflected, shipping responsibility/costs, inspection conditions, return costs and verified coverage arrangements. An optional expiry applies to acceptance. Revisions create new versions and require a reason.
3. The member accepts the exact current offer and terms. This creates pending credit only. Unaccepted inspection revisions preserve the previously accepted pending amount.
4. Create the actual shipping label with your shipping provider. Attach its PDF, tracking and complete sender/recipient, package, service, approved value and coverage information. Verify the receiving address, collectible eligibility and actual coverage before attaching. Do not treat declared value as automatic insurance. Attach additional labels for additional packages under the same accepted terms.
5. Mark transit, delivery, receipt and inspection separately as verified. These are manual updates; carrier tracking links are provided, but there is no carrier webhook integration in P0.
6. Confirm inspection, or issue a revised inspection offer with the reason. The member must accept revised terms before credit can be posted. If declined, arrange the return under the previously accepted terms, attach the return label and record shipped/delivered stages.
7. Issue final credit after inspection and applicable acceptance. The database locks the trade, records one ledger entry per trade and closes pending credit atomically. Repeated requests cannot increase the balance again.

## Data and privacy

- New trade records, immutable offer versions, acceptances, manual shipment/inspection events and credit transactions use the existing Neon database. `lib/trades/store.ts` initializes the additive schema in `db/trades/schema.ts`.
- Existing Clerk trade records remain intact and are copied idempotently for display and review. Historical quoted/completed records do not invent accepted offers or credit entries.
- Files are stored privately in the database with ownership/admin authorization on every request; public image URLs are never created. Supports JPG/PNG/WEBP, UTF-8 CSV, simple XLSX; admin-generated labels must be PDF. Limits: 30 submission files and 12 labels per trade, 3 MB/file. Large photos are reduced before upload. Lists have filename/size previews and manual review; no workbook execution or automatic valuation.
- Home adds posted trade credit to the existing verified account ledger. Pending credit is derived from accepted, unfinished trade obligations, not wallet entries. Failures display unavailable values instead of fabricated balances.
- This update does not change purchasing or introduce checkout credit redemption. Payment processing remains unchanged, as required by the brief.
- Email notifications, provider automation, richer partial-card handling, OCR and automatic valuation are outside P0. In-app action counts, trade details and immutable history provide the P0 handoff. Members can open an authenticated trade at `/trade-ins?view=trades&trade=TRADE_UUID`.

## Validation

`npm test` covers existing flows and new input/file/pending-credit rules. For isolated database lifecycle tests: `RUN_TRADE_DB_TESTS=1 node --env-file=.env.local --import tsx --test tests/trades-db.test.ts`. The integration test creates tagged synthetic records, exercises revisions, terms acceptance, private documents, multiple packages, transit/inspection, returns, concurrent credit issuance and legacy import, then removes only its own fixtures.
