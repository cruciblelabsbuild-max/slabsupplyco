import type { Metadata } from "next";
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
        <a className="text-button" href="/"><ArrowLeft size={15} /> Back to the club</a>
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
        <span className="promise-letter-kicker">A note from the Slab Supply Co. team</span>
        <p>We started Slab Supply Co. because we love collecting—and because too much of the hobby has started to feel like a contest.</p>
        <p>We’ve watched inflated prices, manufactured hype, and scalpers turn a simple purchase into a negotiation. That isn’t the hobby we want to build around.</p>
        <p>We believe that when collectors come together, everyone should get a better deal. So we’re building the club we’d want to join ourselves.</p>
        <p>Membership lets us make money differently: through the strength of the club, not by squeezing the most possible margin out of every slab.</p>
        <p>That means great prices on cards worth collecting, fair offers on cards you’re ready to trade, and a community where the excitement comes from the collection—not the markup.</p>
        <p><strong>We’re here to make collecting more rewarding—for all of us.</strong></p>
        <span className="promise-signature">— The Slab Supply Co. team</span>
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
        <a className="button button-light" href="/#join">Join early access <ArrowRight size={16} /></a>
      </div>
    </section>
  </main>;
}
