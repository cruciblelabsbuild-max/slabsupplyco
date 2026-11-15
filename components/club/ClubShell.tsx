"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import Logo from "../../app/Logo";
const links = [["/shop", "Member shelf"], ["/drops", "Grail drops"], ["/trade-ins", "Trade-ins"], ["/membership", "Membership"]];
export function ClubHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return <><div className="announcement"><span>Built around your collection. Founding membership · $99/year.</span></div><header className="site-header club-header"><Logo /><nav className={open ? "nav-links open" : "nav-links"} aria-label="Primary navigation">{links.map(([href, label]) => <Link key={href} href={href} aria-current={path.startsWith(href) ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}<Link className="club-mobile-account" href="/account" onClick={() => setOpen(false)}>Manage membership</Link></nav><div className="club-header-actions"><Link className="club-account-link" href="/account" onClick={() => setOpen(false)}>My membership</Link><Link className="button button-small" href="/join" onClick={() => setOpen(false)}>Join the club <ArrowRight size={14} /></Link></div><button className="menu-button" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></header></>;
}
export function ClubFooter() {
  return <footer className="club-footer"><div className="section-shell footer-top"><Logo /><p>An independent buying club for graded-card collectors.</p><nav className="footer-links" aria-label="Footer"><Link href="/promise">Our promise</Link><Link href="/help">Help</Link><Link href="/account">Billing</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></div><div className="section-shell footer-bottom"><p>© 2026 Slab Supply Co. All rights reserved.</p><p>Independent. Not affiliated with Pokémon, Nintendo, or any grading company.</p></div></footer>;
}
