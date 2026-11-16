import {tradeActor} from "../../../../lib/trades/access";
import {getTrade,operatorAction} from "../../../../lib/trades/store";
import {TradeError} from "../../../../lib/trades/model";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({message:"Invalid request origin."},{status:403});const actor=await tradeActor();if(!actor?.admin)return Response.json({message:"Admin access required."},{status:403});
 try{const raw=await request.text();if(raw.length>30000)throw new TradeError("The update is too large.");const body=JSON.parse(raw),{id}=await params,trade=await getTrade(id);if(body.revision!==trade.revision)throw new TradeError("This trade changed. Refresh before continuing.");return Response.json({trade:await operatorAction(trade,actor.member.id,body)},{headers:{"Cache-Control":"no-store"}});}catch(error){return Response.json({message:error instanceof TradeError?error.message:"The update could not be saved. Please try again."},{status:error instanceof TradeError?409:503});}
}
