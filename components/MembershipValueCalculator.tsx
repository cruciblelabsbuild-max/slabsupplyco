"use client";

import {useState} from "react";
import {membershipValue,membershipValueDefaults} from "../lib/membership-value";
import styles from "./membership-value.module.css";

const money=(cents:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:cents%100?2:0}).format(cents/100);

export default function MembershipValueCalculator(){
 const [annualSpend,setAnnualSpend]=useState(membershipValueDefaults.annualSpend);
 const [annualTrades,setAnnualTrades]=useState(membershipValueDefaults.annualTrades);
 const value=membershipValue({...membershipValueDefaults,annualSpend,annualTrades});
 const {purchaseDiscount,traditionalTradePercent,memberTradePercent}=membershipValueDefaults;
 return <section className="membership-value-section" id="membership-value" aria-labelledby="membership-value-title">
  <div className="section-shell">
   <div className="value-heading"><p className="eyebrow">Make it your own</p><h2 id="membership-value-title">What could membership<br/><em>be worth to you?</em></h2></div>
   <div className={styles.calculator}>
    <div className={styles.inputs}>
     <h3>Personalize your membership</h3>
     <div className={styles.range}>
      <div className={styles.rangeHeading}><label htmlFor="annual-spend">What do you spend on graded cards each year?</label><output htmlFor="annual-spend">{money(annualSpend*100)}</output></div>
      <input id="annual-spend" type="range" min="0" max="20000" step="50" value={annualSpend} aria-valuetext={money(annualSpend*100)} onChange={event=>setAnnualSpend(Number(event.target.value))}/>
      <div className={styles.endpoints} aria-hidden="true"><span>$0</span><span>$20,000</span></div>
     </div>
     <div className={styles.range}>
      <div className={styles.rangeHeading}><label htmlFor="annual-trades">What’s the annual market value of cards you trade?</label><output htmlFor="annual-trades">{money(annualTrades*100)}</output></div>
      <input id="annual-trades" type="range" min="0" max="20000" step="50" value={annualTrades} aria-valuetext={money(annualTrades*100)} onChange={event=>setAnnualTrades(Number(event.target.value))}/>
      <div className={styles.endpoints} aria-hidden="true"><span>$0</span><span>$20,000</span></div>
     </div>
    </div>
    <div className={styles.result} aria-live="polite" aria-atomic="true">
     <h3>Your potential benefit</h3>
     <p className={styles.resultLabel}>Your illustrative annual benefit</p>
     <strong className={styles.benefit}>{money(value.netBenefit)}</strong>
     <p className={styles.afterFee}>After your {money(value.membershipFee)} annual membership</p>
     <dl className={styles.breakdown}>
      <div><dt>Potential savings when buying ({purchaseDiscount}%)</dt><dd>{money(value.purchaseSavings)}</dd></div>
      <div><dt>Potential extra trade credit ({memberTradePercent}% vs. {traditionalTradePercent}%)</dt><dd>{money(value.additionalCredit)}</dd></div>
      <div><dt>Annual membership</dt><dd>−{money(value.membershipFee)}</dd></div>
     </dl>
    </div>
   </div>
   <p className={styles.disclosure}>Illustrative only. Assumes {purchaseDiscount}% purchasing savings and {memberTradePercent}% trade credit on selected eligible cards, versus a hypothetical {traditionalTradePercent}% traditional trade-in offer. Actual prices and offers vary. Store credit is not cash.</p>
  </div>
 </section>;
}
