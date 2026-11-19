import {visibleShippingDocument} from "../../../../lib/shipping/mode";
import {after} from "next/server";
import {tradeActor} from "../../../../lib/trades/access";
import {inventoryDb} from "../../../../lib/inventory-db";
import {ensureShipping} from "../../../../lib/shipping/store";
import {authorizeOrderShipping,processOrderShippingQueue} from "../../../../lib/shipping/orders";
import {processShippingQueue} from "../../../../lib/shipping/service";
import {shippingOperation} from "../../../../lib/shipping/operations";
import {ShippingBlocked} from "../../../../lib/shipping/types";
export const maxDuration=300;
export async function GET(request:Request){const actor=await tradeActor();if(!actor?.admin)return Response.json({message:"Admin access required."},{status:403});await ensureShipping();const db=inventoryDb();const labelId=new URL(request.url).searchParams.get('orderLabel');if(labelId){if(!/^[a-f0-9-]{36}$/i.test(labelId))return new Response('Not found',{status:404});const row=(await db`SELECT encode(label_contents,'base64') AS contents,provider_result FROM ssc_order_shipping WHERE id=${labelId}::uuid`)[0];if(!row?.contents||!visibleShippingDocument(row.provider_result))return new Response('Not found',{status:404});return new Response(Buffer.from(row.contents,'base64'),{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="shipping-label.pdf"','Cache-Control':'private, no-store'}});}const [trades,orders]=await Promise.all([db`SELECT id,trade_id,status,reason_code,reason,approved_at,environment,updated_at FROM ssc_trade_shipping ORDER BY updated_at DESC LIMIT 100`,db`SELECT id,session_id,status,reason_code,reason,approved_at,environment,updated_at FROM ssc_order_shipping ORDER BY updated_at DESC LIMIT 100`]);return Response.json({trades,orders},{headers:{"Cache-Control":"no-store"}});}
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({message:"Invalid request origin."},{status:403});const actor=await tradeActor();if(!actor?.admin)return Response.json({message:"Admin access required."},{status:403});
 try{const raw=await request.text();if(raw.length>10000)throw Error("Payload too large");const body=JSON.parse(raw);if(body.action==='approve_order')await authorizeOrderShipping(body.sessionId,actor.member.id);else await shippingOperation(body.kind==='order'?'order':'trade',body.id,body.action,actor.member.id,body);
 after(async()=>{try{await processShippingQueue();await processOrderShippingQueue();}catch{/* Durable job is retained for the next worker run. */}});return Response.json({saved:true},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return Response.json({message:e instanceof ShippingBlocked?e.message:"Shipping operation could not be completed."},{status:409});}
}
