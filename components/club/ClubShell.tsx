"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { ArrowRight, Menu, X, UserRound, LogOut } from "lucide-react";
import Logo from "../../app/Logo";
import { useIdentityEnabled, useInitialIdentity } from "./IdentityProvider";
const guestLinks = [["/membership", "Membership"], ["/promise", "Our promise"]];
const memberLinks = [["/account", "Home"], ["/shop", "Member deals"], ["/trade-ins", "Trade in"], ["/drops", "Grail drops"], ["/account/orders", "Activity"]];
export function ClubHeader() {
  const enabled = useIdentityEnabled();
  return enabled ? <SessionHeader /> : <Navigation name={null} />;
}
function SessionHeader() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const initialName = useInitialIdentity();
  return <Navigation name={isLoaded ? (user ? user.firstName || "Collector" : null) : initialName} onSignOut={() => signOut({ redirectUrl: "/" })} />;
}
function Navigation({ name, onSignOut }: { name: string | null; onSignOut?: () => Promise<unknown> }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setLeaving(true); setError("");
    try { await onSignOut?.(); } catch { setLeaving(false); setError("Sign-out failed. Please try again."); }
  }
  return <>{!name && <div className="announcement"><span>{name ? `Welcome back, ${name}. Your collection starts here.` : "Built around your collection. Founding membership · $99/year."}</span></div>}
    <header className={name ? "site-header club-header club-header-member" : "site-header club-header"}>
      <Logo href={name ? "/account" : "/"} />
      <nav id="club-navigation" className={open ? "nav-links open" : "nav-links"} aria-label="Primary navigation">
        <div className="mobile-session"><span className="session-avatar"><UserRound size={18} /></span><div><strong>{name ? `Hi, ${name}.` : "Welcome to the club."}</strong><p>{name ? "Signed in · Your account" : "You’re browsing as a guest"}</p></div></div>
        {(name ? memberLinks : guestLinks).map(([href, label]) => <Link key={href} href={href} aria-current={(href === "/account" ? path === href : path.startsWith(href)) ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}
        {<div className="mobile-account-actions">{name ? <><Link href="/account/billing" onClick={() => setOpen(false)}>Manage billing</Link><Link href="/account/profile" onClick={() => setOpen(false)}>Account settings</Link><button type="button" onClick={logout} disabled={leaving}><LogOut size={15} /> {leaving ? "Signing out…" : "Sign out"}</button></> : <><Link className="button" href="/sign-in" onClick={() => setOpen(false)}>Sign in <ArrowRight size={15} /></Link><Link href="/join" onClick={() => setOpen(false)}>Become a member</Link></>}</div>}
      </nav>
      <div className="club-header-actions">{name ? <Link className="session-account-link" href="/account/profile" onClick={() => setOpen(false)}><span className="session-avatar">{name.slice(0, 1).toUpperCase()}</span><span>Profile</span></Link> : <Link className="session-sign-in" href="/sign-in" onClick={() => setOpen(false)}><UserRound size={15} /><span>Sign in</span></Link>}{name && <button className="session-desktop-out" type="button" onClick={logout} disabled={leaving} aria-label="Sign out"><LogOut size={14} /><span>{leaving ? "Signing out…" : "Sign out"}</span></button>}{!name && <Link className="button button-small" href="/join" onClick={() => setOpen(false)}>Become a member <ArrowRight size={14} /></Link>}</div>
      <button className="menu-button" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="club-navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </header>{error && <p className="club-form-error" role="alert">{error}</p>}
    {name && <nav className="club-member-nav" aria-label="Club navigation">{memberLinks.map(([href,label]) => <Link key={href} href={href} aria-current={(href === "/account" ? path === href : path.startsWith(href)) ? "page" : undefined}>{label}</Link>)}</nav>}
  </>;
}
export function ClubFooter() {
  return <footer className="club-footer"><div className="section-shell footer-top"><Logo /><p>An independent buying club for graded-card collectors.</p><nav className="footer-links" aria-label="Footer"><Link href="/promise">Our promise</Link><Link href="/help">Help</Link><Link href="/account">My account</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></div><div className="section-shell footer-bottom"><p>© 2026 Slab Supply Co. All rights reserved.</p><p>Independent. Not affiliated with Pokémon, Nintendo, or any grading company.</p></div></footer>;
}

export function MobileAccountBar() {
  return useIdentityEnabled() ? <SessionMobileBar /> : <GuestMobileBar />;
}
function GuestMobileBar() {
  return <div className="mobile-bar"><Link className="button" href="/join">Become a member <ArrowRight size={16} /></Link></div>;
}
function SessionMobileBar() {
  const { user, isLoaded } = useUser();
  const initialName = useInitialIdentity();
  return (isLoaded ? Boolean(user) : Boolean(initialName)) ? <div className="mobile-bar"><Link className="button" href="/account">Home <ArrowRight size={16} /></Link></div> : <GuestMobileBar />;
}
