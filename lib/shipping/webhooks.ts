import {createHash,createHmac,timingSafeEqual} from "node:crypto";
import {inventoryDb} from "../inventory-db";
import {ensureShipping} from "./store";
import {reconcileShipping,syncShipmentTracking} from "./service";
import {reconcileOrderShipping,syncOrderTracking} from "./orders";
import {ShippoProvider} from "./shippo";
import type {CreatedShipment} from "./types";
const same=(a:string,b:string)=>Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function authenticateShippoWebhook(request:Request,raw:string,env:Record<string,string|undefined>=process.env){
 if(env.SHIPPO_WEBHOOK_HMAC_SECRET){const signature=request.headers.get("shippo-auth-signature")||"",match=/^t=(\d+),v1=([a-f0-9]{64})$/.exec(signature);if(!match||Math.abs(Date.now()/1000-Number(match[1]))>300)return false;return same(match[2],createHmac("sha256",env.SHIPPO_WEBHOOK_HMAC_SECRET).update(`${match[1]}.${raw}`).digest("hex"));}
 const expected=env.SHIPPO_WEBHOOK_TOKEN;return !!expected&&expected.length>=32&&same(new URL(request.url).searchParams.get("token")||"",expected);
}
export function webhookHint(raw:string){
 const body=JSON.parse(raw),data=body.data;if(typeof body.test!=="boolean"||!['track_updated','transaction_created','transaction_updated'].includes(body.event)||!data||typeof data!=="object")throw Error("Unsupported webhook");
 const identifier=(v:unknown)=>typeof v==="string"&&/^[a-zA-Z0-9:_-]{1,100}$/.test(v)?v:null;
 return {key:createHash("sha256").update(raw).digest("hex"),mode:body.test?"test":"live",event:body.event,transaction:identifier(body.event==='track_updated'?data.transaction:data.object_id),tracking:identifier(data.tracking_number),carrier:identifier(data.carrier),reference:identifier(data.metadata)};
}
export async function enqueueShippoWebhook(raw:string){const hint=webhookHint(raw);if(hint.mode!==process.env.SHIPPO_MODE)return;await ensureShipping();await inventoryDb()`INSERT INTO ssc_shipping_webhooks(event_key,mode,event,transaction_id,tracking,carrier,reference) VALUES(${hint.key},${hint.mode},${hint.event},${hint.transaction},${hint.tracking},${hint.carrier},${hint.reference}) ON CONFLICT(event_key) DO NOTHING`;}
export async function processShippoWebhooks(){
 await ensureShipping();const db=inventoryDb(),events=await db`SELECT * FROM ssc_shipping_webhooks WHERE processed_at IS NULL ORDER BY created_at LIMIT 20`;
 for(const event of events){try{
  if(event.mode!==process.env.SHIPPO_MODE)continue;
  const environment=event.mode==="test"?"sandbox":"production";
  for(const kind of ['trade','order'] as const){
   const jobs=kind==='trade'?await db`SELECT * FROM ssc_trade_shipping WHERE environment=${environment} AND creation_started_at IS NOT NULL AND (provider_result->>'transactionId'=${event.transaction_id} OR id::text=split_part(${event.reference},':',1))`:await db`SELECT * FROM ssc_order_shipping WHERE environment=${environment} AND creation_started_at IS NOT NULL AND (provider_result->>'transactionId'=${event.transaction_id} OR id::text=split_part(${event.reference},':',1))`;
   for(let job of jobs){
    // Webhooks are wake-up hints. Provider GETs, not their payloads, determine state.
    if(['creating','unknown'].includes(job.status)&&event.transaction_id&&job.plan?.quote){const q=job.plan.quote,provider=new ShippoProvider();const result=await provider.reconcile({shipmentId:q.shipmentId,rateId:q.rateId,transactionId:event.transaction_id,trackingNumbers:[],chargedCents:q.estimatedCostCents,currency:'USD',provider:'shippo',reference:job.plan.reference,mode:event.mode,carrier:q.carrier,service:q.service} as CreatedShipment);
     if(kind==='trade')await db`UPDATE ssc_trade_shipping SET status='provider_created',provider_result=${JSON.stringify(result)}::jsonb WHERE id=${job.id}::uuid AND status IN ('creating','unknown')`;else await db`UPDATE ssc_order_shipping SET status='provider_created',provider_result=${JSON.stringify(result)}::jsonb WHERE id=${job.id}::uuid AND status IN ('creating','unknown')`;
     job={...job,status:'provider_created',provider_result:result};
    }
    if(kind==='trade'){if(job.status==='provider_created')await reconcileShipping(job.trade_id);if(['label_created','in_transit','sandbox_ready'].includes(job.status))await syncShipmentTracking(job);}
    else{if(job.status==='provider_created')await reconcileOrderShipping(job);if(['label_created','in_transit','sandbox_ready'].includes(job.status))await syncOrderTracking(job);}
   }
  }
  await db`UPDATE ssc_shipping_webhooks SET processed_at=now() WHERE event_key=${event.event_key}`;
 }catch{/* Keep the durable hint for a read-only retry; never issue a second transaction here. */}}
 return events.length;
}
