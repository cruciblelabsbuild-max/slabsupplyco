# Member Grail drops

Only the signed-in `/drops` page changes. Public pages, navigation, Member Home, subscriptions and checkout remain unchanged. The existing Neon database stores sourcing candidates, authenticated member interests, and verified drop schedules. Interest is separate from orders and inventory reservations.

The cycle follows America/New_York, including daylight-saving time and year rollover. Current-month confirmed inventory takes priority, otherwise the next scheduled drop appears. Interest always targets the following calendar month. Prior interests remain available to operators; they are never silently carried forward. Three existing photographed cards (Lugia, 151 Charizard and Grey Felt Hat Pikachu) are default sourcing candidates without prices. A month-specific selection replaces those defaults.

No confirmed drop is seeded. Confirmed inventory must be actually sourced and verified, registered in the existing purchasable product catalog, and use its existing stock and server-owned prices. The 50-card review assortment is not evidence of sourced grail inventory. Do not promote it merely to fill the page. Scheduling a drop does not create inventory, block another listing, or modify checkout. Purchase controls on this page become available at release; inventory reservations and sold state use the existing shopping bag. Any truly exclusive future inventory should not be published elsewhere before release.

## Review interest

With the project’s server-side environment loaded:

```
npx tsx scripts/grails-admin.ts review 2026-12 > work/december-grail-interest.json
```

Exports active unique member counts by candidate, optional maximum-price aggregates, and submitted suggestions. Withdrawn interests are excluded. Prices are member preferences, not quotes, reservations or orders. Member IDs, creation/update timestamps and inactive records remain in `ssc_grail_interests` for authenticated operator/database review; no public popularity endpoint exists.

## Choose candidates

```
npx tsx scripts/grails-admin.ts candidates 2026-12 work/candidates.json
```

The input is an array of up to six objects with `id`, `name`, `set`, `grade` and `image` (existing `/cards/*.webp` path). Grade is a sourcing target. No candidate price is accepted. Reusing an ID retains its interest history; use a new ID if the actual card or target grade changes. This operation replaces the month's active selection without deleting member interests. Default candidates can be disabled through `ssc_grail_candidates.active`.

## Promote sourced cards into a drop

```
npx tsx scripts/grails-admin.ts schedule 2026-12 work/verified-drop.json
```

Input fields: `sourceVerified: true`, `startsAt` and `endsAt` (ISO timestamps with timezone), and `inventorySlugs` (one to six existing purchasable, actually sourced card IDs). Only run after verifying ownership, card/grade/photography and current prices. Existing catalog fields supply name, image, set, grader, grade and prices; inventory supplies quantity (one slab) and availability. This creates a confirmed schedule, never an order or preorder. Interested members are not automatically charged, reserved, or allocated cards.

## Checks

`npm test` covers calendar boundaries, drop states and input validation. `npx tsx scripts/check-grail-interests.ts` checks real database persistence, concurrent duplicate saves, user isolation, price updates, withdrawal and month separation using disposable QA member IDs; it cleans up only those QA interests.
