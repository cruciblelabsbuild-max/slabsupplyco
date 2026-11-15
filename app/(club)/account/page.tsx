import { requireMember } from "../../../lib/member-session";
import { membershipForUser } from "../../../lib/member-subscription";
import MemberHome from "../../../components/club/MemberHome";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your club · Slab Supply Co.", robots: { index: false, follow: false } };
export default async function MemberArea() {
 const member = await requireMember();
 const membership = await membershipForUser(member.id);
 return <MemberHome name={member.name} active={membership.state === "active-test"} unavailable={membership.state === "unavailable"}/>;
}
