import {pendingActivation} from "../../../lib/membership-activation";
import {redirect} from "next/navigation";
import {confirmedGrailDrop} from "../../../lib/grail-data";
import {grailCycle} from "../../../lib/grail-cycle";
import {ordersForUser,orderSavings} from "../../../lib/member-orders";
import {clerkClient} from "@clerk/nextjs/server";
import {memberHomeMetrics} from "../../../lib/member-home-metrics";
import { requireMember } from "../../../lib/member-session";
import { membershipForUser } from "../../../lib/member-subscription";
import {importLegacyTrades,listTrades,tradeSummary,tradeCreditBalance} from "../../../lib/trades/store";
import {pendingTradeStage} from "../../../lib/trades/presentation";
import MemberHome from "../../../components/club/MemberHome";
export const dynamic = "force-dynamic";
export const metadata = { title: "Member home · Slab Supply Co.", robots: { index: false, follow: false } };
export default async function MemberArea() {
 const member = await requireMember();
 const membership=await membershipForUser(member.id);
 if(membership.state!=="active-test")redirect("/join?checkout=continue");
 const activation=await pendingActivation(member.id);if(activation)redirect(activation);
 const [user,orders,grails] = await Promise.all([(await clerkClient()).users.getUser(member.id).catch(()=>null),ordersForUser(member.id),confirmedGrailDrop(grailCycle().current).then(drop=>({drop,unavailable:false})).catch(()=>({drop:null,unavailable:true}))]);
 const metrics=memberHomeMetrics(user?.privateMetadata??null);
 let pendingCents:number|null=null;let pendingStage="Status unavailable";
 try{if(!user)throw Error("Member unavailable");await importLegacyTrades(member.id,user.privateMetadata);const [trades,issued]=await Promise.all([listTrades(member.id),tradeCreditBalance(member.id)]);const summary=tradeSummary(trades);pendingCents=summary.pendingCents;pendingStage=pendingTradeStage(trades);metrics.activeTrades=summary.active.length;if(metrics.creditCents!==null)metrics.creditCents+=issued;}catch{metrics.creditCents=null;metrics.activeTrades=null;}
 const savings=orderSavings(orders);
 metrics.savingsCents=metrics.savingsCents===null||savings===null?null:metrics.savingsCents+savings;
 return <MemberHome grailDrop={grails.drop} grailUnavailable={grails.unavailable} renewsAt={membership.renewsAt} activeUntil={membership.activeUntil} pendingCents={pendingCents} pendingStage={pendingStage} {...metrics} memberId={member.id} name={member.name} active={membership.state === "active-test"} unavailable={false}/>;
}
