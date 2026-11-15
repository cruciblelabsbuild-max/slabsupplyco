import { requireMember } from "../../../../lib/member-session";
import Link from "next/link";
import { ArrowRight, CreditCard, FileText, CalendarCheck, LockKeyhole } from "lucide-react";
import { billingConfig } from "../../../../lib/billing-config";
export const dynamic = "force-dynamic";
export const metadata = { title: "My membership · Slab Supply Co." };
export default async function AccountPage() {
  await requireMember();
  const { portalUrl } = billingConfig();
  return <><section className="club-page-intro section-shell"><p className="eyebrow">My membership</p><h1>Your club.<br /><em>On your terms.</em></h1><p>Keep your membership in order, then get back to the collection.</p></section><section className="section-shell club-account-grid club-section-bottom"><div className="club-panel"><span className="club-icon"><LockKeyhole size={25} /></span><h2>Manage your membership.</h2><p>Use the email address from checkout. Stripe emails you a secure login link—no extra password to remember.</p>{portalUrl ? <><a className="button" href={portalUrl}>Manage billing <ArrowRight size={16} /></a></> : <div className="club-notice"><p><strong>Billing is unavailable.</strong> No billing portal is connected. Check My account for your verified membership status.</p></div>}<Link className="club-text-link" href="/help">Need a hand?</Link></div><div className="club-account-features">{[{ icon: CreditCard, title: "Payment details", text: "Update the card used for your annual renewal." }, { icon: FileText, title: "Invoices & receipts", text: "View your membership billing history in one place." }, { icon: CalendarCheck, title: "Renewal & cancellation", text: "Review your renewal date and turn off renewal through the billing portal." }].map(({ icon: Icon, title, text }) => <article key={title}><Icon size={22} /><div><h3>{title}</h3><p>{text}</p></div></article>)}<p className="club-footnote">Manage payments, invoices, and renewal here.</p></div></section></>;
}
