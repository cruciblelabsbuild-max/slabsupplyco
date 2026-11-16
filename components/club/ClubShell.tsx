"use client";
import {identityFirstName} from "../../lib/member-name";
import { annualMembership } from "../../lib/membership-plan";

import Link from "next/link";
import {BagTrigger} from "./BagProvider";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { ArrowRight, Menu, X, UserRound, LogOut } from "lucide-react";
import Logo from "../../app/Logo";
import MemberNavigation from "./MemberNavigation";
import { useIdentityEnabled, useInitialIdentity } from "./IdentityProvider";
const guestLinks = [["/shop", "Member deals"], ["/trade-ins", "Trade in"], ["/membership", "Membership"], ["/promise", "Our promise"]];

export function ClubHeader() {
  const enabled = useIdentityEnabled();
  return enabled ? <SessionHeader /> : <Navigation name={null} />;
}
function SessionHeader() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const initialName = useInitialIdentity();
  return <Navigation name={isLoaded ? (user ? identityFirstName(user) || initialName || "Collector" : null) : initialName} onSignOut={() => signOut({ redirectUrl: "/" })} />;
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
  if (name) return <MemberNavigation onSignOut={logout} leaving={leaving} error={error}/>;
  return <><div className="announcement"><span>Built around your collection. Founding membership · {annualMembership.display}/year.</span></div>
    <header className="site-header club-header">
      <Logo href="/" />
      <nav id="club-navigation" className={open ? "nav-links open" : "nav-links"} aria-label="Primary navigation">
        <div className="mobile-session"><span className="session-avatar"><UserRound size={18} /></span><div><strong>Welcome aboard.</strong><p>You’re browsing as a guest</p></div></div>
        {guestLinks.map(([href,label])=><Link key={href} href={href} aria-current={path.startsWith(href)?"page":undefined} onClick={()=>setOpen(false)}>{label}</Link>)}
        <div className="mobile-account-actions"><Link className="button" href="/sign-in" onClick={()=>setOpen(false)}>Sign in<ArrowRight size={15}/></Link><Link href="/join" onClick={()=>setOpen(false)}>Become a member</Link></div>
      </nav>
      <div className="club-header-actions"><BagTrigger/><Link className="session-sign-in" href="/sign-in"><UserRound size={15}/><span>Sign in</span></Link><Link className="button button-small" href="/join">Become a member<ArrowRight size={14}/></Link></div>
      <div className="public-mobile-bag"><BagTrigger/></div><button className="menu-button" type="button" aria-label={open?"Close navigation":"Open navigation"} aria-expanded={open} aria-controls="club-navigation" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
    </header>
  </>;
}
export function ClubFooter() {
  return <footer className="club-footer"><div className="section-shell footer-top"><Logo /><p>Independent. Built for graded-card collectors.</p><nav className="footer-links" aria-label="Footer"><Link href="/promise">Our promise</Link><Link href="/help">Help</Link><Link href="/account">My account</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></div><div className="section-shell footer-bottom"><p>© 2026 Slab Supply Co. All rights reserved.</p><p>Independent. Not affiliated with Pokémon, Nintendo, or any grading company.</p></div></footer>;
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

export function ProfileSignOut(){return useIdentityEnabled()?<SessionProfileSignOut/>:null;}
function SessionProfileSignOut(){const {signOut}=useClerk();const [pending,setPending]=useState(false);const [error,setError]=useState("");async function leave(){setPending(true);try{await signOut({redirectUrl:"/"});}catch{setPending(false);setError("Sign-out failed. Please try again.");}}return <div className="profile-signout"><button type="button" onClick={leave} disabled={pending}><LogOut size={17}/>{pending?"Signing out…":"Sign out"}</button>{error&&<p role="alert">{error}</p>}</div>;}
