"use client";

import { useState } from "react";
import { Gem } from "lucide-react";
import { membershipValue, membershipValueDefaults } from "../lib/membership-value";

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

export default function MembershipValueCalculator() {
  const [annualSpend, setAnnualSpend] = useState(membershipValueDefaults.annualSpend);
  const [annualTrades, setAnnualTrades] = useState(membershipValueDefaults.annualTrades);
  const value = membershipValue({ ...membershipValueDefaults, annualSpend, annualTrades });
  return <section className="membership-value-section" id="membership-value" aria-labelledby="membership-value-title">
    <div className="section-shell">
      <div className="value-heading"><p className="eyebrow">Make it your own</p><h2 id="membership-value-title">What could membership<br /><em>be worth to you?</em></h2></div>
      <div className="membership-calculator">
        <div className="calculator-inputs">
          <div className="calculator-range"><label htmlFor="annual-spend">Annual card purchases</label><output htmlFor="annual-spend">{money(annualSpend * 100)}</output><input id="annual-spend" type="range" min="250" max="20000" step="50" value={annualSpend} aria-valuetext={money(annualSpend * 100)} onChange={event => setAnnualSpend(Number(event.target.value))} /><div className="range-endpoints"><span>$250</span><span>$20,000</span></div></div>
          <div className="calculator-range"><label htmlFor="annual-trades">Annual trade-in market value</label><output htmlFor="annual-trades">{money(annualTrades * 100)}</output><input id="annual-trades" type="range" min="0" max="20000" step="50" value={annualTrades} aria-valuetext={money(annualTrades * 100)} onChange={event => setAnnualTrades(Number(event.target.value))} /><div className="range-endpoints"><span>$0</span><span>$20,000</span></div></div>
          <div className="calculator-net" role="status" aria-atomic="true"><span>Annual membership value<small>After the membership fee</small></span><strong>{money(value.netBenefit)}</strong></div>
        </div>
        <div className="calculator-results" aria-live="polite" aria-atomic="true">
          <div className="calculator-comparison">
            <div className="calculator-retail"><h3>Traditional retail</h3><p>Annual purchases<strong>{money(value.retailPurchases)}</strong></p><div className="comparison-bar" aria-hidden="true"><i /></div><span className="calculator-savings-tag" aria-hidden="true">&nbsp;</span><p>Trade-in credit · 85%<strong>{money(value.traditionalCredit)}</strong></p></div>
            <div className="calculator-member"><span className="calculator-member-mark" aria-hidden="true"><Gem size={17} strokeWidth={1.3} /></span><h3>Slab Supply Co. Members</h3><p>Annual purchases<strong>{money(value.memberPurchases)}</strong></p><div className="comparison-bar" aria-hidden="true"><i style={{width:`${100 - membershipValueDefaults.purchaseDiscount}%`}} /></div><span className="calculator-savings-tag">{money(value.purchaseSavings)} in purchase savings</span><p>Trade-in credit · up to 100%<strong>{money(value.memberCredit)}</strong></p></div>
          </div>
          <dl className="calculator-breakdown calculator-value-walk">
            <div><dt><span aria-hidden="true">+</span> Savings on purchases</dt><dd>{money(value.purchaseSavings)}</dd></div>
            <div><dt><span aria-hidden="true">+</span> Extra trade-in value</dt><dd>{money(value.additionalCredit)}</dd></div>
            <div><dt><span aria-hidden="true">−</span> Cost of membership</dt><dd>−{money(value.membershipFee)}</dd></div>
          </dl>
        </div>
      </div>
      <p className="calculator-disclosure">Estimates use a 15% purchase discount and 85% traditional trade credit. Actual savings and offers vary by card and availability; up to 100% credit applies only to selected, approved cards. Store credit is not cash. Comparisons assume equivalent valuations and credit terms.</p>
    </div>
  </section>;
}
