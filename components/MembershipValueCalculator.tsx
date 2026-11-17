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
 return <section className={`membership-value-section ${styles.section}`} id="membership-value" aria-labelledby="membership-value-title">
  <div className="section-shell">
   <div className="value-heading"><p className="eyebrow">The membership math</p><h2 id="membership-value-title">See how the<br/><em>savings add up.</em></h2></div>
   <div className={styles.calculator}>
    <div className={styles.inputs}>
     <div className={styles.range}>
      <div className={styles.rangeHeading}><label htmlFor="annual-spend">Annual card spending</label><output htmlFor="annual-spend">{money(annualSpend*100)}</output></div>
      <input id="annual-spend" type="range" min="0" max="20000" step="50" value={annualSpend} aria-valuetext={money(annualSpend*100)} onChange={event=>setAnnualSpend(Number(event.target.value))}/>
     </div>
     <div className={styles.range}>
      <div className={styles.rangeHeading}><label htmlFor="annual-trades">Annual trade-in value</label><output htmlFor="annual-trades">{money(annualTrades*100)}</output></div>
      <input id="annual-trades" type="range" min="0" max="20000" step="50" value={annualTrades} aria-valuetext={money(annualTrades*100)} onChange={event=>setAnnualTrades(Number(event.target.value))}/>
     </div>
    </div>
    <div className={styles.result} aria-live="polite" aria-atomic="true">
     <p className={styles.resultLabel}>Your annual advantage</p>
     <strong className={styles.benefit}>{money(value.netBenefit)}</strong>
     <p className={styles.afterFee}>After membership</p>
     <dl className={styles.breakdown}>
      <div><dt>Buy for less</dt><dd>+{money(value.purchaseSavings)}</dd></div>
      <div><dt>Trade for more</dt><dd>+{money(value.additionalCredit)}</dd></div>
      <div><dt>Membership</dt><dd>−{money(value.membershipFee)}</dd></div>
     </dl>
    </div>
   </div>
   <p className={styles.disclosure}>Illustrative comparison using {purchaseDiscount}% purchase savings and qualifying trade-ins at {memberTradePercent}% of market value versus an assumed {traditionalTradePercent}% elsewhere. Actual prices and offers vary. Trade credit is not cash.</p>
  </div>
 </section>;
}
