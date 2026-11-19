import {dispatchEmails} from "../../../../lib/email/dispatch";
import {withProfileReturnAddress} from "../../../../lib/shipping/profile-address";
import {after} from "next/server";
import {tradeActor} from "../../../../lib/trades/access";
import {getTrade} from "../../../../lib/trades/store";
import {reconcileShipping} from "../../../../lib/shipping/service";
export const maxDuration=300;
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){const actor=await tradeActor();if(!actor)return Response.json({message:"Sign in required."},{status:401});try{const {id}=await params;const trade=await getTrade(id,actor.admin?undefined:actor.member.id);after(async()=>{try{await reconcileShipping(id);}catch{/* Retry remains in the durable queue. */}await dispatchEmails();});return Response.json({trade:actor.admin?trade:withProfileReturnAddress(trade,actor.user.privateMetadata.memberProfile)},{headers:{"Cache-Control":"private, no-store"}});}catch{return Response.json({message:"Trade not found."},{status:404});}}
