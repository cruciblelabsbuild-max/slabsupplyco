import Link from "next/link";
import {CardBagBadge} from "../../../../components/club/BagProvider";
import CardPricing from "../../../../components/CardPricing";
import BuyCardButton from "../../../../components/club/BuyCardButton";
import { memberSelection } from "../../../../lib/member-selection";
import { getMember } from "../../../../lib/member-session";
import { membershipForUser } from "../../../../lib/member-subscription";
import GradedCardImage from "../../../../components/club/GradedCardImage";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, Package, ShieldCheck } from "lucide-react";
import { catalog, dollars } from "../../../../lib/catalog";
export const dynamic = "force-dynamic";
const availableCards = () => [...catalog, ...memberSelection];
export function generateStaticParams() { return catalog.map(card => ({ slug: card.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return { title: `${availableCards().find(card => card.slug === slug)?.name || "Card"} · Slab Supply Co.` }; }
export default async function CardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = availableCards().find(card => card.slug === slug);
  if (!card) notFound();
  const member = "grader" in card ? await getMember() : null;
  const hasAccess = Boolean(member && (await membershipForUser(member.id)).state === "active-test");
  if ("grader" in card) return <div className="section-shell club-section-bottom"><Link className="club-back" href="/shop"><ArrowLeft size={14} /> Back to member deals</Link><div className="club-detail selection-detail"><div className="club-detail-art"><CardBagBadge slug={card.slug}/><GradedCardImage image={card.image} name={card.name} grade={card.grade} grader={card.grader} eager /></div><div className="club-detail-copy"><p className="eyebrow">{card.year} · {card.set}</p><h1>{card.name}</h1><span className="club-grade"><BadgeCheck size={15} /> {card.grade}</span><CardPricing retail={dollars(card.retail)} member={dollars(card.member)} savings={dollars(card.retail-card.member)}/><BuyCardButton slug={card.slug} hasAccess={hasAccess}/><Link className="club-text-link" href="/shop">Continue browsing</Link></div></div></div>;
  return <div className="section-shell club-section-bottom"><Link className="club-back" href="/shop"><ArrowLeft size={14} /> Back to member deals</Link><div className="club-detail"><div className="club-detail-art"><span className="club-badge">Reference example</span><img src={card.image} alt={`${card.year} ${card.name}, ${card.grade}`} /></div><div className="club-detail-copy"><p className="eyebrow">{card.year} · {card.set}</p><h1>{card.name}</h1><span className="club-grade"><BadgeCheck size={15} /> {card.grade}</span><p className="club-detail-description">{card.description}</p><div className="club-detail-pricing"><span>Example member price</span><strong>{dollars(card.member)}</strong><p>Reference retail {dollars(card.retail)} <b>· {dollars(card.retail - card.member)} in savings</b></p></div><p className="club-detail-note">This is a shelf preview, not a card available to purchase. This reference example has no purchase or reservation option.</p><Link className="button club-wide" href="/drops">View grail releases <ArrowRight size={16} /></Link><Link className="club-text-link" href="/trade-ins">Trade toward your next card</Link><div className="club-assurances"><span><ShieldCheck size={17} /> Professionally graded examples</span><span><Package size={17} /> Shipping details with each live listing</span></div></div></div><div className="club-detail-facts"><div><span>Set</span><strong>{card.set}</strong></div><div><span>Year</span><strong>{card.year}</strong></div><div><span>Grade</span><strong>{card.grade}</strong></div><div><span>Collection</span><strong>{card.category}</strong></div></div></div>;
}
