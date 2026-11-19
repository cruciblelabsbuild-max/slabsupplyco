import type Stripe from "stripe";
import { annualMembership } from "./membership-plan";
import { validAnnualPrice } from "./billing-config";
import { memberSelection } from "./member-selection";
import { safeCardSlug } from "./card-intent";
export const purchaseCard = (slug: unknown) => safeCardSlug(slug) ? memberSelection.find(card => card.slug === slug) : undefined;
export async function createCardCheckout(stripe: Stripe, input: { slug: string; membership: boolean; priceId: string; origin: string; userId: string; customerId: string; key: string }) {
  const card = purchaseCard(input.slug);
  if (!card) throw new Error("Card unavailable.");
  if (input.membership) {
    const price = await stripe.prices.retrieve(input.priceId);
    if (price.livemode || !validAnnualPrice(price)) throw new Error("Annual membership price is unavailable.");
  }
  const metadata = { kind: "card-order-v1", phase: "test", clerk_user_id: input.userId, card_slug: card.slug, card_name: card.name, card_grade: card.grade, card_image: card.image, retail_cents: String(card.retail * 100), card_cents: String(card.member * 100), membership_cents: String(input.membership ? annualMembership.amountCents : 0), ...(input.membership ? { membership: "founding-annual", membership_price: input.priceId } : {}) };
  const session = await stripe.checkout.sessions.create({
    mode: input.membership ? "subscription" : "payment",
    customer: input.customerId,
    client_reference_id: input.userId,
    line_items: [
      ...(input.membership ? [{ price: input.priceId, quantity: 1 }] : []),
      { price_data: { currency: "usd", unit_amount: card.member * 100, product_data: { name: `${card.name} · ${card.grade}`, images: [`${input.origin}${card.image}`], metadata: { card_slug: card.slug } } }, quantity: 1 },
    ],
    ...(input.membership ? { subscription_data: { metadata: { membership: "founding-annual", phase: "test", clerk_user_id: input.userId } } } : { payment_intent_data: { setup_future_usage: "off_session" as const, metadata } }),
    metadata,
    success_url: `${input.origin}/account/orders?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/shop/${card.slug}?canceled=1`,
    allowed_payment_method_types: ["card", "link"],
    billing_address_collection: "required",
    shipping_address_collection: { allowed_countries: ["US"] },
    customer_update: { address: "auto", name: "auto", shipping: "auto" },
    saved_payment_method_options: { payment_method_save: "enabled" },
    custom_text: { submit: { message: `Test purchase. No real payment or card shipment.${input.membership ? ` Membership renews at ${annualMembership.display} USD/year until canceled. The card is a one-time purchase.` : ""}` } },
  }, { idempotencyKey: input.membership ? `founding-${input.userId}-${input.key}` : `card-${input.userId}-${card.slug}-${input.key}` });
  if (session.livemode || !session.url) throw new Error("Test checkout unavailable.");
  const url = new URL(session.url);
  if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Unexpected checkout destination.");
  return url.toString();
}
