import { clerkClient } from "@clerk/nextjs/server";
import { memberTrades } from "../../../../lib/member-trades";
import Link from "next/link";
import { ShoppingBag, Repeat2, Gem, ArrowRight, MapPin } from "lucide-react";
import { requireMember } from "../../../../lib/member-session";
export const dynamic = "force-dynamic";
export const metadata = { title: "Orders & activity · Slab Supply Co.", robots: { index: false, follow: false } };
const sections = {
 orders: { title:"Orders", designation:"Member deal order", description:"Card purchases, payment status, and delivery details.", empty:"No orders.", copy:"Your card purchases live here.", action:"Browse member deals", href:"/shop", icon:ShoppingBag },
 trades: { title:"Trade-ins", designation:"Trade-in request", description:"Cards submitted to the desk, quotes, and agreed credit.", empty:"No trade-in requests.", copy:"Your submitted slabs and trade-in quotes live here.", action:"Start a trade", href:"/trade-ins#start-trade", icon:Repeat2 },
 interests: { title:"Grail interests", designation:"Grail interest", description:"The releases you follow. Interest is not a reservation or purchase.", empty:"No saved grail interests.", copy:"Your followed releases live here.", action:"View grail releases", href:"/drops", icon:Gem },
};
export default async function OrdersPage({searchParams}:{searchParams:Promise<{view?:string}>}) {
 const member = await requireMember();
 const {view}=await searchParams;
 const key=view && Object.hasOwn(sections,view) ? view as keyof typeof sections : "orders";
 const section=sections[key];const Icon=section.icon;
 const trades=key === "trades" ? memberTrades((await (await clerkClient()).users.getUser(member.id)).privateMetadata.tradeRequests):[];
 return <section className="section-shell club-section-bottom"><div className="club-page-intro"><p className="eyebrow">Activity</p><h1>Every card.<br/><em>In its place.</em></h1></div><nav className="member-activity-tabs" aria-label="Activity type">{Object.entries(sections).map(([id,item])=><Link key={id} href={`/account/orders?view=${id}`} aria-current={key===id ? "page":undefined}><item.icon size={16}/>{item.title}</Link>)}</nav><div className="activity-description"><span className="eyebrow">{section.designation}</span><p>{section.description}</p></div>{trades.length ? <div className="member-trade-history">{trades.map(trade=><details key={trade.id}><summary><div><span className="eyebrow">Trade-in request / {trade.id.slice(-8).toUpperCase()}</span><h2>{trade.cardName}</h2><p>{trade.year} · {trade.set} · {trade.grader} {trade.grade}</p></div><span className="trade-status">{trade.status}</span></summary><div className="trade-history-detail"><p><strong>Submitted</strong> {new Date(trade.createdAt).toLocaleDateString("en-US",{timeZone:"America/New_York"})}</p><p><strong>Condition</strong> {trade.condition}</p>{trade.goal && <p><strong>Trading toward</strong> {trade.goal}</p>}</div></details>)}</div>:<div className="activity-empty"><Icon size={32} strokeWidth={1}/><h2>{section.empty}</h2><p>{section.copy}</p><Link className="button" href={section.href}>{section.action}<ArrowRight size={16}/></Link></div>}{key==="orders" && <Link className="member-address-link" href="/account/profile"><MapPin size={17}/><span>Manage your shipping address</span><ArrowRight size={15}/></Link>}</section>;
}
