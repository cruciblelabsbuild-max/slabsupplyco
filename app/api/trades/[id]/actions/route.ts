import {after} from "next/server";
import {memberShippingAddress} from "../../../../../lib/shipping/member-details";
import {reconcileShipping} from "../../../../../lib/shipping/service";
import {tradeActor} from "../../../../../lib/trades/access";
import {getTrade,applyTradeCommand} from "../../../../../lib/trades/store";
import {TradeError,text,validId} from "../../../../../lib/trades/model";
export const maxDuration=300;
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({message:"Invalid request origin."},{status:403});const actor=await tradeActor();if(!actor)return Response.json({message:"Sign in to manage your trade."},{status:401});
 try{const raw=await request.text();if(raw.length>10000)throw new TradeError("Please shorten your response.");const body=JSON.parse(raw),{id}=await params,trade=await getTrade(id,actor.member.id);if(body.revision!==trade.revision)throw new TradeError("This trade changed. Refresh before continuing.");const action=text(body.action,30,true);let data:Record<string,unknown>;
  if(action==="accept"||action==="decline_offer"){if(!validId(body.offerId))throw new TradeError("Select the current offer.");data={offerId:body.offerId,consent:body.consent===true,note:action==="accept"?"Member accepted the offer and its shipping, inspection and return terms.":"Member declined the current offer."};}
  else if(action==="shipping_details"){
   const count=Number(body.cardCount);if(!Number.isSafeInteger(count)||count<1||count>100000)throw new TradeError("Confirm the number of cards.");
   const included=trade.offers.find(o=>o.id===trade.acceptedOfferId)?.includedCount;if(included&&count!==included)throw new TradeError("The card count must match the accepted offer.");
   data={cardCount:count,address:memberShippingAddress(body.address),note:"Member confirmed the shipping address and card count."};
  }
  else if(action==="info")data={note:text(body.note,6000,true)};else throw new TradeError("Choose a valid trade action.");
  const updated=await applyTradeCommand(trade,actor.member.id,actor.member.id,action,data,body.requestId);after(async()=>{try{await reconcileShipping(id);}catch{/* The durable shipping record is retried by the worker. */}});return Response.json({trade:updated},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return Response.json({message:error instanceof TradeError?error.message:"The trade could not be updated. Please try again."},{status:error instanceof TradeError?409:503});}
}
