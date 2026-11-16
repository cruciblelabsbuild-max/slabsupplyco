import { clerkClient } from "@clerk/nextjs/server";
import type Stripe from "stripe";
export async function billingCustomer(stripe: Stripe, member: { id: string; email: string }) {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(member.id);
  const existing = user.privateMetadata.stripeTestCustomerId;
  if (typeof existing === "string") {
    const customer = await stripe.customers.retrieve(existing);
    if (customer.deleted || customer.livemode || customer.metadata.clerk_user_id !== member.id) throw new Error("Billing identity could not be verified.");
    return customer.id;
  }
  const customer = await stripe.customers.create({ email: member.email, metadata: { clerk_user_id: member.id } }, { idempotencyKey: `ssc-test-customer-${member.id}` });
  if (customer.livemode) throw new Error("Only test billing is supported.");
  await clerk.users.updateUserMetadata(member.id, { privateMetadata: { stripeTestCustomerId: customer.id } });
  return customer.id;
}
export const blocksNewMembership = (status: string) => !["canceled", "incomplete_expired"].includes(status);
export async function reusableCheckout(stripe: Stripe, customerId: string, userId: string, priceId: string, cardSlug = "") {
  const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit:100 });
  if (subscriptions.data.some(s => blocksNewMembership(s.status))) return { blocked: true as const, url:undefined, key:undefined };
  const sessions = await stripe.checkout.sessions.list({ customer:customerId, limit:100 });
  const ours = sessions.data.filter(s => s.metadata?.clerk_user_id === userId && s.metadata?.membership === "founding-annual");
  const open = ours.find(s => s.status === "open" && s.metadata?.membership_price === priceId && (s.metadata?.card_slug || "") === cardSlug && s.url);
  if (open?.url) {
    const url = new URL(open.url);
    if (open.livemode || url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Unexpected checkout destination.");
    return { blocked:false as const, url:open.url, key:open.id };
  }
  // An annual checkout must contain only the currently selected card. Retire stale
  // carts before making another; shared idempotency keys also protect concurrent tabs.
  for (const session of ours.filter(s => s.status === "open" && !s.livemode)) await stripe.checkout.sessions.expire(session.id);
  // Concurrent tabs derive the same key from the last session, rather than the browser.
  return { blocked:false as const, key:ours[0]?.id || "first" };
}
