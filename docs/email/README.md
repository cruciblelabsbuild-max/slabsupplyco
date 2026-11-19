# Member email system

Ten templates live in `lib/email/templates.ts`. Four reusable PNG graphic families and the raster export of the **existing** logo live in `public/email`. Product thumbnails are converted from the existing catalog photographs for email-client compatibility. No website logo source changes.

## Configuration

Set server-side Vercel **Production** secrets: `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `EMAIL_UNSUBSCRIBE_SECRET` (random 32+ characters), `EMAIL_SENDING_ENABLED=true`. Reuse `APP_URL`, `CRON_SECRET`, Clerk, Stripe, Shippo and inventory database configuration. Optional address configuration: `EMAIL_BUSINESS_MAILING_ADDRESS`. The owner explicitly deferred the mailing address during baseline setup; no shipping-test address is substituted and this is not a sending gate. Set the verified business mailing address before customer-facing promotional launch.

Senders default to `members@slabsupply.co`, `trades@slabsupply.co`, `orders@slabsupply.co`, `drops@slabsupply.co`; overrides `EMAIL_MEMBERS`, `EMAIL_TRADES`, `EMAIL_ORDERS`, `EMAIL_DROPS`. General contacts `EMAIL_HELLO`, `EMAIL_SUPPORT`, `EMAIL_DOMAIN`, `EMAIL_FROM_NAME` are configured. Reply-To matches each category. Incoming email stays with existing Google Workspace.

Preview/development never invoke delivery. Use a separate preview database for isolation: source business records in a shared production database are intentionally treated as real records by the production worker.

## Automation

`/api/internal/email` runs every five minutes with the existing `CRON_SECRET`. Payment/trade handlers also dispatch after business state has committed. Shipping worker dispatches after verified shipping updates. Email failures do not roll back business transactions. Committed source records are scanned from the saved activation boundary; historical members are not mass-emailed on installation.

- Membership welcome: verified initial paid Stripe invoice + owned active annual subscription; account creation, incomplete checkout and renewals do not trigger welcomes.
- Cancellation: owned paid subscription with cancellation scheduled/processed; uses actual paid-through end date and deduplicates scheduled/final cancellation.
- Order: paid checkout + committed sold inventory + paid unrefunded charge.
- Shipped: persisted actual carrier transit/delivery, never label creation.
- Trades: committed submission, current actionable offer, approved accepted saved Shippo label, or actual posted credit-ledger entry, respectively.
- Grails: confirmed source-verified inventory, upcoming 5–7-day window/live availability, paid member eligibility and explicit email opt-in; all checked again at send time. Already-purchased monthly grails are excluded. Editorial preview inventory never qualifies.

The existing site remains in Stripe/Shippo **test** mode. Email integration does not enable live payments or shipping. Email delivery itself is real Resend delivery on production. Business events in the deployed test experience therefore generate the corresponding real email to the signed-in verified recipient, as requested.

## Reliability and operations

Neon tables: `ssc_email_outbox`, `ssc_email_attempts`, `ssc_email_delivery`, `ssc_email_preferences`, `ssc_email_suppression`, `ssc_email_config`. The outbox stores source IDs, freezes the exact first send request, claims rows with leases and `SKIP LOCKED`, uses stable Resend idempotency keys, and records attempts/results. Temporary preparation/delivery failures back off. Failed/unknown sends approaching Resend's 24-hour idempotency boundary enter `review` rather than risking duplicates. Do not reset these blindly: reconcile the frozen idempotency key/provider message first.

Resend delivery webhooks verify the exact raw request, Svix HMAC, timestamp, and duplicate event ID. Delivery history is append-only by unique event ID; bounces/complaints/suppression block future sends to that address. Delivery delays remain handled by Resend. Provider acceptance is distinct from delivered status.

Useful checks:

```sql
SELECT type,status,count(*) FROM ssc_email_outbox GROUP BY type,status;
SELECT id,type,attempts,last_error FROM ssc_email_outbox WHERE status='review';
SELECT event_type,count(*) FROM ssc_email_delivery GROUP BY event_type;
```

Do not print stored message bodies or recipients in routine logs. These are customer data.

## Preferences and links

Profile → Collector preferences contains the grail email checkbox. Opt-out does not disable essential notices. Unsubscribe links are member-bound HMAC tokens; GET displays confirmation without changing state, POST supports one-click unsubscribe without sign-in. Keep the unsubscribe signing secret stable so old links remain valid.

Email member links pass through `/api/email/open`; unauthenticated visitors sign in and return to an allowlisted member destination. Label files retain existing owner/admin checks. Support mailto links are added to existing signed-in page footers with trade/order references.

Clerk authentication/security email behavior and Stripe-managed billing/refund notifications are unchanged. Stripe's existing webhook now also receives initial paid invoices and subscription updates/deletions. Account-level Stripe payment-failure/refund receipt settings cannot be confirmed through the webhook API; verify those in Stripe Dashboard before live billing launch. Google Workspace reply routing is user-provided infrastructure; category Reply-To is configured, but no inbound mailbox delivery was assumed from an outbound test.

## Validation

`npm test` includes ten-template rendering, server-record trigger guards, negative payment/label/credit/promo cases, signature/timestamp/tamper checks, sending-environment gates, cancellation dates and safe return links. Controlled Resend deliveries use only `delivered+<template>@resend.dev`. Never test by generating fabricated paid/credit/shipping records for real members or sending promotional fixtures to member addresses.
