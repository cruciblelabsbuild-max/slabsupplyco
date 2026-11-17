"use client";
import {useEffect,useRef} from "react";
import styles from "./trades.module.css";
export default function TradeSubmissionTransition({onFinished}:{onFinished:()=>void}){
 const finish=useRef(onFinished);
 useEffect(()=>{const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;const timer=window.setTimeout(()=>finish.current(),reduced?650:2250);return()=>window.clearTimeout(timer);},[]);
 return <section className={styles.sentTransition} role="status" aria-live="polite">
  <svg className={styles.packingArt} viewBox="0 0 400 260" aria-hidden="true">
   <ellipse className={styles.packingShadow} cx="202" cy="227" rx="91" ry="10"/>
   <g className={styles.packingParcel}>
    <path d="m115 131 83-33 89 33-84 35Z" fill="var(--forest-deep)"/>
    {[0,1,2].map(i=><g key={i} className={styles.packingSlab} style={{animationDelay:`${i*160}ms`}}><g transform={`translate(${164+i*7} ${26-i*5}) rotate(${(i-1)*7} 29 42)`}><rect width="58" height="84" rx="7" fill="var(--paper)" stroke="var(--forest)" strokeWidth="2"/><rect x="5" y="5" width="48" height="13" rx="2" fill="var(--coral)"/><path d="M10 10h26m-26 4h19" stroke="var(--paper)" strokeWidth="2"/><rect x="5" y="23" width="48" height="55" rx="3" fill="var(--forest)"/><path d="m29 37 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="var(--cream)"/></g></g>)}
    <path d="m115 131 88 35v67l-88-35Z" fill="var(--paper)" stroke="var(--forest)" strokeWidth="1.5"/>
    <path d="m203 166 84-35v67l-84 35Z" fill="var(--cream)" stroke="var(--forest)" strokeWidth="1.5"/>
    <path className={styles.parcelLid} d="m115 131 83-33 89 33-84 35Z" fill="var(--paper)" stroke="var(--forest)" strokeWidth="1.5"/>
    <path className={styles.parcelSeal} d="m188 105 14-6 16 6-15 6v119l-15-6Z" fill="var(--coral)"/>
    <text x="128" y="174" transform="rotate(21 128 174)" fill="var(--forest)" fontFamily="Manrope, sans-serif" fontSize="6" fontWeight="700" letterSpacing=".3">SLAB SUPPLY CO.</text>
    <path d="m131 188 8 3v12l-8-3Zm12 5 20 8m-20-3 14 6" stroke="var(--forest)" fill="none" strokeWidth="1.5"/>
   </g>
  </svg>
  <h2>Your trade is on its way.</h2><p>We’ll let you know when your offer is ready.</p>
 </section>;
}
