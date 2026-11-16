import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireMember } from "../../../lib/member-session";
import { membershipForUser } from "../../../lib/member-subscription";
import { purchaseCard } from "../../../lib/card-checkout";
import { dollars } from "../../../lib/catalog";
import CardPricing from "../../../components/CardPricing";
import BuyCardButton from "../../../components/club/BuyCardButton";
export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout · Slab Supply Co.", robots: { index:false, follow:false } };
export default async function CardCheckout({searchParams}:{searchParams:Promise<{card?:string;continue?:string}>}) {
  const member=await requireMember();
  const params=await searchParams;
  const card=purchaseCard(params.card);
  if(!card)notFound();
  const membership=await membershipForUser(member.id);
  if(membership.state==="none")redirect(`/join?card=${card.slug}`);
  return <section className="section-shell card-checkout-review"><p className="eyebrow">Your selection</p><h1>{card.name}</h1><p>{card.grade}</p><img src={card.image} alt={card.name}/><CardPricing retail={dollars(card.retail)} member={dollars(card.member)} savings={dollars(card.retail-card.member)}/>{membership.state==="active-test"?<BuyCardButton slug={card.slug} hasAccess autoContinue={params.continue==="1"}/>:<p role="alert">We couldn’t check your membership. Please refresh to try again.</p>}<Link className="club-text-link" href="/shop">Back to member deals</Link></section>;
}
