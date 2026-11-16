import { clerkClient } from "@clerk/nextjs/server";
import { getStripe } from "./stripe";
import { membershipPeriod } from "./membership-period";
export function isOwnedTestMembership(subscription: { livemode: boolean; status: string; metadata: Record<string, string> | null }, userId: string) {
  return !subscription.livemode && subscription.status === "active" && subscription.metadata?.clerk_user_id === userId && subscription.metadata?.membership === "founding-annual";
}
export async function membershipForUser(userId: string): Promise<{ state: "active-test" | "none" | "unavailable"; renewsAt?: number | null; activeUntil?: number | null }> {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) return { state: "none" };
  if (!/^user_[a-zA-Z0-9]+$/.test(userId)) return { state: "unavailable" };
  try {
    const stripe = getStripe();
    const user = await (await clerkClient()).users.getUser(userId);
    const customerId = user.privateMetadata.stripeTestCustomerId;
    if (typeof customerId === "string") {
      const subscriptions = await stripe.subscriptions.list({ customer: customerId, status:"all", limit:100 });
      const active = subscriptions.data.find(subscription => isOwnedTestMembership(subscription, userId));
      return active ? { state: "active-test", ...membershipPeriod(active) } : { state: "none" };
    }
    const subscriptions = await stripe.subscriptions.search({ query: `metadata['clerk_user_id']:'${userId}' AND metadata['membership']:'founding-annual'`, limit: 100 });
    const active = subscriptions.data.find(subscription => isOwnedTestMembership(subscription, userId));
    return active ? { state: "active-test", ...membershipPeriod(active) } : { state: "none" };
  } catch { return { state: "unavailable" }; }
}
