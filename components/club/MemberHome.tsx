import {annualMembership} from "../../lib/membership-plan";
import HomeGrailStatus from "../grails/HomeGrailStatus";
import type {GrailDrop} from "../../lib/grail-data";
import TradeSubmissionNotice from "../trades/TradeSubmissionNotice";
import MemberWelcome from "./MemberWelcome";
import {displayMemberMoney} from "../../lib/member-home-metrics";
import Link from "next/link";
import { ArrowRight,ArrowUpRight,Repeat2,Gem } from "lucide-react";
import {catalog} from "../../lib/catalog";
export default function MemberHome({name,memberId,active,unavailable=false,creditCents=0,savingsCents=0,activeTrades=0,pendingCents=0,renewsAt,activeUntil,grailDrop=null,grailUnavailable=false,pendingStage="No pending trades"}:{name:string;memberId?:string;active:boolean;unavailable?:boolean;creditCents?:number|null;savingsCents?:number|null;activeTrades?:number|null;pendingCents?:number|null;pendingStage?:string;renewsAt?:number|null;activeUntil?:number|null;grailDrop?:GrailDrop|null;grailUnavailable?:boolean}){
 const timestamp=renewsAt||activeUntil;
 const membershipDate=timestamp?new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(timestamp*1000)):null;
 return <div className="club-dashboard"><section className="section-shell member-home-heading"><h1>Welcome back, <em>{name}.</em></h1><Link className="member-pass" href="/account/profile#membership" aria-label={`Membership ${active?"active":unavailable?"unavailable":"not active"}. Manage membership`}><div className="member-pass-top"><span>Slab Supply Co.</span><Gem size={25} strokeWidth={1}/></div><div className="member-pass-identity"><strong>{name}</strong><span className={active?"member-pass-status is-active":"member-pass-status"}><i/>{active?"Active":unavailable?"Unavailable":"Not active"}</span></div><div className="member-pass-footer"><span className="member-pass-manage">Manage membership<ArrowUpRight size={13}/></span><span className="member-pass-credit"><span>{membershipDate?renewsAt?"Renews":"Active until":"Annual membership"}</span><strong>{membershipDate||`${annualMembership.display}/year`}</strong></span></div></Link></section>
 <TradeSubmissionNotice/>
 <section className="section-shell member-home-metrics" aria-label="Membership overview"><dl>
 <div><dt>Total member savings</dt><dd><Link href="/account/orders">{displayMemberMoney(savingsCents)}</Link></dd><dd className="member-metric-note">Across completed purchases</dd></div>
 <div><dt>Available credit</dt><dd>{displayMemberMoney(creditCents)}</dd><dd className="member-metric-note">Ready to spend</dd></div>
 <div><dt>Pending credit</dt><dd>{displayMemberMoney(pendingCents)}</dd><dd className="member-metric-note">{pendingCents===null?"Status unavailable":pendingStage}</dd></div>
 <div><dt>Active trade-ins</dt><dd><Link href="/trade-ins?view=trades#your-trades" aria-label={`${activeTrades??"Unavailable"} active trade-ins. View my trades`}>{activeTrades??"Unavailable"}</Link></dd><dd className="member-metric-note"><Link href="/trade-ins?view=trades#your-trades">View My trades →</Link></dd></div>
 </dl></section>
 <section className="section-shell member-wide-deals"><div className="dashboard-availability"><div><p className="eyebrow">Member deals</p><h2>Your next find belongs here.</h2><Link className="button" href="/shop">View member deals<ArrowRight size={16}/></Link></div><img src={catalog[0].image} alt="Graded Snorlax card"/></div></section>
 <section className="section-shell dashboard-services member-original-services"><article className="dashboard-trade"><p className="eyebrow">Trade in</p><Repeat2 size={30} strokeWidth={1}/><h2>Make your collection<br/><em>go further.</em></h2><p>Put the cards you’re ready to move toward the ones you can’t stop thinking about.</p><Link className="button" href="/trade-ins#start-trade">Start a trade<ArrowRight size={16}/></Link></article><article className="dashboard-release"><div><p className="eyebrow">Grail drops</p><h2>A little rarer.<br/><em>A lot to love.</em></h2><HomeGrailStatus drop={grailDrop} unavailable={grailUnavailable||unavailable} now={new Date().toISOString()}/><Link className="button button-light" href="/drops">View grail drops<ArrowRight size={16}/></Link></div><img src={catalog[5].image} alt="Pikachu with Grey Felt Hat"/></article></section>
 {active&&memberId&&<MemberWelcome memberId={memberId}/>}</div>;
}
