"use client";

import { useState } from "react";
import { membershipValue } from "../lib/membership-value";

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

export default function MembershipValueCalculator() {
  const [annualSpend, setAnnualSpend] = useState(2000);
  const [annualTrades, setAnnualTrades] = useState(1000);
  const [purchaseDiscount, setPurchaseDiscount] = useState(10);
  const [traditionalTradePercent, setTraditionalTradePercent] = useState(90);
  const [memberTradePercent, setMemberTradePercent] = useState(100);
  const value = membershipValue({ annualSpend, annualTrades, purchaseDiscount, traditionalTradePercent, memberTradePercent });
  return <section className="membership-value-section" id="membership-value" aria-labelledby="membership-value-title">
    <div className="section-shell">
      <div className="value-heading"><p className="eyebrow">Make it your own</p><h2 id="membership-value-title">What could membership<br /><em>be worth to you?</em></h2></div>
      <div className="membership-calculator">
        <div className="calculator-inputs">
          <div className="calculator-range"><label htmlFor="annual-spend">How much do you spend on graded Pokémon cards annually?</label><output htmlFor="annual-spend">{money(annualSpend * 100)}</output><input id="annual-spend" type="range" min="250" max="20000" step="50" value={annualSpend} aria-valuetext={money(annualSpend * 100)} onChange={event => setAnnualSpend(Number(event.target.value))} /><div className="range-endpoints"><span>$250</span><span>$20,000</span></div></div>
          <div className="calculator-range"><label htmlFor="annual-trades">What&apos;s the annual market value of the cards you trade?</label><output htmlFor="annual-trades">{money(annualTrades * 100)}</output><input id="annual-trades" type="range" min="0" max="20000" step="50" value={annualTrades} aria-valuetext={money(annualTrades * 100)} onChange={event => setAnnualTrades(Number(event.target.value))} /><div className="range-endpoints"><span>$0</span><span>$20,000</span></div></div>
          <details className="calculator-assumptions"><summary>Adjust assumptions</summary>
            <label htmlFor="purchase-discount">Slab Supply purchase discount <span>{purchaseDiscount}%</span></label><input id="purchase-discount" type="range" min="0" max="30" value={purchaseDiscount} aria-valuetext={`${purchaseDiscount}%`} onChange={event => setPurchaseDiscount(Number(event.target.value))} />
            <label htmlFor="traditional-trade">Traditional trade-in percentage <span>{traditionalTradePercent}%</span></label><input id="traditional-trade" type="range" min="0" max="100" value={traditionalTradePercent} aria-valuetext={`${traditionalTradePercent}%`} onChange={event => setTraditionalTradePercent(Number(event.target.value))} />
            <label htmlFor="member-trade">Slab Supply trade-in percentage <span>{memberTradePercent}%</span></label><input id="member-trade" type="range" min="0" max="100" value={memberTradePercent} aria-valuetext={`${memberTradePercent}%`} onChange={event => setMemberTradePercent(Number(event.target.value))} />
          </details>
        </div>
        <div className="calculator-results" aria-live="polite" aria-atomic="true">
          <div className="calculator-comparison"><div><h3>Traditional collecting</h3><p>Annual purchases<strong>{money(value.retailPurchases)}</strong></p><p>Trade-in credit · {traditionalTradePercent}%<strong>{money(value.traditionalCredit)}</strong></p></div><div><h3>Slab Supply</h3><p>Annual purchases<strong>{money(value.memberPurchases)}</strong></p><p>Trade-in credit · {memberTradePercent}%<strong>{money(value.memberCredit)}</strong></p></div></div>
          <dl className="calculator-breakdown"><div><dt>Estimated annual purchase savings</dt><dd>{money(value.purchaseSavings)}</dd></div><div><dt>Additional potential trade-in credit</dt><dd>{money(value.additionalCredit)}</dd></div><div className="calculator-subtotal"><dt>Total illustrative annual benefit</dt><dd>{money(value.totalBenefit)}</dd></div><div><dt>Annual membership</dt><dd>{money(value.membershipFee)}</dd></div></dl>
          <div className="calculator-net"><span>Illustrative net benefit<br />after membership</span><strong>{money(value.netBenefit)}</strong></div>
        </div>
      </div>
      <p className="calculator-disclosure">An illustration of membership value, not guaranteed cash savings. Actual savings vary by card and availability. The default 10% purchase discount is illustrative, not guaranteed; full-market trade credit applies only to selected eligible cards. Store credit is not cash. Comparisons assume equivalent card valuations and comparable credit terms. Traditional retailer offers vary.</p>
    </div>
  </section>;
}
