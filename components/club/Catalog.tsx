"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, LockKeyhole, Search } from "lucide-react";
import { dollars } from "../../lib/catalog";
import CardPricing from "../CardPricing";
import GradedCardImage from "./GradedCardImage";
export type SelectionCard = { slug: string; image: string; name: string; year: string; set: string; grade: string; grader: string; gradeNumber: number; retail: number; member: number; description: string };
export default function Catalog({ selection, hasAccess }: { selection: readonly SelectionCard[]; hasAccess: boolean }) {
  const [grader, setGrader] = useState("All graders");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("curated");
  const cards = selection.filter(card => (grader === "All graders" || card.grader === grader) && `${card.name} ${card.set} ${card.grade}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === "low" ? a.member - b.member : sort === "high" ? b.member - a.member : 0);
  return <>
    {!hasAccess && <div className="catalog-member-access"><span><LockKeyhole size={17} /> Member access</span><Link className="button button-small" href="/join">Become a member <ArrowRight size={15} /></Link></div>}
    <div className="catalog-tools"><div className="catalog-tabs" role="group" aria-label="Grading companies">{["All graders", "PSA", "CGC", "BGS"].map(tab => <button type="button" key={tab} aria-pressed={grader === tab} onClick={() => setGrader(tab)}>{tab}</button>)}</div><label className="catalog-search"><Search size={16} /><span className="sr-only">Search cards</span><input type="search" placeholder="Find your next card" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="catalog-sort"><span className="sr-only">Sort cards</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="curated">Curated order</option><option value="low">Member price: low to high</option><option value="high">Member price: high to low</option></select></label></div>
    <p className="catalog-count" aria-live="polite">{cards.length} {cards.length === 1 ? "card" : "cards"}</p>
    <div className="club-catalog-grid selection-grid">{cards.map((card, index) => <article className="club-product" key={card.slug}><Link className="club-product-art" href={`/shop/${card.slug}`} aria-label={`View ${card.name}, ${card.grade}`}><GradedCardImage image={card.image} name={card.name} grade={card.grade} grader={card.grader} eager={index < 3} /></Link><div className="club-product-copy"><p className="eyebrow">{card.year} · {card.set} · {card.grade}</p><h2><Link href={`/shop/${card.slug}`}>{card.name}</Link></h2><CardPricing retail={dollars(card.retail)} member={dollars(card.member)} savings={dollars(card.retail - card.member)} /><Link className="club-text-link" href={`/shop/${card.slug}`}>View card <ArrowRight size={15} /></Link></div></article>)}</div>
    {cards.length === 0 && <div className="club-empty"><h2>No cards found.</h2><p>Try a different name or grader.</p><button className="button" onClick={() => { setSearch(""); setGrader("All graders"); }}>Show all cards</button></div>}
  </>;
}
