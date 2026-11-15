import assert from "node:assert/strict";
import { test } from "node:test";
import { billingConfig, safePortalUrl, siteOrigin, validAnnualPrice } from "../lib/billing-config";
import { checkoutStatus } from "../lib/checkout-status";
import { POST } from "../app/api/checkout/route";

const testConfig = { STRIPE_SECRET_KEY: "sk_test_example", STRIPE_ANNUAL_PRICE_ID: "price_example", STRIPE_CUSTOMER_PORTAL_URL: "https://billing.stripe.com/p/login/test_example" };
const annualPrice = { active: true, currency: "usd", unit_amount: 9900, type: "recurring", recurring: { interval: "year", interval_count: 1, usage_type: "licensed" } };
const completeSession = { mode: "subscription", metadata: { membership: "founding-annual", phase: "test" }, livemode: false, status: "complete", payment_status: "paid", subscription: { status: "active" } };

test("checkout stays closed until the test checkout and portal are configured", () => {
  assert.equal(billingConfig({}).ready, false);
  assert.equal(billingConfig(testConfig).ready, true);
  assert.equal(billingConfig({ ...testConfig, STRIPE_SECRET_KEY: "sk_live_example" }).ready, false);
  assert.equal(billingConfig({ ...testConfig, STRIPE_CUSTOMER_PORTAL_URL: "" }).ready, false);
});
test("portal only allows Stripe-hosted test login links", () => {
  for (const url of ["https://example.com/p/login/test_123", "https://billing.stripe.com.evil.test/p/login/test_123", "javascript:alert(1)", "https://billing.stripe.com/p/login/live_link", "https://user:pass@billing.stripe.com/p/login/test_123"]) assert.equal(safePortalUrl(url), null);
  assert.ok(safePortalUrl(testConfig.STRIPE_CUSTOMER_PORTAL_URL));
});
test("annual checkout rejects a mismatched price, currency, or billing interval", () => {
  assert.equal(validAnnualPrice(annualPrice), true);
  assert.equal(validAnnualPrice({ ...annualPrice, unit_amount: 99900 }), false);
  assert.equal(validAnnualPrice({ ...annualPrice, currency: "eur" }), false);
  assert.equal(validAnnualPrice({ ...annualPrice, active: false }), false);
  assert.equal(validAnnualPrice({ ...annualPrice, recurring: { ...annualPrice.recurring, interval: "month" } }), false);
  assert.equal(validAnnualPrice({ ...annualPrice, recurring: { ...annualPrice.recurring, interval_count: 2 } }), false);
});
test("return URLs never use an untrusted request host or non-HTTPS external origin", () => {
  assert.equal(siteOrigin({ APP_URL: "https://slabsupplyco.vercel.app" }), "https://slabsupplyco.vercel.app");
  assert.equal(siteOrigin({ APP_URL: "http://localhost:4317" }), "http://localhost:4317");
  for (const url of ["http://example.com", "https://example.com/path", "https://example.com?key=abc", "https://user:pass@example.com"]) assert.throws(() => siteOrigin({ APP_URL: url }));
});
test("a confirmation requires our completed, paid, active test subscription", () => {
  assert.equal(checkoutStatus(completeSession).paid, true);
  for (const session of [
    { ...completeSession, livemode: true },
    { ...completeSession, metadata: {} },
    { ...completeSession, payment_status: "unpaid" },
    { ...completeSession, status: "open" },
    { ...completeSession, subscription: { status: "canceled" } },
    { ...completeSession, subscription: { status: "past_due" } },
    { ...completeSession, subscription: "sub_unexpanded" },
    { ...completeSession, subscription: null },
  ]) assert.equal(checkoutStatus(session).paid, false);
  assert.equal(checkoutStatus({ ...completeSession, payment_status: "unpaid" }).pending, true);
  assert.equal(checkoutStatus({ ...completeSession, subscription: { status: "canceled" } }).pending, false);
});
test("checkout endpoint fails closed, rejects cross-site requests and requires renewal consent", async () => {
  const saved = { ...process.env };
  try {
    delete process.env.STRIPE_SECRET_KEY;
    let response = await POST(new Request("https://slabsupplyco.vercel.app/api/checkout", { method: "POST" }));
    assert.equal(response.status, 503);
    Object.assign(process.env, testConfig, { APP_URL: "https://slabsupplyco.vercel.app" });
    response = await POST(new Request("https://slabsupplyco.vercel.app/api/checkout", { method: "POST", headers: { origin: "https://other.test" } }));
    assert.equal(response.status, 403);
    response = await POST(new Request("https://slabsupplyco.vercel.app/api/checkout", { method: "POST", headers: { origin: "https://slabsupplyco.vercel.app", "content-type": "application/json" }, body: JSON.stringify({ acceptRenewal: false }) }));
    assert.equal(response.status, 400);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});

test("server creates a fixed annual test subscription with idempotent retries", async () => {
  const { createTestCheckout } = await import("../lib/test-checkout");
  const calls: unknown[][] = [];
  const stripe = {
    prices: { retrieve: async (id: string) => { assert.equal(id, "price_server_config"); return { ...annualPrice, livemode: false }; } },
    checkout: { sessions: { create: async (...args: unknown[]) => { calls.push(args); return { url: "https://checkout.stripe.com/c/pay/cs_test_example", livemode: false }; } } },
  } as unknown as import("stripe").default;
  const url = await createTestCheckout(stripe, "price_server_config", "https://slabsupplyco.vercel.app", "retry-key");
  assert.equal(new URL(url).hostname, "checkout.stripe.com");
  const [params, options] = calls[0] as [{ mode: string; line_items: unknown[]; success_url: string; cancel_url: string; metadata: { phase: string } }, { idempotencyKey: string }];
  assert.equal(params.mode, "subscription");
  assert.deepEqual(params.line_items, [{ price: "price_server_config", quantity: 1 }]);
  assert.equal(params.metadata.phase, "test");
  assert.ok(params.success_url.endsWith("/membership/welcome?session_id={CHECKOUT_SESSION_ID}"));
  assert.ok(params.cancel_url.endsWith("/join?canceled=1"));
  assert.equal(options.idempotencyKey, "founding-retry-key");
});
test("a live or mismatched price is rejected before a checkout session is created", async () => {
  const { createTestCheckout } = await import("../lib/test-checkout");
  for (const price of [{ ...annualPrice, livemode: true }, { ...annualPrice, livemode: false, unit_amount: 19900 }]) {
    let called = false;
    const stripe = { prices: { retrieve: async () => price }, checkout: { sessions: { create: async () => { called = true; } } } } as unknown as import("stripe").default;
    await assert.rejects(() => createTestCheckout(stripe, "price_id", "https://slabsupplyco.vercel.app", "key"));
    assert.equal(called, false);
  }
});
