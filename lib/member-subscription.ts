import { clerkClient } from "@clerk/nextjs/server";
import { getStripe } from "./stripe";
export function isOwnedTestMembership(subscription: { livemode: boolean; status: string; metadata: Record<string, string> | null }, userId: string) {
  return !subscription.livemode && subscription.status === "active" && subscription.metadata?.clerk_user_id === userId && subscription.metadata?.membership === "founding-annual";
}
export async function membershipForUser(userId: string): Promise<{ state: "active-test" | "none" | "unavailable" }> {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) return { state: "none" };
  if (!/^user_[a-zA-Z0-9]+$/.test(userId)) return { state: "unavailable" };
  try {
    const stripe = getStripe();
    const user = await (await clerkClient()).users.getUser(userId);
    const customerId = user.privateMetadata.stripeTestCustomerId;
    if (typeof customerId === "string") {
      const subscriptions = await stripe.subscriptions.list({ customer: customerId, status:"all", limit:100 });
      return { state: subscriptions.data.some(subscription => isOwnedTestMembership(subscription,userId)) ? "active-test" : "none" };
    }
    const subscriptions = await stripe.subscriptions.search({ query: `metadata['clerk_user_id']:'${userId}' AND metadata['membership']:'founding-annual'`, limit: 100 });
    return { state: subscriptions.data.some(subscription => isOwnedTestMembership(subscription, userId)) ? "active-test" : "none" };
  } catch { return { state: "unavailable" }; }
}
