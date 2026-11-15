import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { billingConfig, siteOrigin } from "../../../lib/billing-config";
import { createTestCheckout } from "../../../lib/test-checkout";
import { getStripe } from "../../../lib/stripe";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const config = billingConfig();
  if (!config.ready) return NextResponse.json({ message: "Membership enrollment is opening soon. You can join the free founding list in the meantime." }, { status: 503 });
  try {
    const origin = siteOrigin();
    // Prevent another website from creating checkout sessions on a visitor's behalf.
    if (request.headers.get("origin") !== origin) return NextResponse.json({ message: "Please start checkout from Slab Supply Co." }, { status: 403 });
    if (Number(request.headers.get("content-length") || 0) > 2000) return NextResponse.json({ message: "Request too large." }, { status: 413 });
    const body = await request.json() as { acceptRenewal?: unknown } | null;
    if (body?.acceptRenewal !== true) return NextResponse.json({ message: "Please confirm the annual renewal terms." }, { status: 400 });
    const stripe = getStripe();
    const priorKey = request.headers.get("idempotency-key");
    const key = priorKey && /^[a-f0-9-]{36}$/i.test(priorKey) ? priorKey : randomUUID();
    const url = await createTestCheckout(stripe, config.priceId, origin, key);
    return NextResponse.json({ url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Test checkout creation failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ message: "Checkout is unavailable just now. Please try again or join the free founding list." }, { status: 503 });
  }
}
