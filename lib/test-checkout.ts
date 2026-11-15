import type Stripe from "stripe";
import { validAnnualPrice } from "./billing-config";
export async function createTestCheckout(stripe: Stripe, priceId: string, origin: string, requestKey: string) {
  const price = await stripe.prices.retrieve(priceId);
  if (price.livemode || !validAnnualPrice(price)) throw new Error("The configured test Price must be an active USD $99 annual recurring price.");
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/membership/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/join?canceled=1`,
    allowed_payment_method_types: ["card", "link"],
    billing_address_collection: "auto",
    metadata: { membership: "founding-annual", phase: "test" },
    subscription_data: { metadata: { membership: "founding-annual", phase: "test" } },
    custom_text: { submit: { message: "Test membership only. No real payment or live member access. $99 USD per year in this test subscription; cancel renewal through the billing portal." } },
  }, { idempotencyKey: `founding-${requestKey}` });
  if (!session.url || session.livemode) throw new Error("Stripe did not return a test checkout URL.");
  const url = new URL(session.url);
  if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Unexpected checkout destination.");
  return url.toString();
}
