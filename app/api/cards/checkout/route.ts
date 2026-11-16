import { NextResponse } from "next/server";
import { billingConfig, checkoutOrigin } from "../../../../lib/billing-config";
import { getMember } from "../../../../lib/member-session";
import { membershipForUser } from "../../../../lib/member-subscription";
import { billingCustomer, reusableCheckout } from "../../../../lib/member-billing";
import { createCardCheckout, purchaseCard } from "../../../../lib/card-checkout";
import { getStripe } from "../../../../lib/stripe";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const config = billingConfig();
  if (!config.ready) return NextResponse.json({ message: "Checkout is unavailable. Please try again." }, { status: 503 });
  const origin = checkoutOrigin(request.headers.get("origin"));
  if (!origin) return NextResponse.json({ message: "Start checkout from Slab Supply Co." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 2000) return NextResponse.json({ message: "Request too large." }, { status: 413 });
  try {
    const body = await request.json() as {slug?:unknown;acceptRenewal?:unknown}|null;
    const card = purchaseCard(body?.slug);
    if (!card) return NextResponse.json({ message: "This card is unavailable." }, { status: 404 });
    const member = await getMember();
    if (!member) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
    if (!member.email) return NextResponse.json({ message: "Verify your email to continue." }, { status: 403 });
    const membership = await membershipForUser(member.id);
    if (membership.state === "unavailable") return NextResponse.json({ message: "We couldn’t check your membership. Please try again." }, { status: 503 });
    const includeMembership = membership.state !== "active-test";
    if (includeMembership && body?.acceptRenewal !== true) return NextResponse.json({ message: "Confirm the annual membership renewal terms." }, { status: 400 });
    const stripe = getStripe();
    const customerId = await billingCustomer(stripe, { id: member.id, email: member.email });
    let url: string | undefined;
    let key: string;
    if (includeMembership) {
      const existing = await reusableCheckout(stripe, customerId, member.id, config.priceId, card.slug);
      if (existing.blocked) return NextResponse.json({ message: "Your membership needs attention. Manage billing in your profile before purchasing." }, { status: 409 });
      url = existing.url;
      key = existing.key!;
    } else {
      const sessions = await stripe.checkout.sessions.list({ customer: customerId, limit: 100 });
      const ours = sessions.data.filter(session => !session.livemode && session.mode === "payment" && session.metadata?.kind === "card-order-v1" && session.metadata?.clerk_user_id === member.id && session.metadata.card_slug === card.slug);
      url = ours.find(session => session.status === "open")?.url || undefined;
      key = ours[0]?.id || "first";
    }
    url ||= await createCardCheckout(stripe, { slug: card.slug, membership: includeMembership, priceId: config.priceId, origin, userId: member.id, customerId, key });
    if (new URL(url).hostname !== "checkout.stripe.com" || new URL(url).protocol !== "https:") throw new Error("Unexpected checkout destination.");
    return NextResponse.json({ url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Card checkout failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ message: "Checkout could not open. Please try again." }, { status: 503 });
  }
}
