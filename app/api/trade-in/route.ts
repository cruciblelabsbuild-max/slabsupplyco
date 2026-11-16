import {getMember} from "../../../lib/member-session";
import {submitMemberTrade} from "../../../lib/member-trade-handler";
export async function POST(request:Request){
 const member=await getMember();
 if(!member)return Response.json({message:"Sign in to submit your trade request."},{status:401});
 return submitMemberTrade(request,member);
}
