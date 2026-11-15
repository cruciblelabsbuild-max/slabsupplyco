import Stripe from "stripe";
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_")) throw new Error("Only Stripe test keys are supported during this phase.");
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 15000 });
}
