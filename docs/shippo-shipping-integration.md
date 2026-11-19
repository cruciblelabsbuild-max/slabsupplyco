# Shippo shipping operations

The new-shipment provider is Shippo. Historic UPS records retain their original adapter for recovery only. No site components, styling or member forms change.

## Configuration and addresses

Use the server-only variables in `.env.example`. `SHIPPO_MODE` explicitly chooses test or live; the matching token prefix is mandatory. There is no live fallback. The deployed application uses test mode. `SHIPPO_TEST_WORKFLOWS_ENABLED=true` allows approved test workflows to publish actual Shippo test PDFs through the existing trade download mechanism. Without that switch test documents are quarantined. Shippo labels carry their original mode, and test PDFs cannot be downloaded in live mode.

The configured company address is the default outbound origin and inbound receiving address. Separate fulfillment/receiving JSON overrides are supported. Inbound uses the saved account profile (or a previously confirmed trade address); outbound uses the paid Checkout shipping address. Missing or invalid addresses block issuance without introducing another form. The configured business email and phone are used as the sender's carrier contact; USPS requires both. Customer email is omitted from the recipient to avoid triggering duplicate Shippo customer emails. Verify account-level notification preferences before production.

Estimated profiles are centralized: 1–2 slabs 10×8×5, 3–5 10×8×6, 6–10 12×10×8 inches; 8 oz packing plus 3 oz per slab, rounded upward. Eleven or more require review. `SHIPPO_PACKING_PROFILES` replaces these estimates with measured profiles; each includes id, capacity, lengthIn, widthIn, heightIn, emptyWeightLb, slabWeightLb, serviceCode (`tracked`), measurementRecord and measuredAt. Correct dimensions in this server configuration before authorizing a failed attempt's retry. Do not alter an already purchased label's parcel data.

## Triggers and persistence

Trades require the current accepted offer and separate shipping approval, in either order. Return shipments also require a finalized return decision and verified accepted return terms. Counts derive from accepted items or a confirmed collection count, never uploaded-file count. Orders require a complete paid inventory-backed Checkout, matching user/customer/reservation and amounts, sold inventory, unrefunded charge, and fulfillment authorization. Membership charges are excluded from shipment value.

The existing ten-minute cron and immediate trade hooks process durable jobs. A database compare-and-set lease precedes the only Transaction POST. The quote, attempt reference and creation start are persisted first. After a timeout or interruption, only the original transaction is reconciled: there is no blind second purchase. Successful transaction, original identity and mode are verified before PDF publication. Carrier, service, amounts, parcel/coverage decisions, Shippo IDs, label bytes and tracking are retained. Shipping errors cannot roll back payments or issue trade credit.

`ordersForUser` includes an optional fulfillment record with verified shipment status and tracking; the Orders page appearance is unchanged. Existing trade label events are retained. No new notification sender has been added.

## Admin operations (existing admin authentication)

`GET /api/shipping/admin` lists trade/order job states and operational failures. `GET /api/shipping/admin?orderLabel=<job UUID>` downloads an authorized order label in its original configured mode.

Same-origin `POST /api/shipping/admin` accepts:

- `{action:"approve_order",sessionId}` — authorize a paid order; worker handles issuance.
- `{kind:"trade"|"order",id,action:"correct",address}` — correct a complete member address before purchase.
- `{kind,id,action:"reconcile",transactionId}` — GET the original provider transaction; never purchase a replacement.
- `{kind,id,action:"retry"}` — retry only an unpurchased job or provider-confirmed ERROR transaction. Archives prior attempt and assigns a new reference.
- `{kind,id,action:"refund",unusedConfirmed:true}` — request an unused label refund. A confirmed refund is required before treating it as voided. Automatic replacements remain disabled.

These routes reuse the trade desk's admin authorization. They add no visible forms or navigation. A process interrupted during a charge is flagged for reconciliation.

## Webhooks and tracking

Register test-mode `transaction_created`, `transaction_updated` and `track_updated` callbacks at `/api/shippo/webhook?token=<SHIPPO_WEBHOOK_TOKEN>`. Use a random token of at least 32 characters. An optional configured Shippo HMAC secret supports signed callbacks instead. Callback bodies are durable wake-up hints, not authoritative shipment facts: the worker fetches original provider transaction/tracking records. Only minimal identifiers are retained; duplicate callbacks share a unique event hash. Wrong-mode events are ignored. The internal worker requires `Authorization: Bearer <CRON_SECRET>`.

Delivery scans update shipment receipt tracking only. Inspection and separate credit approval remain mandatory; the credit ledger and pending-credit logic are unchanged.

## Production activation checklist

Keep live credentials and activation disabled until separately approved. Confirm real origin/receiving address, billing and eligible carrier accounts; physically measure loaded parcels; verify graded-card eligibility, exclusions and packaging for third-party collectible coverage; configure coverage reference/limits and signatures; verify branded notifications and callback delivery; then supervise a real end-to-end shipment. Declared value is not insurance. Test insurance responses do not establish live collectible coverage.

Official references: [API](https://docs.goshippo.com/api-reference/overview), [testing](https://docs.goshippo.com/guides/testing/), [webhooks](https://docs.goshippo.com/tracking/webhooks/), [insurance](https://docs.goshippo.com/shipments/shipping-insurance/).
