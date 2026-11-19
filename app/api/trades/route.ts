import {after} from "next/server";
import {dispatchEmails} from "../../../lib/email/dispatch";
import {tradeActor} from "../../../lib/trades/access";
import {submitTrade} from "../../../lib/trades/store";
import {TradeError} from "../../../lib/trades/model";
export const runtime="nodejs";
export const maxDuration=300;
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({message:"Invalid request origin."},{status:403});
 const actor=await tradeActor();if(!actor)return Response.json({message:"Sign in to submit your trade."},{status:401});if(!actor.member.email)return Response.json({message:"Verify your email before submitting."},{status:403});
 try{const raw=await request.text();if(raw.length>30000)return Response.json({message:"Use a collection file for longer submissions."},{status:413});const body=JSON.parse(raw);if(!body||typeof body!=="object"||Array.isArray(body))throw new TradeError("Check the submission details.");const trade=await submitTrade(actor.member.id,body);after(dispatchEmails);return Response.json({trade},{headers:{"Cache-Control":"no-store"}});}catch(error){return Response.json({message:error instanceof TradeError?error.message:"The submission could not be saved. Please try again."},{status:error instanceof TradeError?400:503});}
}
