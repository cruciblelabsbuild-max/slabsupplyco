import {tradeActor} from "../../../../lib/trades/access";
import {ensureDraft,getTrade} from "../../../../lib/trades/store";
import {TradeError} from "../../../../lib/trades/model";
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({message:"Invalid request origin."},{status:403});const actor=await tradeActor();if(!actor)return Response.json({message:"Sign in to start a trade."},{status:401});
 try{const raw=await request.text();if(raw.length>1000)throw new TradeError("Invalid draft request.");const body=JSON.parse(raw) as Record<string,unknown>;if(!body||typeof body!=="object")throw new TradeError("Invalid draft request.");const id=await ensureDraft(typeof body.requestId==="string"?body.requestId:"",actor.member.id);return Response.json({trade:await getTrade(id,actor.member.id)},{headers:{"Cache-Control":"no-store"}});}catch(error){return Response.json({message:error instanceof TradeError?error.message:"The draft could not be saved."},{status:error instanceof TradeError?400:503});}
}
