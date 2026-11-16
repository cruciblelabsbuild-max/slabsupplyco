import { clerkClient } from "@clerk/nextjs/server";
import { memberTrades } from "../../../lib/member-trades";
import TradeHistory from "../../../components/club/TradeHistory";
import Link from "next/link";
import { Layers, ArrowDown, BadgeCheck, PackageCheck, ArrowRight } from "lucide-react";
import { getMember } from "../../../lib/member-session";
import TradeForm from "../../../components/club/TradeForm";
export const dynamic="force-dynamic";
export const metadata = { title: "Trades · Slab Supply Co." };
export default async function TradeInsPage(){
 const member=await getMember();
 const trades=member?memberTrades((await (await clerkClient()).users.getUser(member.id)).privateMetadata.tradeRequests):[];
 return <section className="section-shell club-section-bottom"><div className="club-page-intro trade-page-heading"><p className="eyebrow">Trades</p><h1>{member?"Trades.":"Start a trade."}</h1></div>{member&&<TradeHistory trades={trades}/>}<div className="trade-workspace"><section className="trade-form-panel" id="start-trade"><h2>Your cards.</h2>{member ? <TradeForm/>:<div className="trade-guest"><p>Become a member to submit your cards for review.</p><Link className="button" href="/join?next=trades">Become a member<ArrowRight size={16}/></Link><Link className="club-text-link" href="/sign-in?next=trades">Already a member? Sign in</Link></div>}</section><aside className="member-trade-process"><p className="eyebrow">From your shelf to your next find</p>{[{icon:Layers,title:"Share your card.",text:"Card, set, grade, and slab condition."},{icon:BadgeCheck,title:"Review your quote.",text:"Approve the written offer before shipping."},{icon:PackageCheck,title:"Send it safely.",text:"Inspection confirms the agreed credit or payment."}].map(({icon:Icon,title,text},i)=><div className="member-trade-process-step" key={title}><span className="member-trade-process-icon"><Icon size={27} strokeWidth={1.2}/></span><h3>{title}</h3><p>{text}</p>{i<2 && <ArrowDown size={20} strokeWidth={1}/>}</div>)}<div className="member-trade-process-eligibility"><h3>Eligible slabs</h3><p>PSA, CGC, BGS, and other recognized grading services. Intact slabs with verifiable market value.</p><p>Raw cards, altered items, and tampered slabs are not eligible.</p></div></aside></div></section>;
}
