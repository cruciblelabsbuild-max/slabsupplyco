"use client";

import { useState } from "react";
import { Gem } from "lucide-react";
import { membershipValue } from "../lib/membership-value";

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

export default function MembershipValueCalculator() {
  const [annualSpend, setAnnualSpend] = useState(2000);
  const [annualTrades, setAnnualTrades] = useState(1000);
  const value = membershipValue({ annualSpend, annualTrades, purchaseDiscount: 10, traditionalTradePercent: 90, memberTradePercent: 100 });
  return <section className="membership-value-section" id="membership-value" aria-labelledby="membership-value-title">
    <div className="section-shell">
      <div className="value-heading"><p className="eyebrow">Make it your own</p><h2 id="membership-value-title">What could membership<br /><em>be worth to you?</em></h2></div>
      <div className="membership-calculator">
        <div className="calculator-inputs">
          <div className="calculator-range"><label htmlFor="annual-spend">How much do you spend on graded Pokémon cards annually?</label><output htmlFor="annual-spend">{money(annualSpend * 100)}</output><input id="annual-spend" type="range" min="250" max="20000" step="50" value={annualSpend} aria-valuetext={money(annualSpend * 100)} onChange={event => setAnnualSpend(Number(event.target.value))} /><div className="range-endpoints"><span>$250</span><span>$20,000</span></div></div>
          <div className="calculator-range"><label htmlFor="annual-trades">What&apos;s the annual market value of the cards you trade?</label><output htmlFor="annual-trades">{money(annualTrades * 100)}</output><input id="annual-trades" type="range" min="0" max="20000" step="50" value={annualTrades} aria-valuetext={money(annualTrades * 100)} onChange={event => setAnnualTrades(Number(event.target.value))} /><div className="range-endpoints"><span>$0</span><span>$20,000</span></div></div>

        </div>
        <div className="calculator-results" aria-live="polite" aria-atomic="true">
          <div className="calculator-comparison">
            <div className="calculator-retail"><h3>Traditional retail</h3><p>Annual purchases<strong>{money(value.retailPurchases)}</strong></p><div className="comparison-bar" aria-hidden="true"><i /></div><span className="calculator-savings-tag" aria-hidden="true">&nbsp;</span><p>Trade-in credit · 90%<strong>{money(value.traditionalCredit)}</strong></p></div>
            <div className="calculator-member"><span className="calculator-member-mark" aria-hidden="true"><Gem size={17} strokeWidth={1.3} /></span><h3>Slab Supply Co. Members</h3><p>Annual purchases<strong>{money(value.memberPurchases)}</strong></p><div className="comparison-bar" aria-hidden="true"><i style={{width:"90%"}} /></div><span className="calculator-savings-tag">{money(value.purchaseSavings)} in purchase savings</span><p>Trade-in credit · up to 100%<strong>{money(value.memberCredit)}</strong></p></div>
          </div>
          <dl className="calculator-breakdown"><div><dt>Estimated annual purchase savings</dt><dd>{money(value.purchaseSavings)}</dd></div><div><dt>Additional potential trade-in credit</dt><dd>{money(value.additionalCredit)}</dd></div><div className="calculator-subtotal"><dt>Estimated annual benefit</dt><dd>{money(value.totalBenefit)}</dd></div><div><dt>Annual membership</dt><dd>{money(value.membershipFee)}</dd></div></dl>
          <div className="calculator-net"><span>Estimated net benefit<br />after membership</span><strong>{money(value.netBenefit)}</strong></div>
        </div>
      </div>
      <p className="calculator-disclosure">Estimates use a 10% purchase discount and 90% traditional trade credit. Actual savings and offers vary by card and availability; up to 100% credit applies only to selected, approved cards. Store credit is not cash. Comparisons assume equivalent valuations and credit terms.</p>
    </div>
  </section>;
}
