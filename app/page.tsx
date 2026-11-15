"use client";

import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  Check,
  Gem,
  Sparkles,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { useStartSignup } from "../components/club/IdentityProvider";
import { ClubHeader, MobileAccountBar } from "../components/club/ClubShell";

type SubmitState = "idle" | "submitting" | "success" | "error";

const faqs = [
  {
    label: "Independent by design",
    q: "Is Slab Supply Co. affiliated with Pokémon, Nintendo, or The Pokémon Company?",
    a: "No. Slab Supply Co. is an independent graded-card buying club. It is not affiliated with, endorsed by, or sponsored by Nintendo, The Pokémon Company, Game Freak, or Creatures.",
  },
  {
    label: "Member pricing",
    q: "Does ‘below retail’ mean every card will always be the cheapest online?",
    a: "Member prices sit below the fair retail value established when each card is listed. That is different from a lowest-price-anywhere claim: markets move, condition varies, and temporary marketplace listings can be lower.",
  },
  {
    label: "Trade-in value",
    q: "What does ‘up to 100% of fair retail value’ mean?",
    a: "Select approved cards receive a store-credit quote worth up to the fair retail value established at review. Every quote reflects demand, liquidity, grade, slab condition, and current inventory needs.",
  },
  {
    label: "Fair retail value",
    q: "How will fair retail value be determined?",
    a: "Fair retail value starts with recent verified sales across reputable marketplaces. We account for grading company, grade, card and slab condition, sales velocity, and outliers. Unsold asking prices do not establish value.",
  },
  {
    label: "Eligible cards",
    q: "Which cards and grading companies will be eligible?",
    a: "We review authenticated trading cards graded by PSA, CGC, BGS, and select recognized services. Raw cards, altered cards, counterfeit items, and damaged or tampered slabs are not eligible.",
  },
  {
    label: "Founding access",
    q: "What happens after I join the club?",
    a: "Annual membership costs $99 and includes member pricing, eligible trade-in benefits, and member drops. Card purchases are separate.",
  },
  {
    label: "Trade-in process",
    q: "What happens after I submit a trade-in interest form?",
    a: "Your submission goes to the trade-in desk for review. When a card fits our buying needs, you receive a quote to approve before shipping.",
  },
];

const graders = ["PSA", "CGC", "BGS", "Other / mixed"];

const shelfCards = [
  { image: "/cards/snorlax-psa9-normalized.webp", alt: "1999 Jungle Snorlax holo graded PSA 9", kicker: "1999 · Vintage holo · PSA 9", name: "Jungle Snorlax #11", retail: "$700", member: "$595", savings: "$105", interest: "Vintage holos like 1999 Jungle Snorlax" },
  { image: "/cards/lugia-psa8-normalized.webp", alt: "2000 Neo Genesis Lugia holo graded PSA 8", kicker: "2000 · Neo-era holo · PSA 8", name: "Neo Genesis Lugia #9", retail: "$1,550", member: "$1,395", savings: "$155", interest: "Neo-era holos like 2000 Neo Genesis Lugia" },
  { image: "/cards/charizard-151-psa10-normalized.webp", alt: "2023 151 Charizard ex special illustration graded PSA 10", kicker: "2023 · Special illustration · PSA 10", name: "151 Charizard ex #199", retail: "$1,275", member: "$1,084", savings: "$191", interest: "Modern special illustrations like 2023 151 Charizard ex" },
  { image: "/cards/charizard-evolutions-psa9-normalized.webp", alt: "2016 Evolutions Charizard holo graded PSA 9", kicker: "2016 · Classic reissue holo · PSA 9", name: "Evolutions Charizard #11", retail: "$210", member: "$179", savings: "$31", interest: "Classic Charizard holos like 2016 Evolutions" },
  { image: "/cards/umbreon-celebrations-psa10-normalized.webp", alt: "2021 Celebrations Umbreon Gold Star graded PSA 10", kicker: "2021 · Gold Star · PSA 10", name: "Celebrations Umbreon #17", retail: "$285", member: "$242", savings: "$43", interest: "Gold Star cards like Celebrations Umbreon" },
  { image: "/cards/pikachu-grey-felt-psa10-normalized.webp", alt: "2023 Pikachu with Grey Felt Hat promo graded PSA 10", kicker: "2023 · Art promo · PSA 10", name: "Pikachu with Grey Felt Hat", retail: "$2,525", member: "$2,145", savings: "$380", interest: "Art promos like Pikachu with Grey Felt Hat" },
];

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
  const [tradeOpen, setTradeOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [waitState, setWaitState] = useState<SubmitState>("idle");
  const [tradeState, setTradeState] = useState<SubmitState>("idle");
  const [noteState, setNoteState] = useState<SubmitState>("idle");
  const [waitMessage, setWaitMessage] = useState("");
  const [tradeMessage, setTradeMessage] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const startSignup = useStartSignup();
  const waitStartedTracked = useRef(false);
  const shelfRef = useRef<HTMLDivElement>(null);
  const [shelfIndex, setShelfIndex] = useState(0);
  const [shelfPageSize, setShelfPageSize] = useState(1);
  const [faqIndex, setFaqIndex] = useState(0);
  const [tradeStartedAt, setTradeStartedAt] = useState(Date.now());
  const [noteStartedAt, setNoteStartedAt] = useState(Date.now());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    track("page_view", {
      ref: Boolean(params.get("ref")),
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
    });
  }, []);

  function moveFaq(direction: -1 | 1) {
    setFaqIndex((current) => (current + direction + faqs.length) % faqs.length);
    track("faq_navigated", { direction: direction > 0 ? "next" : "previous" });
  }

  function chooseFaq(index: number) {
    setFaqIndex(index);
    track("faq_navigated", { position: index + 1 });
  }

  useEffect(() => {
    document.body.style.overflow = tradeOpen || noteOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [tradeOpen, noteOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 821px)");
    const updatePageSize = () => setShelfPageSize(media.matches ? 3 : 1);
    updatePageSize();
    media.addEventListener("change", updatePageSize);
    return () => media.removeEventListener("change", updatePageSize);
  }, []);

  async function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (waitState === "submitting") return;
    setWaitState("submitting"); setWaitMessage("");
    const data = new FormData(event.currentTarget);
    try {
      await startSignup({ firstName: String(data.get("firstName") || ""), emailAddress: String(data.get("email") || ""), interest: String(data.get("interest") || ""), collectingFocus: String(data.get("collectingFocus") || ""), consent: data.get("consent") === "on" });
    } catch {
      setWaitState("error"); setWaitMessage("Sign-up could not open. Please try again.");
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

  function openNote() {
    setNoteStartedAt(Date.now());
    setNoteOpen(true);
    track("note_started");
  }

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNoteState("submitting");
    setNoteMessage("");
    const data = new FormData(event.currentTarget);
    const payload = {
      firstName: data.get("firstName"),
      email: data.get("email"),
      message: data.get("message"),
      company: data.get("company"),
      consent: data.get("consent") === "on",
      startedAt: noteStartedAt,
    };
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "We couldn’t send your note. Please try again.");
      setNoteState("success");
      setNoteMessage(result.message || "Your note is on its way.");
      track("note_submitted");
    } catch (error) {
      setNoteState("error");
      setNoteMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  function expressShelfInterest(label: string) {
    track("shelf_interest", { label });
    const input = document.querySelector<HTMLInputElement>('input[name="collectingFocus"]');
    if (input) input.value = label;
    document.getElementById("join")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function scrollShelf(direction: -1 | 1) {
    const shelf = shelfRef.current;
    const firstCard = shelf?.querySelector<HTMLElement>(".shelf-card");
    if (!shelf || !firstCard) return;
    const nextIndex = Math.max(0, Math.min(shelfCards.length - shelfPageSize, shelfIndex + direction * shelfPageSize));
    shelf.scrollTo({ left: nextIndex * (firstCard.offsetWidth + 18), behavior: "smooth" });
    setShelfIndex(nextIndex);
    track("shelf_scrolled", { direction: direction === 1 ? "next" : "previous" });
  }

  function syncShelfIndex() {
    const shelf = shelfRef.current;
    const firstCard = shelf?.querySelector<HTMLElement>(".shelf-card");
    if (!shelf || !firstCard) return;
    setShelfIndex(Math.round(shelf.scrollLeft / (firstCard.offsetWidth + 18)));
  }

  return (
    <main id="top">
      <ClubHeader />

      <section className="hero section-shell">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={14} /> The club for graded-card collectors</p>
          <h1>Collect more.<br /><em>Spend less.</em></h1>
          <p className="hero-lede">Shop graded cards below retail value. Trade slabs for up to full value in store credit. One membership, built around your collection.</p>
          <div className="hero-points" aria-label="Core benefits">
            <span><Check size={16} /> Exclusive monthly grail drops</span>
            <span><Check size={16} /> Below-retail member pricing</span>
            <span><Check size={16} /> Up to 100% trade-in credit</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Curated graded card display">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="slab slab-back">
            <div className="slab-label"><span>ARCHIVE</span><b>SPECIMEN 02</b><small>SLAB SUPPLY CO.</small></div>
            <div className="card-art art-two"><span>02</span></div>
          </div>
          <div className="slab slab-front">
            <div className="slab-label"><span>ARCHIVE</span><b>SPECIMEN 01</b><small>SLAB SUPPLY CO.</small></div>
            <div className="card-art art-one"><span className="art-star">✦</span><b>FIRST EDITION</b><small>MEMBER SHELF</small></div>
            <div className="slab-bottom"><span>Member shelf</span><b>$148</b><small>verified retail: $172</small></div>
          </div>
        </div>

        <div className="join-card" id="join">
            <form onSubmit={submitJoin} onFocus={() => { if (!waitStartedTracked.current) { waitStartedTracked.current = true; track("account_signup_started"); } }}>
              <p className="eyebrow">Founding membership</p>
              <h2>Join the club.</h2>
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
              <label className="consent"><input type="checkbox" name="consent" /><span>I agree to receive club updates. I can unsubscribe anytime.</span></label>
              <button className="button submit-button" disabled={waitState === "submitting"} type="submit">
                {waitState === "submitting" ? "Opening sign-up…" : <>Join the club <ArrowRight size={17} /></>}
              </button>
              {waitMessage && <p className="form-message error" role="alert">{waitMessage}</p>}
              <p className="form-footnote">Founding membership is $99 per year.</p>
            </form>
        </div>
      </section>

      <section className="principle-strip" aria-label="Our operating principles">
        <span>Below-retail member pricing</span><i>✦</i><span>Up to full value in trade credit</span><i>✦</i><span>Exclusive monthly grail drops</span>
      </section>

      <section className="shelf-section" id="sample-shelf">
        <div className="section-shell">
          <div className="shelf-heading">
            <div><p className="eyebrow">On the member shelf</p><h2>Cards worth collecting.<br /><em>Prices worth joining for.</em></h2></div>
            <div className="shelf-heading-side"><p>Vintage icons, modern illustration rares, cult favorites, and art-forward promos—curated for the member shelf.</p><div className="shelf-controls" aria-label="Browse member shelf"><button type="button" onClick={() => scrollShelf(-1)} aria-label="Previous cards" disabled={shelfIndex === 0}><ArrowLeft /></button><button type="button" onClick={() => scrollShelf(1)} aria-label="Next cards" disabled={shelfIndex >= shelfCards.length - shelfPageSize}><ArrowRight /></button></div></div>
          </div>
          <div className="shelf-grid" ref={shelfRef} onScroll={syncShelfIndex}>
            {shelfCards.map((card) => <article className="shelf-card" key={card.name}>
              <div className="shelf-art"><img src={card.image} alt={card.alt} /><span className="shelf-badge">Member shelf</span></div>
              <div className="shelf-meta"><span className="shelf-kicker">{card.kicker}</span><h3>{card.name}</h3><div className="shelf-pricing"><span>Retail<s>{card.retail}</s></span><span>Member price<b>{card.member}</b></span><span className="savings">Your savings<b>{card.savings}</b></span></div></div>
              <button className="button button-outline" type="button" onClick={() => expressShelfInterest(card.interest)}>Get member access <ArrowRight size={15} /></button>
            </article>)}
          </div>
          <p className="shelf-note">Market reference snapshot: November 15, 2026. Values are rounded from recent completed-sale data and current market estimates from <a href="https://www.pricecharting.com/game/pokemon-jungle/snorlax-11" target="_blank" rel="noreferrer">PriceCharting</a> and <a href="https://slabline.ai/cards/2023-scarlet-violet-151-charizard-ex-199-psa-10" target="_blank" rel="noreferrer">Slabline</a>. Exact grades, copies, and values vary by drop.</p>
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
            <div className="benefit-graphic buy-graphic" aria-hidden="true">
              <div className="graphic-slab graphic-slab-back"><span /></div>
              <div className="graphic-slab graphic-slab-front"><span>✦</span></div>
              <div className="price-ticket"><small>RETAIL</small><s>$172</s><b>$148</b><span>MEMBER</span></div>
            </div>
            <h3>Member pricing<br />below retail</h3>
            <p>Shop a tightly curated shelf of graded cards at pricing built for the club—not the open-market markup.</p>
            <a className="text-button" href="#sample-shelf">Shop now <ArrowRight size={15} /></a>
          </article>
          <article className="benefit-card light-card">
            <span className="card-number">02</span>
            <div className="benefit-icon"><ArrowDownRight /></div>
            <div className="benefit-graphic trade-graphic" aria-hidden="true">
              <div className="graphic-slab trade-slab"><span>09</span></div>
              <ArrowRight />
              <div className="credit-coin"><strong>UP TO</strong><b>100%</b><span>CREDIT</span></div>
            </div>
            <h3>Trade toward<br />what’s next</h3>
            <p>Turn approved slabs into meaningful store credit for your next card—or take instant cash.</p>
            <button className="text-button" type="button" onClick={openTrade}>Submit your trades <ArrowRight size={15} /></button>
          </article>
        </div>
      </section>

      <section className="promise-section" id="promise">
        <div className="section-shell promise-layout">
          <div className="promise-intro">
            <p className="eyebrow">Our promise</p>
            <h2>A better way<br /><em>to collect.</em></h2>
            <p className="promise-lede">We love this hobby. We just think it could be a little fairer.</p>
          </div>
          <div className="promise-model">
            <span>The model</span>
            <blockquote>Fair prices. Strong trade-ins. More room for the cards you love.</blockquote>
            <p>Instead of maximizing the margin on every slab, membership lets us operate on leaner card margins and return more value through member pricing and fair trade offers.</p>
            <a className="text-button promise-link" href="/promise">Read our promise <ArrowRight size={15} /></a>
          </div>
        </div>
      </section>

      <section className="grail-section" id="grail-drops">
        <div className="section-shell grail-layout">
          <div className="grail-copy">
            <p className="eyebrow">Monthly grail drops</p>
            <h2>The cards you watch for.<br /><em>At member pricing.</em></h2>
            <p>Once a month, members get first access to a tightly curated drop of standout slabs—vintage icons, scarce promos, and modern chase cards.</p>
            <a className="button button-light" href="#join">Get drop access <ArrowRight size={16} /></a>
          </div>
          <div className="grail-visual" aria-label="A selection of graded cards from a monthly grail drop">
            <img className="grail-card grail-card-one" src="/cards/lugia-psa8-normalized.webp" alt="2000 Neo Genesis Lugia graded card" />
            <img className="grail-card grail-card-two" src="/cards/charizard-151-psa10-normalized.webp" alt="2023 151 Charizard ex graded card" />
            <img className="grail-card grail-card-three" src="/cards/pikachu-grey-felt-psa10-normalized.webp" alt="2023 Pikachu art promo graded card" />
            <div className="drop-seal"><span>DROP 01</span><b>MEMBERS</b><b>FIRST</b></div>
          </div>
        </div>
      </section>

      <section className="section-shell trade-process" id="trade-ins">
        <div className="trade-story">
          <div className="trade-copy">
            <p className="eyebrow">The trade-in desk</p>
            <h2>Trade what you have.<br /><em>Collect what you want.</em></h2>
            <p>Send us the graded cards that are ready for a new home. Approved trades become store credit or cash.</p>
            <button className="button" type="button" onClick={openTrade}>Submit your trades <ArrowRight size={16} /></button>
          </div>
          <div className="trade-flow" aria-label="Submit a graded card and choose store credit or cash">
            <div className="trade-flow-orbit" aria-hidden="true" />
            <div className="flow-item">
              <div className="flow-slab" aria-hidden="true"><small>SLAB SUPPLY CO.</small><span>09</span></div>
              <strong>Submit</strong>
            </div>
            <ArrowRight className="flow-arrow" aria-hidden="true" />
            <div className="flow-item">
              <div className="flow-credit" aria-hidden="true"><small>UP TO</small><b>100%</b><span>CREDIT</span></div>
              <strong>Credit</strong>
            </div>
            <ArrowRight className="flow-arrow" aria-hidden="true" />
            <div className="flow-item">
              <div className="flow-slab flow-slab-next" aria-hidden="true"><small>YOUR CHOICE</small><span>✦</span></div>
              <strong>Credit or cash</strong>
            </div>
          </div>
        </div>
        <div className="trade-eligibility">
          <span>Eligible graders</span>
          <p>Professionally graded cards from PSA, CGC, BGS, and select others.</p>
        </div>
      </section>

      <section className="membership-section" id="membership">
        <div className="section-shell membership-layout">
          <div className="membership-copy">
            <p className="eyebrow">Slab Supply Co. · Founding membership</p>
            <h2>One membership.<br /><em>More from every card.</em></h2>
            <p className="section-lede">One annual membership designed to put more value back into your collection.</p>
          </div>
          <div className="price-card">
            <div className="price-card-top"><span className="status-pill coral">founding annual price</span><div className="membership-emblem" aria-hidden="true"><i /><b>✦</b></div></div>
            <div className="price"><sup>$</sup><strong>99</strong><span>/ year</span></div>
            <p>Member pricing, premium trade-in value, and exclusive drops—built around your collection.</p>
            <ul>
              <li><Check /> Everyday member pricing below retail</li>
              <li><Check /> Premium trade-in credit—up to 100% of fair market value on eligible graded cards</li>
              <li><Check /> Exclusive monthly member drops and grail opportunities</li>
            </ul>
            <div className="membership-promise">
              <span>The Slab Supply Co. Promise</span>
              <p>Your annual membership supports leaner card margins, transparent pricing, and more value returned to collectors.</p>
            </div>
            <a className="button submit-button" href="/join">Join the club <ArrowRight size={17} /></a>
          </div>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-shell faq-pack-layout">
          <div className="faq-intro">
            <p className="eyebrow">The collector’s guide</p>
            <h2>Know exactly<br /><em>how it works.</em></h2>
            <p>Membership, pricing, and trade-ins—clear from the start.</p>
            <div className="faq-controls" aria-label="Browse questions">
              <button type="button" onClick={() => moveFaq(-1)} aria-label="Previous question"><ArrowLeft /></button>
              <button type="button" onClick={() => moveFaq(1)} aria-label="Next question"><ArrowRight /></button>
            </div>
            <button className="text-button faq-note-link" type="button" onClick={openNote}>Ask us something else <ArrowRight size={15} /></button>
          </div>
          <div className="faq-carousel">
            <div className="carousel-shadow carousel-shadow-one" aria-hidden="true" />
            <div className="carousel-shadow carousel-shadow-two" aria-hidden="true" />
            <article className="question-card" key={faqIndex} aria-live="polite">
              <div className="question-card-top"><span>SLAB SUPPLY CO. · COLLECTOR’S GUIDE</span></div>
              <div className="question-card-body">
                <span>{faqs[faqIndex].label}</span>
                <h3>{faqs[faqIndex].q}</h3>
                <p>{faqs[faqIndex].a}</p>
              </div>
              <div className="question-card-mark" aria-hidden="true">✦</div>
            </article>
            <div className="faq-dots" aria-label="Choose a question">
              {faqs.map((faq, index) => <button key={faq.q} type="button" className={index === faqIndex ? "active" : ""} onClick={() => chooseFaq(index)} aria-label={`Question ${index + 1}`} aria-current={index === faqIndex ? "true" : undefined} />)}
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-orbit" />
        <div className="section-shell final-content">
          <p className="eyebrow">The collection should keep moving</p><h2>Be there for<br /><em>the first drop.</em></h2>
          <p>Join the club for member drops, below-retail pricing, and the Slab Supply Co. trade-in desk.</p>
          <div className="final-actions"><a className="button button-light" href="/join">Join the club <ArrowRight size={17} /></a><button className="button button-ghost" type="button" onClick={openTrade}>I have cards to trade</button></div>
        </div>
      </section>

      <footer>
        <div className="section-shell footer-top"><Logo /><p>An independent buying club for graded-card collectors.</p><div className="footer-links"><a href="/membership">Membership</a><a href="/help">Help</a><a href="/account">My account</a><a href="/promise">Our promise</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></div>
        <div className="section-shell footer-bottom"><p>© 2026 Slab Supply Co. All rights reserved.</p><p>Not affiliated with or endorsed by Nintendo, The Pokémon Company, Game Freak, Creatures, or any grading company. All trademarks belong to their respective owners.</p></div>
      </footer>

      <MobileAccountBar />

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
                <label className="consent"><input type="checkbox" name="consent" /><span>I agree to receive trade-in updates about this submission.</span></label>
                <button className="button submit-button" disabled={tradeState === "submitting"} type="submit">{tradeState === "submitting" ? "Saving…" : <>Register interest <ArrowRight size={17} /></>}</button>
                {tradeMessage && <p className="form-message error" role="alert">{tradeMessage}</p>}
                <p className="form-footnote">Please don’t include certification numbers or other sensitive details yet.</p>
              </form>
            )}
          </section>
        </div>
      )}

      {noteOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setNoteOpen(false); }}>
          <section className="trade-modal note-modal" role="dialog" aria-modal="true" aria-labelledby="note-title">
            <button className="modal-close" type="button" aria-label="Close note form" onClick={() => setNoteOpen(false)}><X /></button>
            {noteState === "success" ? (
              <div className="trade-success" role="status"><span className="success-icon"><Check /></span><p className="eyebrow">Note received</p><h2 id="note-title">We’re listening.</h2><p>{noteMessage}</p><button className="button" type="button" onClick={() => setNoteOpen(false)}>Done</button></div>
            ) : (
              <form onSubmit={submitNote}>
                <p className="eyebrow">A direct line</p><h2 id="note-title">What’s on your mind?</h2><p>Questions, requests, dream cards—send it our way.</p>
                <div className="field-row"><label><span>First name</span><input name="firstName" autoComplete="given-name" maxLength={60} required /></label><label><span>Email</span><input name="email" type="email" autoComplete="email" maxLength={160} required /></label></div>
                <label className="full-field"><span>Your note</span><textarea name="message" rows={6} maxLength={1600} placeholder="Tell us what you’re looking for…" required /></label>
                <label className="honeypot" aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
                <label className="consent"><input type="checkbox" name="consent" /><span>I agree to receive a reply about this note.</span></label>
                <button className="button submit-button" disabled={noteState === "submitting"} type="submit">{noteState === "submitting" ? "Sending…" : <>Send note <ArrowRight size={17} /></>}</button>
                {noteMessage && <p className="form-message error" role="alert">{noteMessage}</p>}
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
