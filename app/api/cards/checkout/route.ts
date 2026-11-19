import { NextResponse } from "next/server";
import { billingConfig, checkoutOrigin } from "../../../../lib/billing-config";
import { getMember } from "../../../../lib/member-session";
import { membershipForUser } from "../../../../lib/member-subscription";
import { billingCustomer } from "../../../../lib/member-billing";
import {checkoutSlugs} from "../../../../lib/bag";
import {managedCheckout} from "../../../../lib/inventory";
import { getStripe } from "../../../../lib/stripe";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const config = billingConfig();
  if (!config.ready) return NextResponse.json({ message: "Checkout is unavailable. Please try again." }, { status: 503 });
  const origin = checkoutOrigin(request.headers.get("origin"));
  if (!origin) return NextResponse.json({ message: "Start checkout from Slab Supply Co." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 2000) return NextResponse.json({ message: "Request too large." }, { status: 413 });
  try {
    const body = await request.json() as {slug?:unknown;slugs?:unknown;acceptRenewal?:unknown}|null;
    let slugs:string[];
    try{slugs=checkoutSlugs(body?.slugs??(body?.slug?[body.slug]:[]));}catch(error){return NextResponse.json({message:error instanceof Error?error.message:"Please check your bag."},{status:400});}
    const member = await getMember();
    if (!member) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
    if (!member.email) return NextResponse.json({ message: "Verify your email to continue." }, { status: 403 });
    const membership = await membershipForUser(member.id);
    if (membership.state === "unavailable") return NextResponse.json({ message: "We couldn’t check your membership. Please try again." }, { status: 503 });
    const includeMembership = membership.state !== "active-test";
    if (includeMembership && body?.acceptRenewal !== true) return NextResponse.json({ message: "Confirm the annual membership renewal terms." }, { status: 400 });
    const stripe = getStripe();
    const customerId = await billingCustomer(stripe, { id: member.id, email: member.email },{useProfileAddress:true});
    const url=await managedCheckout({slugs,membership:includeMembership,priceId:config.priceId,origin,userId:member.id,customerId});
    return NextResponse.json({ url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Card checkout failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ message: error instanceof Error && /already in checkout|has sold|previous checkout|being prepared|membership needs/.test(error.message)?error.message:"Checkout could not open. Please try again." }, { status: 409 });
  }
}
