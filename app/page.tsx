"use client";

import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Gem,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

const faqs = [
  {
    q: "Is Slab Supply affiliated with Pokémon, Nintendo, or The Pokémon Company?",
    a: "No. Slab Supply is an independent graded-card buying club and is not affiliated with, endorsed by, or sponsored by Nintendo, The Pokémon Company, Game Freak, or Creatures. Final trademark and domain clearance should be completed before commercial launch.",
  },
  {
    q: "Does ‘below retail’ mean every card will always be the cheapest online?",
    a: "The member price is set below the verified fair retail value established when a card is listed. That is different from promising the lowest price anywhere: card markets move, condition differs, and temporary marketplace listings can be lower.",
  },
  {
    q: "What does ‘up to 100% of fair retail value’ mean?",
    a: "Select, approved cards may receive a store-credit quote equal to the fair retail value we verify at the time of review. Other cards may receive a lower quote or no quote based on demand, liquidity, grade, slab condition, and current inventory needs.",
  },
  {
    q: "How will fair retail value be determined?",
    a: "We plan to use recent verified sold transactions from multiple reputable marketplaces, then account for grading company, grade, card and slab condition, sales velocity, and unusual outliers. Unsold asking prices alone will not establish value.",
  },
  {
    q: "Which cards and grading companies will be eligible?",
    a: "For early access, we are evaluating authenticated trading cards graded by recognized services such as PSA, CGC, and BGS. Exact eligibility will be confirmed before quotes open. Raw cards, altered cards, counterfeit items, and damaged or tampered slabs will not be eligible.",
  },
  {
    q: "Am I paying $99 when I join the waitlist?",
    a: "No. We are not accepting membership payments yet. $99/year is the founding annual price. You will see the full membership terms before making any purchase decision.",
  },
  {
    q: "What happens after I submit a trade-in interest form?",
    a: "It puts your collection in line for the trade-in desk. It is not a quote, acceptance, or commitment to buy. We’ll reach out when reviews open.",
  },
];

const graders = ["PSA", "CGC", "BGS", "Other / mixed"];

function Logo() {
  return (
    <a className="brand" href="#top" aria-label="Slab Supply home">
      <span className="wordmark"><span>Slab</span><i>·</i><span>Supply</span></span>
      <span className="brand-beta">Collectors’ club</span>
    </a>
  );
}

function track(event: string, metadata: Record<string, unknown> = {}) {
  const sessionKey = "pc_session";
  let sessionId = sessionStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(sessionKey, sessionId);
  }
  const body = JSON.stringify({ event, sessionId, path: location.pathname, metadata });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
  } else {
    fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => null);
  }
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [waitState, setWaitState] = useState<SubmitState>("idle");
  const [tradeState, setTradeState] = useState<SubmitState>("idle");
  const [waitMessage, setWaitMessage] = useState("");
  const [tradeMessage, setTradeMessage] = useState("");
  const [referralUrl, setReferralUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [referrer, setReferrer] = useState("");
  const waitStartedAt = useMemo(() => Date.now(), []);
  const waitStartedTracked = useRef(false);
  const [tradeStartedAt, setTradeStartedAt] = useState(Date.now());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReferrer((params.get("ref") || "").slice(0, 16));
    track("page_view", {
      ref: Boolean(params.get("ref")),
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
    });
  }, []);

  useEffect(() => {
    document.body.style.overflow = tradeOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [tradeOpen]);

  async function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWaitState("submitting");
    setWaitMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const params = new URLSearchParams(window.location.search);
    const payload = {
      firstName: data.get("firstName"),
      email: data.get("email"),
      interest: data.get("interest"),
      collectingFocus: data.get("collectingFocus"),
      company: data.get("company"),
      consent: data.get("consent") === "on",
      startedAt: waitStartedAt,
      referredBy: referrer,
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
    };

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { message?: string; referralUrl?: string };
      if (!response.ok) throw new Error(result.message || "We couldn’t save your spot. Please try again.");
      setWaitState("success");
      setWaitMessage(result.message || "You’re on the early-access list.");
      setReferralUrl(result.referralUrl || "");
      track("waitlist_submitted", { interest: payload.interest });
    } catch (error) {
      setWaitState("error");
      setWaitMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  async function submitTrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTradeState("submitting");
    setTradeMessage("");
    const data = new FormData(event.currentTarget);
    const payload = {
      firstName: data.get("firstName"),
      email: data.get("email"),
      grader: data.get("grader"),
      estimatedValue: data.get("estimatedValue"),
      timeframe: data.get("timeframe"),
      cardDetails: data.get("cardDetails"),
      company: data.get("company"),
      consent: data.get("consent") === "on",
      startedAt: tradeStartedAt,
    };

    try {
      const response = await fetch("/api/trade-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "We couldn’t save your interest. Please try again.");
      setTradeState("success");
      setTradeMessage(result.message || "Your trade-in interest is saved.");
      track("tradein_submitted", { grader: payload.grader, value: payload.estimatedValue });
    } catch (error) {
      setTradeState("error");
      setTradeMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  function openTrade() {
    setTradeStartedAt(Date.now());
    setTradeOpen(true);
    track("tradein_started");
  }

  async function copyReferral() {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    track("share_copied");
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareReferral() {
    if (navigator.share && referralUrl) {
      await navigator.share({
        title: "Slab Supply early access",
        text: "I joined the early-access list for a graded-card buying club built around member pricing and transparent trade-ins.",
        url: referralUrl,
      });
    } else {
      await copyReferral();
    }
  }

  function expressShelfInterest(label: string) {
    track("shelf_interest", { label });
    const input = document.querySelector<HTMLInputElement>('input[name="collectingFocus"]');
    if (input) input.value = label;
    document.getElementById("join")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <main id="top">
      <div className="announcement">
        <span>Founding access now open</span>
        <span className="announcement-rule" aria-hidden="true" />
        <span>Member pricing · Trade-in credit</span>
      </div>

      <header className="site-header">
        <Logo />
        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Primary navigation">
          <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#trade-ins" onClick={() => setMenuOpen(false)}>Trade-ins</a>
          <a href="#membership" onClick={() => setMenuOpen(false)}>Membership</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
        </nav>
        <a className="button button-small desktop-cta" href="#join">Join early access <ArrowRight size={15} /></a>
        <button className="menu-button" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section className="hero section-shell">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={14} /> A better club for graded-card collectors</p>
          <h1>A better way<br /><em>to collect.</em></h1>
          <p className="hero-lede">Shop graded cards below verified fair retail. Trade select slabs for up to full value in store credit. One membership, built around the collection.</p>
          <div className="hero-points" aria-label="Core benefits">
            <span><Check size={16} /> Member pricing below verified retail value</span>
            <span><Check size={16} /> Up to 100% of approved fair retail value in store credit</span>
          </div>
          <p className="fine-print">Founding membership · $99/year · Free to join the list</p>
        </div>

        <div className="hero-visual" aria-label="Curated graded card display">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="slab slab-back">
            <div className="slab-label"><span>ARCHIVE</span><b>SPECIMEN 02</b><small>SLAB SUPPLY</small></div>
            <div className="card-art art-two"><span>02</span></div>
          </div>
          <div className="slab slab-front">
            <div className="slab-label"><span>ARCHIVE</span><b>SPECIMEN 01</b><small>SLAB SUPPLY</small></div>
            <div className="card-art art-one"><span className="art-star">✦</span><b>FIRST EDITION</b><small>MEMBER SHELF</small></div>
            <div className="slab-bottom"><span>Member example</span><b>$148</b><small>verified retail: $172</small></div>
          </div>
          <span className="visual-note">The member shelf, reimagined</span>
        </div>

        <div className="join-card" id="join">
          {waitState === "success" ? (
            <div className="success-panel" role="status">
              <span className="success-icon"><Check /></span>
              <p className="eyebrow">You’re in</p>
              <h2>Welcome to the first edition.</h2>
              <p>{waitMessage}</p>
              {referralUrl && (
                <div className="share-box">
                  <p><b>Know another collector?</b><br />Share your personal early-access link.</p>
                  <div className="share-actions">
                    <button type="button" onClick={copyReferral}><Copy size={15} /> {copied ? "Copied" : "Copy link"}</button>
                    <button type="button" onClick={shareReferral}>Share <ArrowRight size={15} /></button>
                  </div>
                </div>
              )}
              <button className="text-button" type="button" onClick={openTrade}>I also have cards to trade <ArrowRight size={15} /></button>
            </div>
          ) : (
            <form onSubmit={submitWaitlist} onFocus={() => { if (!waitStartedTracked.current) { waitStartedTracked.current = true; track("waitlist_started"); } }}>
              <p className="eyebrow">Founding list</p>
              <h2>Get first access.</h2>
              <p>Get first access to member drops and the trade-in desk.</p>
              <div className="field-row">
                <label><span>First name</span><input name="firstName" autoComplete="given-name" maxLength={60} placeholder="Avery" required /></label>
                <label><span>Email</span><input name="email" type="email" autoComplete="email" maxLength={160} placeholder="avery@example.com" required /></label>
              </div>
              <fieldset className="interest-choice">
                <legend>I’m most interested in</legend>
                <label><input type="radio" name="interest" value="buying" required /><span>Buying</span></label>
                <label><input type="radio" name="interest" value="trading" /><span>Trading in</span></label>
                <label><input type="radio" name="interest" value="both" /><span>Both</span></label>
              </fieldset>
              <label className="full-field"><span>What do you collect? <i>Optional</i></span><input name="collectingFocus" maxLength={160} placeholder="Vintage, modern, a favorite era…" /></label>
              <label className="honeypot" aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
              <label className="consent"><input type="checkbox" name="consent" required /><span>I agree to receive early-access updates. I can unsubscribe anytime.</span></label>
              <button className="button submit-button" disabled={waitState === "submitting"} type="submit">
                {waitState === "submitting" ? "Saving your spot…" : <>Join early access <ArrowRight size={17} /></>}
              </button>
              {waitMessage && <p className="form-message error" role="alert">{waitMessage}</p>}
              <p className="form-footnote">Free to join the list. No payment or purchase commitment.</p>
            </form>
          )}
        </div>
      </section>

      <section className="principle-strip" aria-label="Our operating principles">
        <span>Verified market values</span><i>✦</i><span>Below-retail member pricing</span><i>✦</i><span>Human-reviewed trade-ins</span><i>✦</i><span>Clear terms before checkout</span>
      </section>

      <section className="shelf-section" id="sample-shelf">
        <div className="section-shell">
          <div className="shelf-heading">
            <div><p className="eyebrow">On the member shelf</p><h2>Cards worth collecting.<br /><em>Prices worth joining for.</em></h2></div>
            <p>Vintage icons and modern illustration rares, curated for the member shelf.</p>
          </div>
          <div className="shelf-grid">
            <article className="shelf-card">
              <div className="shelf-art"><img src="/cards/snorlax-psa9.jpg" alt="1999 Jungle Snorlax holo graded PSA 9" /><span className="shelf-badge">Founding selection</span></div>
              <div className="shelf-meta"><span className="shelf-kicker">1999 · Vintage holo · PSA 9</span><h3>Jungle Snorlax #11</h3><div className="shelf-pricing"><span>Verified retail<s>$700</s></span><span>Member price<b>$595</b></span></div></div>
              <button className="button button-outline" type="button" onClick={() => expressShelfInterest("Vintage holos like 1999 Jungle Snorlax")}>Get member access <ArrowRight size={15} /></button>
            </article>
            <article className="shelf-card">
              <div className="shelf-art"><img src="/cards/lugia-psa8.jpg" alt="2000 Neo Genesis Lugia holo graded PSA 8" /><span className="shelf-badge">Founding selection</span></div>
              <div className="shelf-meta"><span className="shelf-kicker">2000 · Neo-era holo · PSA 8</span><h3>Neo Genesis Lugia #9</h3><div className="shelf-pricing"><span>Verified retail<s>$1,550</s></span><span>Member price<b>$1,395</b></span></div></div>
              <button className="button button-outline" type="button" onClick={() => expressShelfInterest("Neo-era holos like 2000 Neo Genesis Lugia")}>Get member access <ArrowRight size={15} /></button>
            </article>
            <article className="shelf-card">
              <div className="shelf-art"><img src="/cards/charizard-151-psa10.jpg" alt="2023 151 Charizard ex special illustration graded PSA 10" /><span className="shelf-badge">Founding selection</span></div>
              <div className="shelf-meta"><span className="shelf-kicker">2023 · Special illustration · PSA 10</span><h3>151 Charizard ex #199</h3><div className="shelf-pricing"><span>Verified retail<s>$1,275</s></span><span>Member price<b>$1,084</b></span></div></div>
              <button className="button button-outline" type="button" onClick={() => expressShelfInterest("Modern special illustrations like 2023 151 Charizard ex")}>Get member access <ArrowRight size={15} /></button>
            </article>
          </div>
          <p className="shelf-note">Market reference snapshot: November 14, 2026. Values are rounded from aggregated completed-sale data from <a href="https://www.pricecharting.com/game/pokemon-jungle/snorlax-11" target="_blank" rel="noreferrer">PriceCharting</a> and <a href="https://slabline.ai/cards/2023-scarlet-violet-151-charizard-ex-199-psa-10" target="_blank" rel="noreferrer">Slabline</a>. Exact grades, copies, and values vary by drop.</p>
        </div>
      </section>

      <section className="section-shell how-section" id="how">
        <div className="section-heading">
          <p className="eyebrow">The model</p>
          <h2>Better buys.<br /><em>Better trades.</em></h2>
        </div>
        <div className="benefit-grid">
          <article className="benefit-card dark-card">
            <span className="card-number">01</span>
            <div className="benefit-icon"><Gem /></div>
            <h3>Buy below verified retail</h3>
            <p>Members get access to approved graded cards priced below our documented fair retail value at the time they’re offered.</p>
            <ul>
              <li><Check size={15} /> Value anchored in recent sold data</li>
              <li><Check size={15} /> Clear member price and reference value</li>
              <li><Check size={15} /> Market reference refreshed when the card is offered</li>
            </ul>
            <div className="mini-price">
              <span><small>Verified fair retail</small><s>$172</s></span>
              <ArrowDownRight />
              <span><small>Member price</small><b>$148</b></span>
            </div>
            <a className="text-button" href="#sample-shelf">Shop now <ArrowRight size={15} /></a>
          </article>
          <article className="benefit-card light-card">
            <span className="card-number">02</span>
            <div className="benefit-icon"><ArrowDownRight /></div>
            <h3>Trade for meaningful credit</h3>
            <p>Submit eligible slabs for review. Select cards can receive up to the full verified fair retail value as store credit.</p>
            <ul>
              <li><Check size={15} /> Quote shown before you ship</li>
              <li><Check size={15} /> Credit only after authentication and inspection</li>
              <li><Check size={15} /> No obligation if the quote isn’t right for you</li>
            </ul>
            <button className="text-button" type="button" onClick={openTrade}>Submit your trades <ArrowRight size={15} /></button>
          </article>
        </div>
      </section>

      <section className="value-section" id="trade-ins">
        <div className="section-shell value-layout">
          <div className="value-copy">
            <p className="eyebrow">Transparent by design</p>
            <h2>A price<br /><em>you can verify.</em></h2>
            <p className="section-lede">Every reference value is grounded in recent verified sales, with grade, condition, liquidity, and current demand accounted for.</p>
            <div className="value-factors">
              <span>Recent sold transactions</span><span>Grade &amp; grading company</span><span>Card and slab condition</span><span>Liquidity &amp; current demand</span>
            </div>
          </div>
          <div className="quote-card">
            <div className="quote-top"><span>How value is built</span><span className="status-pill">market reference</span></div>
            <div className="comp-row"><span>Recent verified sales</span><b>$158 · $166 · $181</b></div>
            <div className="comp-row"><span>Outlier / stale listings</span><b>Excluded</b></div>
            <div className="comp-row"><span>Condition &amp; demand review</span><b>Applied</b></div>
            <div className="quote-total"><span>Reference value</span><b>$172</b></div>
            <p>Example only. Actual values change with the market and are established at review.</p>
          </div>
        </div>
      </section>

      <section className="section-shell trade-process">
        <div className="section-heading split-heading">
          <div><p className="eyebrow">The trade-in desk</p><h2>From your slab<br /><em>to your next find.</em></h2></div>
          <p>Designed to make strong cards useful inventory for the club—while giving collectors a clear, low-pressure path to store credit.</p>
        </div>
        <div className="steps-grid">
          <article><span>01</span><h3>Share the details</h3><p>Tell us the card, set, year, grading service, grade, and anything notable about the slab.</p></article>
          <article><span>02</span><h3>Receive a quote</h3><p>If it fits current needs, we’ll send a time-bound store-credit quote before asking you to ship.</p></article>
          <article><span>03</span><h3>Ship after approval</h3><p>Approved trades receive clear packing and tracked-shipping instructions.</p></article>
          <article><span>04</span><h3>Inspection, then credit</h3><p>Credit is issued only after authenticity, grade, and slab condition match the submission.</p></article>
        </div>
        <div className="eligibility-box">
          <div><ShieldCheck /><h3>Trade-in eligibility</h3></div>
          <p>We review professionally graded, authenticated cards from recognized graders, with intact slabs and a market value we can verify. PSA, CGC, and BGS lead the desk; other graders are reviewed case by case.</p>
          <div className="eligibility-tags"><span>PSA</span><span>CGC</span><span>BGS</span><span>Others reviewed case by case</span></div>
          <p className="fine-print">Not eligible: raw cards, counterfeit or altered items, mislabeled slabs, and slabs with undisclosed damage or evidence of tampering.</p>
          <button className="button button-outline" type="button" onClick={openTrade}>Submit your trades <ArrowRight size={16} /></button>
        </div>
      </section>

      <section className="membership-section" id="membership">
        <div className="section-shell membership-layout">
          <div className="membership-copy">
            <p className="eyebrow">Founding membership</p>
            <h2>A simple annual<br /><em>membership.</em></h2>
            <p className="section-lede">Founding membership is <b>$99 per year</b>—one simple price for member drops, below-retail pricing, and access to the trade-in desk.</p>
            <p className="fine-print">Final price, included benefits, renewal terms, inventory access, and cancellation policy may change before launch. They will be disclosed before checkout.</p>
          </div>
          <div className="price-card">
            <span className="status-pill coral">founding annual price</span>
            <div className="price"><sup>$</sup><strong>99</strong><span>/ year</span></div>
            <p>For collectors who want better buying economics and a flexible path to trade approved slabs.</p>
            <hr />
            <ul>
              <li><Check /> Access to member-priced graded cards</li>
              <li><Check /> Eligibility to request trade-in quotes</li>
              <li><Check /> Clear reference values and quote terms</li>
              <li><Check /> Early input into drops and selection</li>
            </ul>
            <a className="button submit-button" href="#join">Join the founding list <ArrowRight size={17} /></a>
            <small>No charge today. Joining the list does not reserve or guarantee membership.</small>
          </div>
        </div>
      </section>

      <section className="section-shell trust-section">
        <div className="trust-intro"><p className="eyebrow">Built in the open</p><h2>Trust starts before<br /><em>the first transaction.</em></h2></div>
        <div className="trust-grid">
          <article><span>01</span><h3>Values with receipts</h3><p>Reference values should be explainable using current, verified market evidence.</p></article>
          <article><span>02</span><h3>No surprise obligations</h3><p>A trade-in interest form is not a quote. A quote is not a requirement to ship.</p></article>
          <article><span>03</span><h3>Clear before checkout</h3><p>Membership, fulfillment, renewal, and support terms are shown before you pay.</p></article>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-shell faq-layout">
          <div className="faq-heading"><p className="eyebrow">Questions, answered plainly</p><h2>The fine print<br /><em>is the point.</em></h2><p>Have something else in mind? Join the list and tell us what would make the club genuinely useful.</p></div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.q} onToggle={(event) => { if (event.currentTarget.open) track("faq_opened", { question: faq.q }); }}>
                <summary>{faq.q}<ChevronDown /></summary><p>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-orbit" />
        <div className="section-shell final-content">
          <p className="eyebrow">The collection should keep moving</p><h2>Be there for<br /><em>the first drop.</em></h2>
          <p>Get first access to member drops, below-retail pricing, and the Slab Supply trade-in desk.</p>
          <div className="final-actions"><a className="button button-light" href="#join">Join early access <ArrowRight size={17} /></a><button className="button button-ghost" type="button" onClick={openTrade}>I have cards to trade</button></div>
        </div>
      </section>

      <footer>
        <div className="section-shell footer-top"><Logo /><p>An independent buying club for graded-card collectors.</p><div className="footer-links"><a href="#how">How it works</a><a href="#trade-ins">Trade-ins</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></div>
        <div className="section-shell footer-bottom"><p>© 2026 Slab Supply. Trademark and domain clearance required before commercial launch.</p><p>Not affiliated with or endorsed by Nintendo, The Pokémon Company, Game Freak, Creatures, or any grading company. All trademarks belong to their respective owners.</p></div>
      </footer>

      <div className="mobile-bar"><a className="button" href="#join">Join early access <ArrowRight size={16} /></a></div>

      {tradeOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTradeOpen(false); }}>
          <section className="trade-modal" role="dialog" aria-modal="true" aria-labelledby="trade-title">
            <button className="modal-close" type="button" aria-label="Close trade-in form" onClick={() => setTradeOpen(false)}><X /></button>
            {tradeState === "success" ? (
              <div className="trade-success" role="status"><span className="success-icon"><Check /></span><p className="eyebrow">Interest saved</p><h2 id="trade-title">Thanks for showing your hand.</h2><p>{tradeMessage}</p><p className="fine-print">This is not a quote or acceptance. We’ll reach out when the trade-in desk opens.</p><button className="button" type="button" onClick={() => setTradeOpen(false)}>Done</button></div>
            ) : (
              <form onSubmit={submitTrade}>
                <p className="eyebrow">Trade-in interest</p><h2 id="trade-title">What might you trade?</h2><p>Tell us enough to understand demand. This is not a quote, approval, or commitment to ship.</p>
                <div className="field-row"><label><span>First name</span><input name="firstName" autoComplete="given-name" maxLength={60} required /></label><label><span>Email</span><input name="email" type="email" autoComplete="email" maxLength={160} required /></label></div>
                <div className="field-row"><label><span>Primary grader</span><select name="grader" required defaultValue=""><option value="" disabled>Select one</option>{graders.map((grader) => <option key={grader}>{grader}</option>)}</select></label><label><span>Estimated total value</span><select name="estimatedValue" required defaultValue=""><option value="" disabled>Select a range</option><option>Under $250</option><option>$250–$999</option><option>$1,000–$4,999</option><option>$5,000+</option><option>Not sure</option></select></label></div>
                <label className="full-field"><span>What cards are you considering?</span><textarea name="cardDetails" rows={4} maxLength={1200} placeholder="Card, set/year, grade, and slab condition. A rough list is perfect." required /></label>
                <label className="full-field"><span>When would you consider trading?</span><select name="timeframe" required defaultValue=""><option value="" disabled>Select one</option><option>As soon as the desk opens</option><option>Within 1–3 months</option><option>Later this year</option><option>Just exploring</option></select></label>
                <label className="honeypot" aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
                <label className="consent"><input type="checkbox" name="consent" required /><span>I agree to receive trade-in updates about this submission.</span></label>
                <button className="button submit-button" disabled={tradeState === "submitting"} type="submit">{tradeState === "submitting" ? "Saving…" : <>Register interest <ArrowRight size={17} /></>}</button>
                {tradeMessage && <p className="form-message error" role="alert">{tradeMessage}</p>}
                <p className="form-footnote">Please don’t include certification numbers or other sensitive details yet.</p>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
