import {tradeActor} from "../../../../../../lib/trades/access";
import {downloadTradeFile,deleteTradeFile} from "../../../../../../lib/trades/store";
import {validId,TradeError} from "../../../../../../lib/trades/model";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{id:string;fileId:string}>}){
 const actor=await tradeActor();if(!actor)return new Response("Sign in required.",{status:401});
 try{const {id,fileId}=await params;if(!validId(id)||!validId(fileId))return new Response("Not found.",{status:404});const file=await downloadTradeFile(id,fileId,actor.admin?undefined:actor.member.id);const inline=new URL(request.url).searchParams.get("inline")==="1";return new Response(file.bytes,{headers:{"Content-Type":file.mime,"Content-Disposition":`${inline?"inline":"attachment"}; filename*=UTF-8''${encodeURIComponent(file.name)}`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",...(file.mime==="application/pdf"?{}:{"Content-Security-Policy":"sandbox"})}});}catch{return new Response("File not found.",{status:404});}
}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string;fileId:string}>}){
 if(request.headers.get("origin")!==new URL(request.url).origin)return new Response("Invalid origin.",{status:403});const actor=await tradeActor();if(!actor)return new Response("Sign in required.",{status:401});try{const {id,fileId}=await params;if(!validId(id)||!validId(fileId))throw new TradeError("File not found.");await deleteTradeFile(id,fileId,actor.member.id);return Response.json({ok:true});}catch(error){return Response.json({message:error instanceof TradeError?error.message:"The file could not be removed."},{status:409});}
}
