import {timingSafeEqual} from "node:crypto";
import {processShippingQueue} from "../../../../lib/shipping/service";
import {processOrderShippingQueue} from "../../../../lib/shipping/orders";
import {processShippoWebhooks} from "../../../../lib/shipping/webhooks";
export const maxDuration=300;
export async function GET(request:Request){
 if(process.env.SHIPPO_AUTOMATION_ENABLED!=="true")return Response.json({enabled:false},{headers:{"Cache-Control":"no-store"}});
 const secret=process.env.CRON_SECRET,expected=`Bearer ${secret||""}`,actual=request.headers.get("authorization")||"";
 if(!secret||Buffer.byteLength(expected)!==Buffer.byteLength(actual)||!timingSafeEqual(Buffer.from(expected),Buffer.from(actual)))return Response.json({message:"Unauthorized."},{status:401});
 try{const webhooks=await processShippoWebhooks(),trades=await processShippingQueue(),orders=await processOrderShippingQueue();return Response.json({processed:trades+orders,webhooks},{headers:{"Cache-Control":"no-store"}});}catch{return Response.json({message:"Shipping worker unavailable."},{status:503});}
}
