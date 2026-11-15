"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { ArrowRight, Menu, X, UserRound, LogOut } from "lucide-react";
import Logo from "../../app/Logo";
import { useIdentityEnabled } from "./IdentityProvider";
const links = [["/shop", "Member shelf"], ["/drops", "Grail drops"], ["/trade-ins", "Trade-ins"], ["/membership", "Membership"]];
export function ClubHeader() {
  const enabled = useIdentityEnabled();
  return enabled ? <SessionHeader /> : <Navigation name={null} loading={false} />;
}
function SessionHeader() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  return <Navigation name={user ? user.firstName || "Collector" : null} loading={!isLoaded} onSignOut={() => signOut({ redirectUrl: "/" })} />;
}
function Navigation({ name, loading, onSignOut }: { name: string | null; loading: boolean; onSignOut?: () => Promise<unknown> }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setLeaving(true); setError("");
    try { await onSignOut?.(); } catch { setLeaving(false); setError("Sign-out failed. Please try again."); }
  }
  return <><div className="announcement"><span>{name ? `Welcome back, ${name}. Your collection starts here.` : "Built around your collection. Founding membership · $99/year."}</span></div>
    <header className="site-header club-header">
      <Logo />
      <nav id="club-navigation" className={open ? "nav-links open" : "nav-links"} aria-label="Primary navigation">
        <div className="mobile-session"><span className="session-avatar"><UserRound size={18} /></span><div><strong>{loading ? "Checking your account…" : name ? `Hi, ${name}.` : "Welcome to the club."}</strong><p>{loading ? "" : name ? "Signed in · Your account" : "You’re browsing as a guest"}</p></div></div>
        {links.map(([href, label]) => <Link key={href} href={href} aria-current={path.startsWith(href) ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}
        {!loading && <div className="mobile-account-actions">{name ? <><Link href="/account" onClick={() => setOpen(false)}>My account <ArrowRight size={15} /></Link><Link href="/account/billing" onClick={() => setOpen(false)}>Manage billing</Link><Link href="/account/profile" onClick={() => setOpen(false)}>Account settings</Link><button type="button" onClick={logout} disabled={leaving}><LogOut size={15} /> {leaving ? "Signing out…" : "Sign out"}</button></> : <><Link className="button" href="/sign-in" onClick={() => setOpen(false)}>Sign in <ArrowRight size={15} /></Link><Link href="/sign-up" onClick={() => setOpen(false)}>Create an account</Link></>}</div>}
      </nav>
      <div className="club-header-actions">{loading ? <span className="session-loading" role="status">Checking account…</span> : name ? <Link className="session-account-link" href="/account" onClick={() => setOpen(false)}><span className="session-avatar">{name.slice(0, 1).toUpperCase()}</span><span>My account</span></Link> : <Link className="session-sign-in" href="/sign-in" onClick={() => setOpen(false)}><UserRound size={15} /><span>Sign in</span></Link>}{name && <button className="session-desktop-out" type="button" onClick={logout} disabled={leaving} aria-label="Sign out"><LogOut size={16} /></button>}{!name && <Link className="button button-small" href="/join" onClick={() => setOpen(false)}>Join the club <ArrowRight size={14} /></Link>}</div>
      <button className="menu-button" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="club-navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </header>{error && <p className="club-form-error" role="alert">{error}</p>}
    {name && <div className="member-mobile-bar"><span><span className="status-dot" /> Signed in as {name}</span><Link href="/account">My account <ArrowRight size={13} /></Link></div>}
  </>;
}
export function ClubFooter() {
  return <footer className="club-footer"><div className="section-shell footer-top"><Logo /><p>An independent buying club for graded-card collectors.</p><nav className="footer-links" aria-label="Footer"><Link href="/promise">Our promise</Link><Link href="/help">Help</Link><Link href="/account">My account</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></div><div className="section-shell footer-bottom"><p>© 2026 Slab Supply Co. All rights reserved.</p><p>Independent. Not affiliated with Pokémon, Nintendo, or any grading company.</p></div></footer>;
}

export function MobileAccountBar() {
  return useIdentityEnabled() ? <SessionMobileBar /> : <GuestMobileBar />;
}
function GuestMobileBar() {
  return <div className="mobile-bar"><Link className="button" href="/join">Join the club <ArrowRight size={16} /></Link></div>;
}
function SessionMobileBar() {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return null;
  return user ? <div className="mobile-bar"><Link className="button" href="/account">My account <ArrowRight size={16} /></Link></div> : <GuestMobileBar />;
}
