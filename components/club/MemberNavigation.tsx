"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tags, Repeat2, Gem, ShoppingBag, UserRound, LogOut } from "lucide-react";
import Logo from "../../app/Logo";
const destinations = [
  {href:"/account",label:"Home",icon:Home},
  {href:"/shop",label:"Member deals",icon:Tags},
  {href:"/trade-ins",label:"Trades",icon:Repeat2},
  {href:"/drops",label:"Grail drops",icon:Gem},
  {href:"/account/orders",label:"Orders",icon:ShoppingBag},
];
export default function MemberNavigation({onSignOut,leaving=false,error=""}:{onSignOut:()=>void;leaving?:boolean;error?:string}) {
  const path=usePathname();
  function links(){return destinations.map(({href,label,icon:Icon})=><Link key={href} href={href} aria-current={(href==="/account"?path===href:path.startsWith(href))?"page":undefined}><Icon size={19} strokeWidth={1.5}/><span>{label}</span></Link>);}
  return <><aside className="member-sidebar" aria-label="Member navigation"><Logo href="/account"/><nav aria-label="Primary navigation">{links()}</nav><div className="member-sidebar-bottom"><Link href="/account/profile" aria-current={path.startsWith('/account/profile')?'page':undefined}><UserRound size={19} strokeWidth={1.5}/><span>Profile</span></Link><button type="button" onClick={onSignOut} disabled={leaving}><LogOut size={18} strokeWidth={1.5}/><span>{leaving?"Signing out…":"Sign out"}</span></button>{error&&<p role="alert">{error}</p>}</div></aside><header className="member-mobile-header"><Logo href="/account"/><Link href="/account/profile" aria-current={path.startsWith('/account/profile')?'page':undefined}><UserRound size={18} strokeWidth={1.5}/><span>Profile</span></Link></header><nav className="member-mobile-nav" aria-label="Primary navigation">{links()}</nav></>;
}
