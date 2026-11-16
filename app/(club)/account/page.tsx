import {clerkClient} from "@clerk/nextjs/server";
import {memberHomeMetrics} from "../../../lib/member-home-metrics";
import { requireMember } from "../../../lib/member-session";
import { membershipForUser } from "../../../lib/member-subscription";
import MemberHome from "../../../components/club/MemberHome";
export const dynamic = "force-dynamic";
export const metadata = { title: "Member home · Slab Supply Co.", robots: { index: false, follow: false } };
export default async function MemberArea() {
 const member = await requireMember();
 const [membership,user] = await Promise.all([membershipForUser(member.id),(await clerkClient()).users.getUser(member.id).catch(()=>null)]);
 const metrics=memberHomeMetrics(user?.privateMetadata??null);
 return <MemberHome {...metrics} memberId={member.id} name={member.name} active={membership.state === "active-test"} unavailable={membership.state === "unavailable"}/>;
}
