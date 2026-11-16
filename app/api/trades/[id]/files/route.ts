import {tradeActor} from "../../../../../lib/trades/access";
import {getTrade,uploadTradeFile} from "../../../../../lib/trades/store";
import {TradeError,validId,type TradeFile} from "../../../../../lib/trades/model";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({message:"Invalid request origin."},{status:403});if(Number(request.headers.get("content-length")||0)>3400000)return Response.json({message:"Each file must be no larger than 3 MB."},{status:413});
 const actor=await tradeActor();if(!actor)return Response.json({message:"Sign in to attach files."},{status:401});
 try{const {id}=await params;const form=await request.formData(),file=form.get("file"),kind=form.get("kind"),cardKey=form.get("cardKey");if(!(file instanceof File)||!["front","back","collection","label","return_label"].includes(String(kind)))throw new TradeError("Choose a supported file and upload type.");if(file.size>3*1024*1024)throw new TradeError("Each file must be no larger than 3 MB.");
  const trade=await getTrade(id,actor.admin?undefined:actor.member.id);if(cardKey&&!validId(cardKey))throw new TradeError("Check the linked card.");const saved=await uploadTradeFile(trade,{name:file.name,bytes:new Uint8Array(await file.arrayBuffer())},kind as TradeFile["kind"],cardKey?String(cardKey):null,actor.admin);return Response.json({file:saved},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return Response.json({message:error instanceof TradeError?error.message:"The file could not be saved. Please try again."},{status:error instanceof TradeError?400:503});}
}
