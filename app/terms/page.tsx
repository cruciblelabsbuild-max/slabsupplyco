import Link from "next/link";
import { ClubHeader } from "../../components/club/ClubShell";

export default function TermsPage() {
  return <main className="legal-page">
    <ClubHeader />
    <article className="legal-content">
      <p className="eyebrow">Early-access document</p><h1>Terms of use</h1><p className="updated">Working draft · November 14, 2026</p>
      <p className="draft-notice"><b>Before public launch:</b> this draft should be replaced or approved by counsel and completed with the operating entity, governing law, dispute terms, contact details, and final membership and trade-in policies.</p>
      <h2>Early-access status</h2><p>Joining the list does not create a membership, reserve inventory, guarantee access, establish a launch date, or require either party to complete a transaction.</p>
      <h2>No payment or purchase</h2><p>The site does not currently accept real membership fees or card purchases. A test-only Stripe subscription flow may be available for evaluation; it creates no live membership or inventory entitlement. Any displayed card, value, member price, membership price, or benefit is part of the early-access presentation and may change before an actual offer is made.</p>
      <h2>Membership</h2><p>Annual membership is $99 USD per year, with recurring billing and cancellation managed through Stripe. During this phase, only test payments are supported. Review the <Link href="/membership/terms">renewal and cancellation details</Link> before checkout.</p>
      <h2>Trade-in interest</h2><p>A trade-in interest submission is not a quote, appraisal, acceptance, or agreement to buy. If a quote is later issued, separate written terms will govern eligibility, shipping, inspection, authenticity, value, store credit, expiration, rejection, and returns.</p>
      <h2>Market references</h2><p>Card markets change. Reference values may use recent completed sales, grade, grading company, card and slab condition, liquidity, and demand. They are not investment advice, appraisals, or guarantees of resale value.</p>
      <h2>Acceptable use</h2><p>Do not submit false information, attempt to interfere with the site, evade spam controls, misrepresent ownership or authenticity, or use the site in violation of law.</p>
      <h2>Intellectual property and affiliation</h2><p>Slab Supply Co. is independent. It is not affiliated with or endorsed by Nintendo, The Pokémon Company, Game Freak, Creatures, or any grading company. Third-party names and marks belong to their respective owners and are used only to identify collectible products or services.</p>
      <h2>Changes and contact</h2><p>These terms may change as the service develops. A verified legal contact must be added before launch: <b>[legal contact to be added]</b>.</p>
    </article>
  </main>;
}
