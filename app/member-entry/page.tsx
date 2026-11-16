import {requireMember} from "../../lib/member-session";
import {membershipForUser} from "../../lib/member-subscription";
import {memberArrivalDestination} from "../../lib/member-arrival";
import MemberArrival from "../../components/club/MemberArrival";
export const dynamic="force-dynamic";
export const metadata={title:"Welcome back · Slab Supply Co.",robots:{index:false,follow:false}};
export default async function SignInComplete({searchParams}:{searchParams:Promise<{next?:string;checkout?:string;card?:string}>}){
 const member=await requireMember();const {next,checkout,card}=await searchParams;
 const enrollment=checkout==="continue";
 const activeMembership=enrollment&&(await membershipForUser(member.id)).state==="active-test";
 return <MemberArrival name={member.name} allowStoredTradeIntent={!enrollment} destination={memberArrivalDestination({enrollment,activeMembership,next,card})}/>;
}
