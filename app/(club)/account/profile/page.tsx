import SupportLink from "../../../../components/club/SupportLink";
import {getTrade} from "../../../../lib/trades/store";
import {validId} from "../../../../lib/trades/model";
import ProfileMembership from "../../../../components/club/ProfileMembership";
import { ProfileSignOut } from "../../../../components/club/ClubShell";
import { membershipForUser } from "../../../../lib/member-subscription";
import { billingConfig } from "../../../../lib/billing-config";
import PaymentCard, { type SavedPaymentCard } from "../../../../components/club/PaymentCard";
import { savedPaymentCards } from "../../../../lib/member-payment";
import { getStripe } from "../../../../lib/stripe";
import AccountSettings from "../../../../components/club/AccountSettings";
import { clerkClient } from "@clerk/nextjs/server";
import { requireMember } from "../../../../lib/member-session";
import { emptyProfile, parseMemberProfile } from "../../../../lib/member-profile";
export const dynamic = "force-dynamic";
export const metadata = { title: "Account settings · Slab Supply Co.", robots: { index: false, follow: false } };
export default async function ProfilePage({searchParams}:{searchParams:Promise<{trade?:string}>}) {
  const member = await requireMember();
  const membership = await membershipForUser(member.id);
  const {portalUrl} = billingConfig();
  const user = await (await clerkClient()).users.getUser(member.id);
  let profile = {...emptyProfile,collectingFocus:typeof user.privateMetadata.collectingFocus==="string"?user.privateMetadata.collectingFocus.slice(0,160):""};
  try { const saved=user.privateMetadata.memberProfile;if(saved&&typeof saved==="object"&&!Array.isArray(saved)) profile = parseMemberProfile({collectingFocus:profile.collectingFocus,...saved}); } catch { /* Invalid legacy data is never rendered. */ }
  const query=await searchParams;let returnTradeId:string|undefined;
  if(validId(query.trade)){try{const trade=await getTrade(query.trade,member.id);returnTradeId=trade.id;const address=trade.shipping?.address;if(!profile.shipping.line1&&address)profile={...profile,shipping:{recipient:address.name||"",line1:address.line1||"",line2:address.line2||"",city:address.city||"",region:address.region||"",postalCode:address.postalCode||"",country:"US"}};}catch{/* Only owned trades can be resumed. */}}
  let cards: SavedPaymentCard[] = [];
  let paymentUnavailable = false;
  if (typeof user.privateMetadata.stripeTestCustomerId === "string") { try { cards = await savedPaymentCards(getStripe(),user.privateMetadata.stripeTestCustomerId,member.id); } catch { paymentUnavailable = true; } }
  return <section className="section-shell profile-page"><header className="profile-page-heading"><h1>Account settings</h1><div className="profile-identity-summary"><strong>{[user.firstName,user.lastName].filter(Boolean).join(" ")||member.name}</strong><span>{member.email}</span></div></header><AccountSettings profile={profile} returnTradeId={returnTradeId} membership={<ProfileMembership renewsAt={membership.renewsAt} activeUntil={membership.activeUntil} state={membership.state} portalUrl={portalUrl} hasBilling={typeof user.privateMetadata.stripeTestCustomerId === "string"}/>} payment={<PaymentCard cards={cards} unavailable={paymentUnavailable}/>}/><SupportLink category="members"/><ProfileSignOut/></section>;
}
