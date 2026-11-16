import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShoppingBag, Repeat2, Gem, CreditCard } from "lucide-react";
export default function MemberHome({ name, active, unavailable = false }: { name: string; active: boolean; unavailable?: boolean }) {
 const actions=[
  {label:"Member deals",icon:ShoppingBag,copy:"No cards available.",href:"/shop",action:"View member deals"},
  {label:"Trade in",icon:Repeat2,copy:"Put your slabs toward your next card.",href:"/trade-ins#start-trade",action:"Start a trade"},
  {label:"Grail drops",icon:Gem,copy:"No drops scheduled.",href:"/drops",action:"View grail drops"},
 ];
 return <div className="club-dashboard"><section className="section-shell member-home-heading"><h1>Welcome back, <em>{name}.</em></h1><div className="member-home-status"><span>Membership</span><strong><i className={active ? "membership-dot active":"membership-dot"}/>{active ? "Active":unavailable ? "Unavailable":"Not active"}</strong><Link href={active || unavailable ? "/account/billing":"/join"}>{active ? "Manage":unavailable ? "Check billing":"Activate"}<ArrowUpRight size={13}/></Link></div></section><section className="section-shell member-action-grid">{actions.map(({label,icon:Icon,copy,href,action},i)=><article className={`member-action-card member-action-${i}`} key={href}><div className="member-action-top"><Icon size={27} strokeWidth={1.2}/></div><h2>{label}</h2><p>{copy}</p><Link className="button" href={href}>{action}<ArrowRight size={15}/></Link></article>)}</section><section className="section-shell dashboard-utility"><Link href="/account/orders">Orders & activity <ArrowUpRight size={14}/></Link><Link href="/account/profile">Your profile <ArrowUpRight size={14}/></Link><Link href="/account/billing"><CreditCard size={16}/> Billing & renewal <ArrowUpRight size={14}/></Link></section></div>;
}
