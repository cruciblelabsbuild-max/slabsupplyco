import {requireMember} from "../../lib/member-session";
import MemberArrival from "../../components/club/MemberArrival";
export const dynamic="force-dynamic";
export const metadata={title:"Welcome back · Slab Supply Co.",robots:{index:false,follow:false}};
export default async function SignInComplete({searchParams}:{searchParams:Promise<{next?:string}>}){
 await requireMember();const {next}=await searchParams;
 return <MemberArrival destination={next==="trades"?"/trade-ins#start-trade":"/account"}/>;
}
