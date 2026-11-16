import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag, ArrowRight, MapPin } from "lucide-react";
import { requireMember } from "../../../../lib/member-session";
export const dynamic="force-dynamic";
export const metadata={title:"Orders · Slab Supply Co.",robots:{index:false,follow:false}};
export default async function OrdersPage({searchParams}:{searchParams:Promise<{view?:string}>}){
 await requireMember();const {view}=await searchParams;
 if(view==="trades")redirect("/trade-ins#your-trades");
 if(view==="interests")redirect("/drops#interests");
 return <section className="section-shell club-section-bottom"><div className="club-page-intro"><p className="eyebrow">Orders</p><h1>Your orders.</h1></div><div className="activity-empty"><ShoppingBag size={32} strokeWidth={1}/><h2>No orders.</h2><p>Your card purchases and delivery details live here.</p><Link className="button" href="/shop">Browse member deals<ArrowRight size={16}/></Link></div><Link className="member-address-link" href="/account/profile#shipping"><MapPin size={17}/><span>Manage your shipping address</span><ArrowRight size={15}/></Link></section>;
}
