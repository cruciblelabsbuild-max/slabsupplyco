import {randomUUID} from "node:crypto";
import {inventoryDb} from "../inventory-db";
import {ensureShipping,shippingEvent} from "./store";
import {ShippoProvider} from "./shippo";
import {completeAddress} from "./config";
import {ShippingBlocked,type CreatedShipment} from "./types";
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function shippingOperation(kind:"trade"|"order",id:string,action:string,actor:string,data:Record<string,any>={}){
 if(!/^[a-f0-9-]{36}$/i.test(id))throw new ShippingBlocked("identifier","A shipping job ID is required.");
 await ensureShipping();const db=inventoryDb();
 const rows=kind==='trade'?await db`SELECT * FROM ssc_trade_shipping WHERE id=${id}::uuid`:await db`SELECT * FROM ssc_order_shipping WHERE id=${id}::uuid`;
 const job=rows[0];if(!job)throw new ShippingBlocked("shipment","Shipping job was not found.");
 if(action==='correct'){
  if(job.creation_started_at||!completeAddress(data.address))throw new ShippingBlocked("address","Only an unpurchased shipment can receive a validated address correction.");
  const update=kind==='trade'?await db`UPDATE ssc_trade_shipping SET address=${JSON.stringify(data.address)}::jsonb,reason_code=NULL,reason=NULL,status='pending',updated_at=now() WHERE id=${id}::uuid AND creation_started_at IS NULL RETURNING id`:await db`UPDATE ssc_order_shipping SET address=${JSON.stringify(data.address)}::jsonb,reason_code='address_corrected',reason='Administrator confirmed the corrected member address.',status='pending',updated_at=now() WHERE id=${id}::uuid AND creation_started_at IS NULL RETURNING id`;
  if(!update.length)throw new ShippingBlocked("concurrency","Shipping changed; refresh before correcting it.");
  await shippingEvent(id,kind,`address:${id}:${randomUUID()}`,{actor,action:"address_corrected"});return;
 }
 if(!['retry','reconcile','refund'].includes(action))throw new ShippingBlocked("action","Unsupported shipping operation.");
 const claimed=kind==='trade'?await db`UPDATE ssc_trade_shipping SET reason_code='admin_operation',updated_at=now() WHERE id=${id}::uuid AND status=${job.status} AND coalesce(reason_code,'')<>'admin_operation' RETURNING id`:await db`UPDATE ssc_order_shipping SET reason_code='admin_operation',updated_at=now() WHERE id=${id}::uuid AND status=${job.status} AND coalesce(reason_code,'')<>'admin_operation' RETURNING id`;
 if(!claimed.length)throw new ShippingBlocked("concurrency","Another operation is reviewing this shipment.");
 try{
  const provider=new ShippoProvider();if(provider.environment!==job.environment&&job.environment)throw new ShippingBlocked("environment","Use the original shipping environment.");
  let result=job.provider_result as CreatedShipment|null;
  if(!result&&data.transactionId&&job.plan?.quote){const q=job.plan.quote;result={provider:"shippo",mode:provider.mode,reference:job.plan.reference,shipmentId:q.shipmentId,rateId:q.rateId,transactionId:data.transactionId,trackingNumbers:[],chargedCents:q.estimatedCostCents,currency:"USD",carrier:q.carrier,service:q.service};}
  if(result){if(result.provider!=="shippo")throw new ShippingBlocked("provider","Historical UPS shipments must be reconciled with UPS.");result=await provider.readTransaction(result);}
  if(action==='refund'){
   if(!result?.transactionId||result.status!=="SUCCESS"||data.unusedConfirmed!==true)throw new ShippingBlocked("refund","Confirm that the original successful label is unused before requesting its refund.");
   await provider.void(result.transactionId);
   if(kind==='trade')await db`UPDATE ssc_trade_shipping SET status='voided',reason_code=NULL,reason=NULL,updated_at=now() WHERE id=${id}::uuid`;else await db`UPDATE ssc_order_shipping SET status='voided',reason_code=NULL,reason=NULL,updated_at=now() WHERE id=${id}::uuid`;
  }else if(action==='reconcile'){
   if(!result?.transactionId)throw new ShippingBlocked("reconciliation","Supply the original transaction ID from Shippo; no replacement will be purchased.");
   if(kind==='trade')await db`UPDATE ssc_trade_shipping SET status='provider_created',provider_result=${JSON.stringify(result)}::jsonb,reason_code=NULL,reason=NULL,updated_at=now() WHERE id=${id}::uuid`;else await db`UPDATE ssc_order_shipping SET status='provider_created',provider_result=${JSON.stringify(result)}::jsonb,reason_code=NULL,reason=NULL,updated_at=now() WHERE id=${id}::uuid`;
  }else{
   if(job.creation_started_at&&result?.status!=="ERROR")throw new ShippingBlocked("reconciliation","A previous purchase may exist. Only a provider-confirmed failed transaction can be retried; reconcile or refund it first.");
   await shippingEvent(id,kind,`attempt-archive:${id}:${randomUUID()}`,{actor,plan:job.plan,result,action:"retry_authorized"});
   const reference=`${id}:${randomUUID()}`;
   if(kind==='trade')await db`UPDATE ssc_trade_shipping SET status='pending',creation_started_at=NULL,lease_at=NULL,attempt_reference=${reference},provider_result=NULL,plan=NULL,reason_code=NULL,reason=NULL,updated_at=now() WHERE id=${id}::uuid`;else await db`UPDATE ssc_order_shipping SET status='pending',creation_started_at=NULL,lease_at=NULL,attempt_reference=${reference},provider_result=NULL,plan=NULL,reason_code=NULL,reason=NULL,updated_at=now() WHERE id=${id}::uuid`;
  }
  await shippingEvent(id,kind,`operation:${id}:${randomUUID()}`,{actor,action,transactionId:result?.transactionId});
 }catch(error){
  // A transport error during a refund is ambiguous. Never silently retry it or buy a replacement.
  const blocked=error instanceof ShippingBlocked?error:new ShippingBlocked("shipping_error","Shipping operation requires review.");
  if(kind==='trade')await db`UPDATE ssc_trade_shipping SET reason_code=${blocked.code},reason=${blocked.message},updated_at=now() WHERE id=${id}::uuid`;else await db`UPDATE ssc_order_shipping SET reason_code=${blocked.code},reason=${blocked.message},updated_at=now() WHERE id=${id}::uuid`;
  throw blocked;
 }
}
