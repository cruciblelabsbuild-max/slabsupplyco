import { UserProfile } from "@clerk/nextjs";
import { requireMember } from "../../../../lib/member-session";
export const dynamic = "force-dynamic";
export const metadata = { title: "Account settings · Slab Supply Co.", robots: { index: false, follow: false } };
export default async function ProfilePage() {
  await requireMember();
  return <section className="section-shell club-section-bottom"><div className="club-page-intro"><p className="eyebrow">Your account</p><h1>Make yourself<br /><em>at home.</em></h1><p>Manage your profile, verified email, and sign-in security.</p></div><UserProfile routing="hash" /></section>;
}
