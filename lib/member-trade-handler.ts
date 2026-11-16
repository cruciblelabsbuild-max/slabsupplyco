import { clerkClient } from "@clerk/nextjs/server";
import { saveMemberTrade, TradeValidationError } from "./member-trades";
export async function submitMemberTrade(request:Request,member:{id:string;email:string|null}) {
 if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({message:"Invalid request origin."},{status:403});
 if(!member.email)return Response.json({message:"Verify your email before submitting a trade."},{status:403});
 if(Number(request.headers.get("content-length")||0)>8000)return Response.json({message:"That request is too large."},{status:413});
 let body:Record<string,unknown>;
 try {const raw=await request.text();if(new TextEncoder().encode(raw).length>8000)return Response.json({message:"That request is too large."},{status:413});body=JSON.parse(raw) as Record<string,unknown>;if(!body || typeof body!=="object")throw Error();}
 catch{return Response.json({message:"Check your trade details."},{status:400});}
 try {
  const clerk=await clerkClient();
  const trade=await saveMemberTrade(body,{read:async()=> (await clerk.users.getUser(member.id)).privateMetadata,write:async(id,value)=>{await clerk.users.updateUserMetadata(member.id,{privateMetadata:{tradeRequests:{[id]:value}}});}});
  return Response.json({message:"Your trade request is saved.",reference:trade.id},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(error){return Response.json({message:error instanceof TradeValidationError ? error.message:"Your request could not be saved. Please try again."},{status:error instanceof TradeValidationError ? 400:503});}
}
