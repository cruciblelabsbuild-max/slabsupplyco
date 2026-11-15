import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Logo from "../Logo";

export const metadata: Metadata = {
  title: "The Slab Supply Co. Promise",
  description: "Why Slab Supply Co. is building a fairer buying club for graded-card collectors.",
};

const principles = [
  {
    number: "01",
    title: <>Collectors first.<br />Always.</>,
    body: "The hobby should be fun, welcoming, and accessible. Whether you’re chasing your first PSA 10 or completing a vintage collection, you deserve the same respect and fair treatment.",
  },
  {
    number: "02",
    title: <>Fair prices.<br />Fair margins.</>,
    body: "We don’t need to maximize profit on every card. Our membership model lets us operate on leaner card margins and pass more value back to collectors.",
  },
  {
    number: "03",
    title: <>Transparency is<br />non-negotiable.</>,
    body: "No inflated comparison prices or misleading discounts. Members should understand how we value cards, what they’re paying, and what they’re getting.",
  },
  {
    number: "04",
    title: <>For collectors.<br />Not scalpers.</>,
    body: "Limited drops should reward the community—not automated bots or bulk buyers. Fair purchase limits and transparent allocations give more members a real chance.",
  },
];

export default function PromisePage() {
  return <main className="promise-page">
    <div className="promise-page-nav">
      <header className="site-header">
        <Logo />
        <Link className="text-button" href="/"><ArrowLeft size={15} /> Back to the club</Link>
      </header>
    </div>

    <section className="promise-page-hero">
      <div className="section-shell promise-page-hero-inner">
        <p className="eyebrow">The Slab Supply Co. Promise</p>
        <h1>A better way<br /><em>to collect.</em></h1>
        <p>We love this hobby. We just think it could be a little fairer.</p>
        <div className="promise-page-seal" aria-hidden="true"><i /><b>✦</b><span>COLLECTORS<br />FIRST</span></div>
      </div>
    </section>

    <section className="promise-letter section-shell">
      <div className="promise-letter-copy">
        <p>Somewhere along the way, collecting started feeling more like competing. Inflated prices, manufactured hype, scalpers, and the feeling that every transaction has to be a negotiation.</p>
        <p>We think there’s a better way.</p>
        <p>Slab Supply Co. is being built on a simple idea: <strong>when collectors come together, everyone should get a better deal.</strong></p>
        <p>Like a wholesale club for the hobby we love, we believe in fair margins, transparent pricing, and putting the value back into our members’ hands.</p>
        <p>That means great prices on cards worth collecting. Fair offers on cards you’re ready to trade. And a community where the excitement comes from the collection, not the markup.</p>
        <p>We’re not here to squeeze every dollar out of every slab.</p>
        <p><strong>We’re here to make collecting more rewarding.</strong></p>
      </div>
      <aside className="promise-thesis">
        <span>The model</span>
        <blockquote>Your membership helps us make money differently—so we can sell cards differently.</blockquote>
        <p>We’re not promising every card will always be the cheapest. We’re building a business where the way Slab Supply Co. makes money is aligned with helping members get more from the hobby.</p>
      </aside>
    </section>

    <section className="promise-page-principles">
      <div className="section-shell">
        <div className="promise-principles-heading">
          <p className="eyebrow">Our principles</p>
          <h2>What we believe.<br /><em>How we’ll operate.</em></h2>
        </div>
        <div className="promise-principles-grid">
          {principles.map((principle) => <article key={principle.number}>
            <span>{principle.number}</span>
            <h3>{principle.title}</h3>
            <p>{principle.body}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="promise-page-close">
      <div className="promise-close-orbit" aria-hidden="true" />
      <div className="section-shell">
        <p className="eyebrow">The promise, simply</p>
        <h2>More collecting.<br /><em>Less markup.</em></h2>
        <p>Join the founding list and help shape a club built around collectors.</p>
        <Link className="button button-light" href="/#join">Join early access <ArrowRight size={16} /></Link>
      </div>
    </section>
  </main>;
}
