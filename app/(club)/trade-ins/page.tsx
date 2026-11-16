import { clerkClient } from "@clerk/nextjs/server";
import { memberTrades } from "../../../lib/member-trades";
import TradeHistory from "../../../components/club/TradeHistory";
import TradeJourney from "../../../components/TradeJourney";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getMember } from "../../../lib/member-session";
import TradeForm from "../../../components/club/TradeForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Trades · Slab Supply Co." };
export default async function TradeInsPage() {
  const member = await getMember();
  const trades = member ? memberTrades((await (await clerkClient()).users.getUser(member.id)).privateMetadata.tradeRequests) : [];
  return <section className="section-shell club-section-bottom trade-page">
    <div className="club-page-intro trade-page-heading"><p className="eyebrow">The trade-in desk</p><h1>Trade toward<br /><em>what’s next.</em></h1></div>
    <TradeJourney />
    <div className="trade-page-start"><Link className="button" href={member ? "#start-trade" : "/join?next=trades"}>Start your trade <ArrowRight size={16} /></Link>{!member && <Link className="club-text-link" href="/sign-in?next=trades">Already a member? Sign in</Link>}</div>
    <div className="trade-page-eligibility"><p>Currently accepting eligible graded Pokémon cards from PSA, CGC, BGS, and select other grading companies.</p><p>Up to 100% of fair market value in store credit on select eligible slabs, subject to review and inspection. Store credit is not cash. Raw cards and altered or tampered slabs are not eligible.</p></div>
    {member && <><section className="trade-form-panel trade-submission" id="start-trade"><h2>Your cards.</h2><TradeForm /></section><TradeHistory trades={trades} /></>}
  </section>;
}
