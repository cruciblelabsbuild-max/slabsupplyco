import { requireMember } from "../../../../lib/member-session";
import Link from "next/link";
import { ArrowRight, Check, Clock3 } from "lucide-react";
import { checkoutStatus } from "../../../../lib/checkout-status";
import { getStripe } from "../../../../lib/stripe";
export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout status · Slab Supply Co.", robots: { index: false, follow: false } };
export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const member = await requireMember();
  const { session_id } = await searchParams;
  let paid = false;
  let pending = false;
  if (session_id && /^cs_test_[A-Za-z0-9_]{10,240}$/.test(session_id)) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id, { expand: ["subscription"] });
      const result = session.metadata?.clerk_user_id === member.id ? checkoutStatus(session) : { paid: false, pending: false };
      paid = result.paid;
      pending = result.pending;
    } catch { /* An invalid or unavailable session must never claim payment succeeded. */ }
  }
  return <section className="section-shell club-result"><span className="club-result-icon">{paid ? <Check size={35} /> : <Clock3 size={35} />}</span><p className="eyebrow">{paid ? "Checkout complete" : "Checkout status"}</p><h1>{paid ? <>Membership confirmed.<br /><em>Welcome to the club.</em></> : pending ? <>We’re checking<br /><em>your payment.</em></> : <>Let’s make sure<br /><em>you’re all set.</em></>}</h1><p>{paid ? "Stripe confirmed your payment and an active test subscription. No real money was charged and no live membership was created." : pending ? "Your checkout was submitted, but payment or subscription activation is still pending. Check your Stripe confirmation before trying again." : "We couldn’t confirm a completed checkout from this link. No membership status is being assumed. If you completed checkout, check your confirmation or contact us."}</p><div className="club-result-actions"><Link className="button" href="/account">Go to your club <ArrowRight size={16} /></Link><Link className="button club-button-outline" href="/shop">Browse member deals</Link></div><Link className="club-text-link" href="/help">Questions? We’re here to help.</Link></section>;
}
