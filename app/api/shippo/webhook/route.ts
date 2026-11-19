import {authenticateShippoWebhook,enqueueShippoWebhook} from "../../../../lib/shipping/webhooks";
export const runtime="nodejs";
export async function POST(request:Request){
 if(Number(request.headers.get("content-length"))>100000)return Response.json({message:"Payload too large."},{status:413});
 const raw=await request.text();if(Buffer.byteLength(raw)>100000)return Response.json({message:"Payload too large."},{status:413});
 if(!authenticateShippoWebhook(request,raw))return Response.json({message:"Unauthorized."},{status:401});
 try{await enqueueShippoWebhook(raw);return Response.json({received:true});}catch{return Response.json({message:"Webhook could not be recorded."},{status:503});}
}
