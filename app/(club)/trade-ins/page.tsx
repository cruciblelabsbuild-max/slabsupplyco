import { clerkClient } from "@clerk/nextjs/server";
import TradeJourney from "../../../components/TradeJourney";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getMember } from "../../../lib/member-session";
import TradesExperience from "../../../components/trades/TradesExperience";
import {importLegacyTrades,listTrades} from "../../../lib/trades/store";
export const dynamic = "force-dynamic";
export const metadata = { title: "Trades · Slab Supply Co." };
export default async function TradeInsPage({searchParams}:{searchParams:Promise<{view?:string;trade?:string}>}) {
  const member = await getMember();
  if(member){
    const query=await searchParams;
    let records;
    try{const user=await(await clerkClient()).users.getUser(member.id);await importLegacyTrades(member.id,user.privateMetadata);records=await listTrades(member.id);}catch{records=null;}
    if(!records)return <section className="section-shell club-section-bottom"><h1>Trades are unavailable.</h1><p>Your records could not be loaded. Please refresh to try again.</p></section>;
    return <TradesExperience initialTrades={records} initialView={query.view} initialId={query.trade}/>;
  }
  return <section className="section-shell club-section-bottom trade-page">
    <div className="club-page-intro trade-page-heading"><p className="eyebrow">The trade-in desk</p><h1>Trade toward<br /><em>what’s next.</em></h1></div>
    <TradeJourney />
    <div className="trade-page-start"><Link className="button" href="/join?next=trades">Start your trade <ArrowRight size={16} /></Link>{<Link className="club-text-link" href="/sign-in?next=trades">Already a member? Sign in</Link>}</div>
    <div className="trade-page-eligibility"><p>Currently accepting eligible graded Pokémon cards from PSA, CGC, BGS, and select other grading companies.</p><p>Up to 100% of fair market value in store credit on select eligible slabs, subject to review and inspection. Store credit is not cash. Raw cards and altered or tampered slabs are not eligible.</p></div>
  </section>;
}
