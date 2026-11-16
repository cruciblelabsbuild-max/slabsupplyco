import {JoinBagSummary} from "../../../components/club/BagCheckout";
import {purchaseCard} from "../../../lib/card-checkout";
import CardPricing from "../../../components/CardPricing";
import {dollars} from "../../../lib/catalog";
import { annualMembership } from "../../../lib/membership-plan";
import { redirect } from "next/navigation";
import { membershipForUser } from "../../../lib/member-subscription";
import { getMember } from "../../../lib/member-session";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { billingConfig } from "../../../lib/billing-config";
import { enrollmentArrivalUrl } from "../../../lib/member-arrival";
import CheckoutButton from "../../../components/club/CheckoutButton";
export const dynamic = "force-dynamic";
export const metadata = { title: "Become a member · Slab Supply Co." };
export default async function JoinPage({ searchParams }: { searchParams: Promise<{ canceled?: string; checkout?: string; identity?: string; next?: string;card?:string;bag?:string }> }) {
  const { canceled, checkout, identity, next, card:cardSlug,bag } = await searchParams;
  const card=purchaseCard(cardSlug);
  const config = billingConfig();
  const member = await getMember();
  if (member && (await membershipForUser(member.id)).state === "active-test") redirect(bag==="1"?"/checkout?bag=1&continue=1":card?`/checkout?card=${card.slug}&continue=1`:checkout === "continue" ? enrollmentArrivalUrl(next) : next === "trades" ? "/trade-ins#start-trade" : "/account");
  return <section className="section-shell club-enrollment"><div className="club-enrollment-copy"><Link className="club-back" href="/membership"><ArrowLeft size={14} /> Membership, explained</Link><h1>You’re one step away<br /><em>from better collecting.</em></h1></div><div className="club-enrollment-card">{bag==="1"&&<JoinBagSummary/>}{card && <div className="join-card-selection"><img src={card.image} alt={card.name}/><div><p className="eyebrow">Your card · {card.grade}</p><h2>{card.name}</h2><CardPricing retail={dollars(card.retail)} member={dollars(card.member)} savings={dollars(card.retail-card.member)}/></div></div>}<span className="club-badge">Founding annual membership</span><div className="club-price">{annualMembership.display}<span>USD / year</span></div><p className="club-renewal">Annual subscription. Renews at {annualMembership.display} USD each year until canceled. {card?"Your card is a one-time purchase.":"Card purchases are separate."}</p><div className="club-summary-line"><span>Membership</span><strong>{annualMembership.display}.00 / year</strong></div>{canceled === "1" && <p className="club-notice" role="status">You left checkout before completing it. No membership was activated.</p>}{card && <div className="join-card-total"><span>Today’s total <small>Card + annual membership</small></span><strong>{dollars(card.member+annualMembership.amount)}</strong></div>}<CheckoutButton card={bag==="1"?"bag":card?.slug} key={identity || "enroll"} ready={config.ready} signedIn={Boolean(member)} autoContinue={checkout === "continue"} next={next === "trades" ? "trades" : undefined} identity={identity === "sign-in" || identity === "sign-up" ? identity : undefined} /><Link className="club-text-link" href="/membership/terms">Renewal & cancellation details</Link></div></section>;
}
