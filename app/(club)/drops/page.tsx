import {redirect} from "next/navigation";
import SupportLink from "../../../components/club/SupportLink";
import { getMember } from "../../../lib/member-session";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import GrailExperience from "../../../components/grails/GrailExperience";
import {grailCycle} from "../../../lib/grail-cycle";
import {confirmedGrailDrop,grailCandidates,grailInterests} from "../../../lib/grail-data";
import {membershipForUser} from "../../../lib/member-subscription";
export const dynamic="force-dynamic";
export const metadata = { title: "Grail drops · Slab Supply Co." };
export default async function DropsPage() {
 const member=await getMember();
 if(member){
  const paidMembership=await membershipForUser(member.id);
  if(paidMembership.state!=="active-test")redirect("/join?checkout=continue");
  const now=new Date(),cycle=grailCycle(now);
  const [membership,data]=await Promise.all([membershipForUser(member.id),Promise.all([confirmedGrailDrop(cycle.current),grailCandidates(cycle.next),grailInterests(member.id,cycle.next)]).catch(()=>null)]);
  return <><GrailExperience month={cycle.next} monthLabel={cycle.nextLabel} drop={data?.[0]??null} candidates={data?.[1]??[]} interests={data?.[2]??[]} active={membership.state==="active-test"} unavailable={!data||membership.state==="unavailable"} now={now.toISOString()}/><section className="section-shell"><SupportLink category="drops"/></section></>;
 }
return <><section className="club-page-intro section-shell"><p className="eyebrow">Grail drops</p><h1>A little rarer.<br/><em>A lot to love.</em></h1><p>Release times, card details, and member prices. One place for every drop.</p></section><section className="section-shell club-section-bottom"><div className="club-curated-empty"><p className="eyebrow">Release calendar</p><h2>No releases scheduled.</h2><p>There are no open releases or reservations.</p><Link className="button" href="/shop">View member deals <ArrowRight size={16}/></Link><Link className="club-text-link" href="/account">Back to your membership</Link></div></section>{member&&<section className="section-shell grail-interests-section" id="interests"><h2>Your grail interests</h2><p>No saved grail interests.</p></section>}</>;
}
