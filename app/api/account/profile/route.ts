import {memberShippingAddress} from "../../../../lib/shipping/member-details";
import {after} from "next/server";
import {profileAddressDetails} from "../../../../lib/shipping/config";
import {refreshMemberTradeAddresses} from "../../../../lib/shipping/profile-address";
import {reconcileShipping} from "../../../../lib/shipping/service";
import { clerkClient } from "@clerk/nextjs/server";
import { getMember } from "../../../../lib/member-session";
import { parseMemberProfile } from "../../../../lib/member-profile";
export const maxDuration=300;
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const member = await getMember();
  if (!member) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (Number(request.headers.get("content-length") || 0) > 5000) return Response.json({ error: "Profile details are too large." }, { status: 413 });
  let profile;let savingAddress=false;
  try { const body=await request.json();profile = parseMemberProfile(body);savingAddress=!!body&&typeof body==="object"&&"section" in body&&body.section==="shipping";if(savingAddress&&profile.shipping.line1)memberShippingAddress(profileAddressDetails(profile)); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Check your details." }, { status: 400 }); }
  try {
    const client = await clerkClient();
    const previous=await client.users.getUser(member.id);
    const changed=JSON.stringify(profileAddressDetails(previous.privateMetadata.memberProfile))!==JSON.stringify(profileAddressDetails(profile));
    await client.users.updateUserMetadata(member.id, { privateMetadata: { memberProfile: profile } });
    const trades=changed||savingAddress?await refreshMemberTradeAddresses(member.id,profileAddressDetails(profile)):[];
    after(async()=>{for(const id of trades){try{await reconcileShipping(id);}catch{/* The durable queue retries shipping. */}}});
    return Response.json({ saved: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Your changes could not be saved. Please try again." }, { status: 503 }); }
}
