import { getMember } from "../../../lib/member-session";
import Link from "next/link";
import { Check, ArrowLeft, ShieldCheck } from "lucide-react";
import { billingConfig } from "../../../lib/billing-config";
import CheckoutButton from "../../../components/club/CheckoutButton";
export const dynamic = "force-dynamic";
export const metadata = { title: "Join the club · Slab Supply Co." };
export default async function JoinPage({ searchParams }: { searchParams: Promise<{ canceled?: string }> }) {
  const { canceled } = await searchParams;
  const config = billingConfig();
  const member = await getMember();
  return <section className="section-shell club-enrollment"><div className="club-enrollment-copy"><Link className="club-back" href="/membership"><ArrowLeft size={14} /> Membership, explained</Link><p className="eyebrow">Your collection. Your club. Join today.</p><h1>Let’s collect<br /><em>better, together.</em></h1><p>One annual membership. More of the cards you love, with prices that make sense.</p><ul className="club-check-list"><li><Check /> Below-retail member pricing</li><li><Check /> Premium trade-in credit on eligible slabs</li><li><Check /> Monthly member drops and grail opportunities</li></ul><div className="club-quote">“Fair prices. Strong trade-ins. More room for the cards you love.”<Link href="/promise">The Slab Supply Co. promise</Link></div></div><div className="club-enrollment-card"><span className="club-badge">Founding annual membership</span><h2>A better way to collect.</h2><div className="club-price">$99<span>USD / year</span></div><p className="club-renewal">Annual subscription. Renews at $99 USD each year until canceled. Card purchases are separate.</p><div className="club-summary-line"><span>Membership</span><strong>$99.00 / year</strong></div>{canceled === "1" && <p className="club-notice" role="status">You left checkout before completing it. No membership was activated.</p>}<CheckoutButton ready={config.ready} signedIn={Boolean(member)} /><div className="club-enrollment-safe"><ShieldCheck size={17} /><p>Already a member? <Link href="/account">Manage your membership</Link> instead of subscribing again.</p></div><Link className="club-text-link" href="/membership/terms">Renewal & cancellation details</Link></div></section>;
}
