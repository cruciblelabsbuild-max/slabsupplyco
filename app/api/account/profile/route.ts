import { clerkClient } from "@clerk/nextjs/server";
import { getMember } from "../../../../lib/member-session";
import { parseMemberProfile } from "../../../../lib/member-profile";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const member = await getMember();
  if (!member) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (Number(request.headers.get("content-length") || 0) > 5000) return Response.json({ error: "Profile details are too large." }, { status: 413 });
  let profile;
  try { profile = parseMemberProfile(await request.json()); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Check your details." }, { status: 400 }); }
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(member.id, { privateMetadata: { memberProfile: profile } });
    return Response.json({ saved: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Your changes could not be saved. Please try again." }, { status: 503 }); }
}
