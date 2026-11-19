import {redirect} from "next/navigation";
import {requireMember} from "../../lib/member-session";
import {membershipForUser} from "../../lib/member-subscription";
import {memberArrivalDestination} from "../../lib/member-arrival";
import MemberArrival from "../../components/club/MemberArrival";
export const dynamic="force-dynamic";
export const metadata={title:"Welcome back · Slab Supply Co.",robots:{index:false,follow:false}};
export default async function SignInComplete({searchParams}:{searchParams:Promise<{next?:string;checkout?:string;card?:string;bag?:string}>}){
 const member=await requireMember();const {next,checkout,card,bag}=await searchParams;
 const enrollment=checkout==="continue";
 const membership=await membershipForUser(member.id);
 const activeMembership=membership.state==="active-test";
 const destination=memberArrivalDestination({enrollment,activeMembership,next,card:bag==="1"?"bag":card});
 if(!activeMembership)redirect(destination);
 return <MemberArrival name={member.name} allowStoredTradeIntent={!enrollment} destination={destination}/>;
}
