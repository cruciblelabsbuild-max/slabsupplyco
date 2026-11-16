import { redirect } from "next/navigation";
import { membershipForUser } from "../../../lib/member-subscription";
import { getMember } from "../../../lib/member-session";
import Link from "next/link";
import { Check, ArrowLeft } from "lucide-react";
import { billingConfig } from "../../../lib/billing-config";
import CheckoutButton from "../../../components/club/CheckoutButton";
export const dynamic = "force-dynamic";
export const metadata = { title: "Become a member · Slab Supply Co." };
export default async function JoinPage({ searchParams }: { searchParams: Promise<{ canceled?: string; checkout?: string; identity?: string; next?: string }> }) {
  const { canceled, checkout, identity, next } = await searchParams;
  const config = billingConfig();
  const member = await getMember();
  if (member && (await membershipForUser(member.id)).state === "active-test") redirect(next === "trades" ? "/trade-ins#start-trade" : "/account");
  return <section className="section-shell club-enrollment"><div className="club-enrollment-copy"><Link className="club-back" href="/membership"><ArrowLeft size={14} /> Membership, explained</Link><p className="eyebrow">Your collection. Your membership.</p><h1>Let’s collect<br /><em>better, together.</em></h1><p>One annual membership. More of the cards you love, at affordable prices.</p><ul className="club-check-list"><li><Check /> Below-retail member pricing</li><li><Check /> Premium trade-in credit</li><li><Check /> Monthly grail drops</li></ul></div><div className="club-enrollment-card"><span className="club-badge">Founding annual membership</span><div className="club-price">$99<span>USD / year</span></div><p className="club-renewal">Annual subscription. Renews at $99 USD each year until canceled. Card purchases are separate.</p><div className="club-summary-line"><span>Membership</span><strong>$99.00 / year</strong></div>{canceled === "1" && <p className="club-notice" role="status">You left checkout before completing it. No membership was activated.</p>}<CheckoutButton key={identity || "enroll"} ready={config.ready} signedIn={Boolean(member)} autoContinue={checkout === "continue"} next={next === "trades" ? "trades" : undefined} identity={identity === "sign-in" || identity === "sign-up" ? identity : undefined} /><Link className="club-text-link" href="/membership/terms">Renewal & cancellation details</Link></div></section>;
}
