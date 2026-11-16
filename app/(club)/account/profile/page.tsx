import PaymentCard, { type SavedPaymentCard } from "../../../../components/club/PaymentCard";
import { savedPaymentCards } from "../../../../lib/member-payment";
import { getStripe } from "../../../../lib/stripe";
import { UserProfile } from "@clerk/nextjs";
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
  let cards: SavedPaymentCard[] = [];
  let paymentUnavailable = false;
  if (typeof user.privateMetadata.stripeTestCustomerId === "string") { try { cards = await savedPaymentCards(getStripe(),user.privateMetadata.stripeTestCustomerId,member.id); } catch { paymentUnavailable = true; } }
  return <section className="section-shell club-section-bottom"><div className="club-page-intro"><p className="eyebrow">Your profile</p><h1>Your profile.</h1><p>Your collecting preferences and shipping details, in one place.</p></div><MemberProfileForm initialProfile={profile}/><PaymentCard cards={cards} unavailable={paymentUnavailable}/><section id="security" className="profile-security"><p className="eyebrow">04 / Identity & security</p><h2>Name, email & sign-in.</h2><UserProfile routing="hash"/></section></section>;
}
