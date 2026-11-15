import assert from "node:assert/strict";
import { test } from "node:test";
import { authConfigured } from "../lib/auth-config";
import { isOwnedTestMembership } from "../lib/member-subscription";
test("authentication requires both provider keys", () => {
  assert.equal(authConfigured({}), false);
  assert.equal(authConfigured({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example" }), false);
  assert.equal(authConfigured({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example", CLERK_SECRET_KEY: "sk_test_example" }), true);
});
test("membership belongs to the verified provider identity, never a client-side flag", () => {
  const subscription = { livemode: false, status: "active", metadata: { clerk_user_id: "user_owner", membership: "founding-annual" } };
  assert.equal(isOwnedTestMembership(subscription, "user_owner"), true);
  assert.equal(isOwnedTestMembership(subscription, "user_someoneelse"), false);
  assert.equal(isOwnedTestMembership({ ...subscription, livemode: true }, "user_owner"), false);
  assert.equal(isOwnedTestMembership({ ...subscription, metadata: {} }, "user_owner"), false);
  for (const status of ["canceled", "past_due", "unpaid", "incomplete", "incomplete_expired", "trialing"]) assert.equal(isOwnedTestMembership({ ...subscription, status }, "user_owner"), false);
});
test("account preferences reject foreign origins and signed-out callers", async () => {
  const { POST } = await import("../app/api/account/preferences/route");
  const key = process.env.CLERK_SECRET_KEY;
  delete process.env.CLERK_SECRET_KEY;
  try {
    const foreign = await POST(new Request("https://slabsupplyco.vercel.app/api/account/preferences", { method: "POST", headers: { origin: "https://other.test" } }));
    assert.equal(foreign.status, 403);
    const guest = await POST(new Request("https://slabsupplyco.vercel.app/api/account/preferences", { method: "POST", headers: { origin: "https://slabsupplyco.vercel.app" } }));
    assert.equal(guest.status, 401);
  } finally { if (key !== undefined) process.env.CLERK_SECRET_KEY = key; }
});
