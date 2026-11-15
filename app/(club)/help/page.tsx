import Link from "next/link";
import { ArrowRight } from "lucide-react";
import InquiryForm from "../../../components/club/InquiryForm";
export const metadata = { title: "A little help · Slab Supply Co." };
const questions = [
  ["How do I become a member?", "Choose Become a member and complete enrollment. Checkout currently runs in test mode and does not charge real money."],
  ["Are the cards on the shelf available?", "The collection contains reference examples. No cards are available to purchase."],
  ["How does the $99 annual membership work?", "The intended plan is one annual subscription. Cards are purchased separately. Membership is designed to include member pricing, trade-in opportunities, and monthly drops; it does not reserve a specific card."],
  ["How do I manage renewal?", "Stripe’s billing portal handles payment details, invoices, renewal dates, and cancellation. Open My membership and use the email address from checkout."],
  ["Does submitting a trade-in commit me to anything?", "No. Interest is not a quote or an agreement to sell. Review and accept a written offer before shipping anything."],
  ["Where are shipping and return policies?", "Card purchases are not open. Shipping costs, dispatch expectations, return eligibility, and inspection terms must be published with live listings before orders can be placed."],
];
export default function HelpPage() {
  return <><section className="club-page-intro section-shell"><p className="eyebrow">A little help, from the club</p><h1>Good questions.<br /><em>Straight answers.</em></h1><p>Membership, the shelf, or a card on your mind. Start here—or send us a note.</p></section><section className="section-shell club-help-layout club-section-bottom"><div><div className="club-help-links"><Link href="/account">Manage membership <ArrowRight size={17} /></Link><Link href="/trade-ins">Talk trade-ins <ArrowRight size={17} /></Link><Link href="/membership/terms">Renewal & cancellation <ArrowRight size={17} /></Link></div><div className="club-faq">{questions.map(([q, a]) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></div><div className="club-panel"><p className="eyebrow">Collector to collector</p><h2>What’s on your mind?</h2><p>Tell us what you need. Please keep payment details and sensitive information out of your note.</p>{Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_D1_DATABASE_ID && process.env.CLOUDFLARE_D1_API_TOKEN) && <InquiryForm kind="note" />}</div></section></>;
}
