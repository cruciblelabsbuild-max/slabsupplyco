import { getMember } from "../../../lib/member-session";
import { membershipForUser } from "../../../lib/member-subscription";
import { billingCustomer } from "../../../lib/member-billing";
import { NextResponse } from "next/server";
import { billingConfig, checkoutOrigin } from "../../../lib/billing-config";
import {managedCheckout} from "../../../lib/inventory";
import { getStripe } from "../../../lib/stripe";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const config = billingConfig();
  if (!config.ready) return NextResponse.json({ message: "Membership checkout is unavailable. Please try again." }, { status: 503 });
  try {
    const origin = checkoutOrigin(request.headers.get("origin"));
    // Prevent another website from creating checkout sessions on a visitor's behalf.
    if (!origin) return NextResponse.json({ message: "Please start checkout from Slab Supply Co." }, { status: 403 });
    if (Number(request.headers.get("content-length") || 0) > 2000) return NextResponse.json({ message: "Request too large." }, { status: 413 });
    const body = await request.json() as { acceptRenewal?: unknown } | null;
    if (body?.acceptRenewal !== true) return NextResponse.json({ message: "Please confirm the annual renewal terms." }, { status: 400 });
    const member = await getMember();
    if (!member) return NextResponse.json({ message: "Sign in before starting checkout." }, { status: 401 });
    if (!member.email) return NextResponse.json({ message: "Verify your account email before starting checkout." }, { status: 403 });
    const membership = await membershipForUser(member.id);
    if (membership.state === "active-test") return NextResponse.json({ message: "This account already has a membership. Manage it from My account." }, { status: 409 });
    if (membership.state === "unavailable") return NextResponse.json({ message: "Membership status could not be checked. Try again shortly." }, { status: 503 });
    const stripe = getStripe();
    const customerId = await billingCustomer(stripe, { id: member.id, email: member.email });
    const url=await managedCheckout({slugs:[],membership:true,priceId:config.priceId,origin,userId:member.id,customerId});
    return NextResponse.json({ url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Test checkout creation failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ message: "Checkout is unavailable just now. Please try again. Your membership is available from My account." }, { status: 503 });
  }
}
