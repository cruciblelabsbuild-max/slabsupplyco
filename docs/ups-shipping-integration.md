# UPS integration readiness

## Current status

**No UPS account or credentials are configured. No real UPS sandbox or production call has been tested.** The adapter and orchestration have only been exercised with synthetic transports and isolated database fixtures. There are no default package measurements, company address, fabricated credentials, fabricated member labels or invented tracking numbers.

The member sees **Shipping label pending.** The admin sees an unavailable/exception state with the missing configuration behind a disclosure. There is no routine Generate label or PDF-upload form.

## Workflow

- Every immutable offer can record an administrator's shipping approval. It is selected as part of sending a normal offer. Approval can also follow member acceptance. Both arrival orders use the same durable `(trade, offer version, direction)` shipment record.
- Exact-version member acceptance remains in the existing trade/offer audit history. Shipping does not change pending-credit or final-credit accounting.
- Both approvals trigger processing after the existing authenticated mutation. A scheduled worker at `/api/internal/shipping` retries safe work and polls tracking every ten minutes once automation is enabled. The worker is an inert no-op while disabled. Once enabled it requires `CRON_SECRET`, checked with a constant-time comparison; Vercel supplies the matching Authorization header for its cron.
- The measured packing profiles choose capacity, dimensions, packed weight, package count and approved service. Missing card count/address is requested from the member only when processing can proceed and those details are missing or invalid. Otherwise the saved profile address is reused.
- Carrier/company address validation, a rate cap, route/service eligibility and verified collectible coverage all run before the charge-creating call. Administrator shipping approval records the quote value as the approved trade value; returns retain at least the originally accepted amount. This is a trade-obligation value, not an invented market appraisal. The verified coverage contract must cover that agreed value and collectible eligibility.
- UPS creation is marked durably before the network request. Unique jobs, row locks and creation-state guards stop concurrent approvals and retries from buying duplicate shipments. UPS transaction references are correlation identifiers, **not assumed idempotency guarantees**.
- A confirmed provider shipment is saved before PDF recovery. Recovery retries never call shipment creation again. A timeout/interrupted create is **unknown**, held for carrier reconciliation; automatic resubmission is forbidden. Successful creation followed by failed PDF recovery remains recoverable without a second charge.
- Only actual production provider PDFs are atomically attached to the existing authenticated files/labels/history, advancing the existing shipment stage. Multiple package labels share the durable shipment record. Sandbox results are retained internally as `sandbox_ready` and never published as real member labels or moved to production shipping stages.
- Tracking events are deduplicated and persisted. Carrier delivery is distinct from warehouse receipt/inspection and never issues credit.
- Inspection-revision offers can preapprove a return. Return processing starts only after the member's decline or an administrator's finalized inspection rejection, under the previously accepted terms. If a condition discrepancy changes return costs, withhold return approval until the exception and terms are agreed. The system does not charge the member or deduct credit automatically.

## Configuration to supply when the UPS account exists

Server environment only:

- `SHIPPING_PROVIDER=ups`
- `UPS_ENVIRONMENT=sandbox` or `production`
- `UPS_AUTOMATION_ENABLED=true` only after configuration and appropriate authorization
- Separate `UPS_SANDBOX_CLIENT_ID`, `UPS_SANDBOX_CLIENT_SECRET`, `UPS_SANDBOX_ACCOUNT_NUMBER`
- `UPS_SANDBOX_TRADE_ALLOWLIST`: comma-separated UUIDs of isolated integration-test trades; sandbox processing refuses other trades
- Separate `UPS_PRODUCTION_CLIENT_ID`, `UPS_PRODUCTION_CLIENT_SECRET`, `UPS_PRODUCTION_ACCOUNT_NUMBER`
- `UPS_SANDBOX_VERIFIED=true` only after real sandbox integration acceptance; production is blocked without it
- A strong server-only `CRON_SECRET`, configured in Vercel when enabling automation
- `TRADE_SHIPPING_CONFIG`: validated JSON matching `ShippingConfig` in `lib/shipping/types.ts`

That JSON must contain the real receiving/billing name and address; measured and dated packing profiles for a slab, small groups and larger collections; a measurement record; approved service codes; verified collectible coverage reference, total/per-package limits and signature threshold; and an approved maximum shipping rate/package count. Do not copy the synthetic test fixture dimensions or coverage into this configuration.

Automatic issuance currently supports US domestic routes with a verified third-party collectible policy. It deliberately stops other routes or coverage methods for review rather than inventing international/customs rules or treating declared value as insurance. Every package is checked conservatively against the full approved trade value; no fictional equal per-card value allocation is used. UPS declared value is not automatically added as insurance.

The shipper/billing address is the verified company address; inbound pickup origin is the member address, and return origin is the company. Private PDFs retain the sender/recipient and package snapshot. Member screens show only the relevant action and short packing instructions.

## Real sandbox acceptance still required

Connect actual sandbox credentials, actual company/address data, measured packing profiles and verified coverage. Test OAuth scope/account linkage, both address-validation outcomes, negotiated versus billed rates, each approved service, signature options, inbound/return multi-package creation, actual PDF recovery/printing, voiding, tracking codes, duplicate callbacks, timeouts/reconciliation, worker authentication and production-environment separation. Confirm label format and account-specific business rules. Do not set the production verification gate merely because fixture tests pass.

A shipment in `unknown` must be reconciled against the original UPS reference/account before an operator ever permits another purchase. The adapter exposes UPS voiding; any void/replacement requires a verified operational decision. It is not an automatic retry shortcut.

## Primary API references

Implementation targets the official UPS specifications:

- [OAuth client credentials](https://github.com/UPS-API/api-documentation/blob/main/OAuthClientCredentials.yaml)
- [Shipping, PDF recovery and voiding](https://github.com/UPS-API/api-documentation/blob/main/Shipping.yaml)
- [Address validation](https://github.com/UPS-API/api-documentation/blob/main/AddressValidation.yaml)
- [Rating](https://github.com/UPS-API/api-documentation/blob/main/Rating.yaml)
- [Tracking](https://github.com/UPS-API/api-documentation/blob/main/Tracking.yaml)

Shipping uses v2409 creation/void, GIF creation followed by v1 PDF label recovery; direct PDF creation is not assumed. Address validation uses v2; rating uses v2409. These contracts remain subject to actual UPS sandbox/account verification.
