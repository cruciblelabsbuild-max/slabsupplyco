import Link from "next/link";
import { clerkClient } from "@clerk/nextjs/server";
import { requireMember } from "../../../../lib/member-session";
import { emptyProfile, parseMemberProfile } from "../../../../lib/member-profile";
import MemberProfileForm from "../../../../components/club/MemberProfileForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your profile · Slab Supply Co.", robots: { index: false, follow: false } };
export default async function ProfilePage() {
  const member = await requireMember();
  const user = await (await clerkClient()).users.getUser(member.id);
  let profile = emptyProfile;
  try { if (user.privateMetadata.memberProfile) profile = parseMemberProfile(user.privateMetadata.memberProfile); } catch { /* Invalid legacy data is never rendered. */ }
  return <section className="section-shell club-section-bottom"><div className="club-page-intro"><p className="eyebrow">Your profile</p><h1>A little more<br/><em>you.</em></h1><p>Your collecting preferences and shipping details, in one place.</p><Link className="club-text-link" href="/account/security">Email, password & sign-in security →</Link></div><MemberProfileForm initialProfile={profile}/></section>;
}
