import { clerkClient } from "@clerk/nextjs/server";
import { getMember } from "../../../../lib/member-session";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const member = await getMember();
  if (!member) return Response.json({ error: "Sign in required" }, { status: 401 });
  try {
    if (Number(request.headers.get("content-length") || 0) > 2000) return Response.json({ error: "Request too large" }, { status: 413 });
    const body = await request.json() as Record<string, unknown>;
    const interest = typeof body.interest === "string" && ["buying", "trading", "both"].includes(body.interest) ? body.interest : "";
    const collectingFocus = typeof body.collectingFocus === "string" ? body.collectingFocus.trim().slice(0, 160) : "";
    const client = await clerkClient();
    await client.users.updateUserMetadata(member.id, { privateMetadata: { collectingInterest: interest, collectingFocus, marketingConsent: body.consent === true } });
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "Preferences could not be saved" }, { status: 503 }); }
}
