import ProfileMembership from "../../../../components/club/ProfileMembership";
import { ProfileSignOut } from "../../../../components/club/ClubShell";
import { membershipForUser } from "../../../../lib/member-subscription";
import { billingConfig } from "../../../../lib/billing-config";
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
  const membership = await membershipForUser(member.id);
  const {portalUrl} = billingConfig();
  const user = await (await clerkClient()).users.getUser(member.id);
  let profile = emptyProfile;
  try { if (user.privateMetadata.memberProfile) profile = parseMemberProfile(user.privateMetadata.memberProfile); } catch { /* Invalid legacy data is never rendered. */ }
  let cards: SavedPaymentCard[] = [];
  let paymentUnavailable = false;
  if (typeof user.privateMetadata.stripeTestCustomerId === "string") { try { cards = await savedPaymentCards(getStripe(),user.privateMetadata.stripeTestCustomerId,member.id); } catch { paymentUnavailable = true; } }
  return <section className="section-shell profile-page"><header className="profile-page-heading"><h1>Your profile.</h1><div className="profile-identity-summary"><strong>{user.firstName} {user.lastName}</strong><span>{member.email}</span><a href="#security">Edit name & sign-in</a></div></header><nav className="profile-section-nav" aria-label="Profile sections"><a href="#membership">Membership</a><a href="#preferences">Collecting</a><a href="#shipping">Shipping</a><a href="#payment">Payment</a><a href="#security">Sign-in & security</a></nav><div className="profile-sheet"><ProfileMembership state={membership.state} portalUrl={portalUrl} hasBilling={typeof user.privateMetadata.stripeTestCustomerId === "string"}/><MemberProfileForm initialProfile={profile}/><PaymentCard cards={cards} unavailable={paymentUnavailable}/><details id="security" className="profile-security"><summary><div><p className="eyebrow">Identity</p><h2>Name, email & security</h2></div><span>Manage</span></summary><UserProfile routing="hash"/></details></div><ProfileSignOut/></section>;
}
