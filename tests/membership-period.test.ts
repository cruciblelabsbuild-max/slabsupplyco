import { test } from "node:test";
import assert from "node:assert/strict";
import { membershipPeriod } from "../lib/membership-period";
const end = 1826323200;
const subscription = { cancel_at: null, cancel_at_period_end: false, items: { data: [{ current_period_end: end, price: { recurring: { interval: "year" } } }] } };
test("renewing memberships use the annual item's actual billing period", () => {
  assert.deepEqual(membershipPeriod(subscription), { renewsAt: end, activeUntil: end });
});
test("scheduled cancellation displays paid access end without promising a renewal", () => {
  assert.deepEqual(membershipPeriod({ ...subscription, cancel_at_period_end: true }), { renewsAt: null, activeUntil: end });
  assert.deepEqual(membershipPeriod({ ...subscription, cancel_at: end - 86400 }), { renewsAt: null, activeUntil: end - 86400 });
});
test("missing or invalid billing dates are never fabricated", () => {
  assert.deepEqual(membershipPeriod({ ...subscription, items: { data: [] } }), { renewsAt: null, activeUntil: null });
  assert.deepEqual(membershipPeriod({ ...subscription, items: { data: [{ current_period_end: NaN, price: {} }] } }), { renewsAt: null, activeUntil: null });
});
