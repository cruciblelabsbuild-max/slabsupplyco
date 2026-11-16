# Member Grail drops

Only the signed-in `/drops` page changes. Public pages, navigation, Member Home, subscriptions and checkout remain unchanged. The existing Neon database stores sourcing candidates, authenticated member interests, and verified drop schedules. Interest is separate from orders and inventory reservations.

The cycle follows America/New_York, including daylight-saving time and year rollover. Current-month confirmed inventory takes priority, otherwise the next scheduled drop appears. Interest always targets the following calendar month. Prior interests remain available to operators; they are never silently carried forward. Nine default sourcing candidates span three budget bands without individual quoted prices. A month-specific selection replaces those defaults.

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

The input is an array of up to twelve objects with `id`, `name`, `set`, `grade`, `tier` and `image` (existing `/cards/*.webp` path). Grade is a sourcing target. No candidate price is accepted. Reusing an ID retains its interest history; use a new ID if the actual card or target grade changes. This operation replaces the month's active selection without deleting member interests. Default candidates can be disabled through `ssc_grail_candidates.active`.

## Promote sourced cards into a drop

```
npx tsx scripts/grails-admin.ts schedule 2026-12 work/verified-drop.json
```

Input fields: `sourceVerified: true`, `startsAt` and `endsAt` (ISO timestamps with timezone), and `inventorySlugs` (one to six existing purchasable, actually sourced card IDs). Only run after verifying ownership, card/grade/photography and current prices. Existing catalog fields supply name, image, set, grader, grade and prices; inventory supplies quantity (one slab) and availability. This creates a confirmed schedule, never an order or preorder. Interested members are not automatically charged, reserved, or allocated cards.

## Checks

`npm test` covers calendar boundaries, drop states and input validation. `npx tsx scripts/check-grail-interests.ts` checks real database persistence, concurrent duplicate saves, user isolation, price updates, withdrawal and month separation using disposable QA member IDs; it cleans up only those QA interests.

## Budget-band review experience (November 2026)

The user approved filling November’s editorial selection for design review. `monthlyGrailFeatures` in `lib/grail-selection.ts` contains Lugia PSA 8 ($1,395), Jungle Snorlax PSA 9 ($595), and Evolutions Charizard PSA 9 ($179), reusing the established catalog prices and photography. These are preview cards only, with no fabricated release time, ownership verification, available quantity, reservation, or checkout action. They disappear automatically after their configured month. A real verified current-month drop takes precedence. Stripe remains test-only.

Future sourcing candidates are grouped into `1000-plus`, `around-500`, and `200-under`. Each group has its own accessible carousel and independent position; votes remain saved when moving between slides. Members may vote for multiple cards, withdraw votes, and retain the existing price-preference and suggestion controls. Bands are sourcing budgets rather than guaranteed prices. The default selection has three options per band. Month-specific admin selections now accept up to twelve candidates and require a `tier` using one of those IDs; review exports include the budget band.

New artwork uses the same Pokémon TCG image source as the existing selection: Dragonite V #192 (`swsh7/192`), Charmander #168 (`sv3pt5/168`), Suicune V #GG38 (`swsh12pt5gg/GG38`). Cards without photographed slabs reuse the existing graded-card presentation. Sourcing bands were checked against grade-specific PriceCharting references on November 16, 2026: Dragonite V #192 Grade 9 (https://www.pricecharting.com/game/pokemon-evolving-skies/dragonite-v-192), Charmander #168 Grade 9 / PSA 10 (https://www.pricecharting.com/game/pokemon-scarlet-%26-violet-151/charmander-168), and Suicune V #GG38 Grade 9 (https://www.pricecharting.com/game/pokemon-crown-zenith/suicune-v-gg38). These estimates do not appear as individual candidate offers.
