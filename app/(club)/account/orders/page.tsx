import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag, ArrowRight, MapPin, Check } from "lucide-react";
import { requireMember } from "../../../../lib/member-session";
import { ordersForUser } from "../../../../lib/member-orders";
import { displayMemberMoney } from "../../../../lib/member-home-metrics";
export const dynamic="force-dynamic";
export const metadata={title:"Orders · Slab Supply Co.",robots:{index:false,follow:false}};
export default async function OrdersPage({searchParams}:{searchParams:Promise<{view?:string;session_id?:string}>}){
 const member=await requireMember();const {view,session_id}=await searchParams;
 if(view==="trades")redirect("/trade-ins#your-trades");
 if(view==="interests")redirect("/drops#interests");
 const orders=await ordersForUser(member.id);
 const confirmed=orders?.some(order=>order.id===session_id);
 return <section className="section-shell club-section-bottom"><div className="club-page-intro"><p className="eyebrow">Orders</p><h1>Your orders.</h1></div>{confirmed&&<div className="order-confirmation" role="status"><Check size={19}/>Purchase confirmed. Your card and receipt are saved here.</div>}{session_id&&!confirmed&&<p className="club-notice" role="status">Your payment has not been confirmed here yet. Refresh to check its status before trying again.</p>}{orders===null?<div className="activity-empty"><h2>We couldn’t load your orders.</h2><p>Please refresh to try again.</p></div>:orders.length?<div className="member-orders">{orders.map(order=><article className="member-order" key={order.id}><img src={order.image} alt={order.name}/><div><p className="eyebrow">{new Date(order.created*1000).toLocaleDateString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",year:"numeric"})} · {order.status==="paid"?"Paid":order.status==="refunded"?"Refunded":"Partially refunded"}</p><h2>{order.name}</h2><p>{order.grade}</p><div className="order-amounts"><span>Card <b>{displayMemberMoney(order.cardCents)}</b></span>{order.membershipCents>0&&<span>Annual membership <b>{displayMemberMoney(order.membershipCents)}</b></span>}<span>Total <b>{displayMemberMoney(order.totalCents)}</b></span></div>{order.shipping&&<div className="order-shipping"><span>Ship to</span><p>{order.shipping.name}<br/>{[order.shipping.address?.line1,order.shipping.address?.line2,order.shipping.address?.city,order.shipping.address?.state,order.shipping.address?.postal_code,order.shipping.address?.country].filter(Boolean).join(", ")}</p></div>}<small>Order {order.id.slice(-12).toUpperCase()}</small></div></article>)}</div>:<div className="activity-empty"><ShoppingBag size={32} strokeWidth={1}/><h2>No orders.</h2><p>Your card purchases and delivery details live here.</p><Link className="button" href="/shop">Browse member deals<ArrowRight size={16}/></Link></div>}<Link className="member-address-link" href="/account/profile#shipping"><MapPin size={17}/><span>Manage your shipping address</span><ArrowRight size={15}/></Link></section>;
}
