"use client";
import Link from "next/link";
import {BagTrigger} from "./BagProvider";
import { useState } from "react";
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
  const [hovered,setHovered]=useState(false);

  function links(){return destinations.map(({href,label,icon:Icon})=><Link key={href} href={href} title={label} aria-current={(href==="/account"?path===href:path.startsWith(href))?"page":undefined}><Icon size={19} strokeWidth={1.5}/><span>{label}</span></Link>);}
  return <><aside className="member-sidebar" data-expanded={hovered} aria-label="Member navigation" onPointerEnter={event=>{if(event.pointerType!=="touch")setHovered(true);}} onPointerLeave={()=>setHovered(false)}><Logo href="/account"/><nav aria-label="Primary navigation">{links()}</nav><div className="member-sidebar-bottom"><BagTrigger compact/><Link href="/account/profile" title="Profile" aria-current={path.startsWith('/account/profile')?'page':undefined}><UserRound size={19} strokeWidth={1.5}/><span>Profile</span></Link><button type="button" title="Sign out" onClick={onSignOut} disabled={leaving}><LogOut size={18} strokeWidth={1.5}/><span>{leaving?"Signing out…":"Sign out"}</span></button>{error&&<p role="alert">{error}</p>}</div></aside><header className="member-mobile-header"><Logo href="/account"/><BagTrigger/><Link href="/account/profile" title="Profile" aria-current={path.startsWith('/account/profile')?'page':undefined}><UserRound size={18} strokeWidth={1.5}/><span>Profile</span></Link></header><nav className="member-mobile-nav" aria-label="Primary navigation">{links()}</nav></>;
}
