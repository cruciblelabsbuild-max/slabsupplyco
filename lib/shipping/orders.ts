import {testShippingEnabled} from "./mode";
import {randomUUID,createHash} from "node:crypto";
import type Stripe from "stripe";
import {inventoryDb,type InventoryCheckout} from "../inventory-db";
import {getStripe} from "../stripe";
import {orderCharge} from "../member-orders";
import {ensureShipping,shippingEvent} from "./store";
import {completeAddress,packingPlan,shippingConfig} from "./config";
import {shippingProvider,providerForRecord} from "./provider";
import {ShippingBlocked,type ShippingAddress,type ShippingProvider,type ShippingConfig,type ShipmentPlan,type CreatedShipment} from "./types";
/* eslint-disable @typescript-eslint/no-explicit-any -- Persisted job rows are checked at operational boundaries. */
type Row=Record<string,any>;
export function paidOrderInput(session:Stripe.Checkout.Session,checkout:InventoryCheckout,inventorySold:boolean,refunded=false,addressOverride?:ShippingAddress){
 const data=session.metadata,meta=checkout.payload.metadata;
 const valueCents=Number(meta?.card_cents),count=checkout.slugs.length;
 if(refunded||session.status!=="complete"||session.payment_status!=="paid"||checkout.status!=="paid"||!inventorySold||session.currency!=="usd"||data?.kind!=="bag-order-v2"||data.reservation_id!==checkout.id||data.clerk_user_id!==checkout.user_id||session.client_reference_id!==checkout.user_id||session.id!==checkout.session_id||session.customer!==checkout.payload.customer||data.phase!=="test"||session.livemode||Number(data.card_count)!==count||Number(data.card_cents)!==valueCents||!Number.isSafeInteger(valueCents)||valueCents<1||session.amount_subtotal!==valueCents+Number(meta?.membership_cents))throw new ShippingBlocked("payment","Paid order, reserved inventory and payment identity must be verified before shipping.");
 const shipping=session.collected_information?.shipping_details,a=shipping?.address;
 const address:ShippingAddress=addressOverride||{name:shipping?.name||"",line1:a?.line1||"",line2:a?.line2||undefined,city:a?.city||"",region:a?.state||"",postalCode:a?.postal_code||"",country:a?.country||"",phone:session.customer_details?.phone||undefined,email:session.customer_details?.email||undefined};
 return {address,addressValid:completeAddress(address),count,valueCents,test:!session.livemode};
}
async function orderContext(session:Stripe.Checkout.Session){
 const db=inventoryDb(),rows=await db`SELECT * FROM ssc_checkouts WHERE id=${session.metadata?.reservation_id||"00000000-0000-0000-0000-000000000000"}::uuid`,checkout=rows[0] as InventoryCheckout|undefined;
 if(!checkout)throw new ShippingBlocked("order","Inventory-backed order was not found.");
 const stock=await db`SELECT slug FROM ssc_inventory WHERE slug=ANY(${checkout.slugs}::text[]) AND status='sold' AND sold_session=${session.id}`;
 return {checkout,sold:stock.length===checkout.slugs.length};
}
export async function queueOrderShipping(session:Stripe.Checkout.Session){
 if(session.metadata?.kind!=="bag-order-v2"||session.payment_status!=="paid"||session.status!=="complete")return;
 await ensureShipping();const {checkout,sold}=await orderContext(session);const input=paidOrderInput(session,checkout,sold);
 await inventoryDb()`INSERT INTO ssc_order_shipping(id,checkout_id,session_id,user_id,address,card_count,value_cents,environment,status,reason_code,reason) VALUES(${randomUUID()}::uuid,${checkout.id}::uuid,${session.id},${checkout.user_id},${JSON.stringify(input.address)}::jsonb,${input.count},${input.valueCents},${input.test?"sandbox":"production"},${input.addressValid?"awaiting_approval":"blocked"},${input.addressValid?null:"address"},${input.addressValid?null:"The paid order is missing a complete member shipping address."}) ON CONFLICT(checkout_id) DO NOTHING`;
}
export async function authorizeOrderShipping(sessionId:string,actor:string){
 await ensureShipping();const session=await getStripe().checkout.sessions.retrieve(sessionId);await queueOrderShipping(session);
 const rows=await inventoryDb()`UPDATE ssc_order_shipping SET approved_at=coalesce(approved_at,now()),approved_by=coalesce(approved_by,${actor}),status=CASE WHEN creation_started_at IS NULL THEN 'pending' ELSE status END,updated_at=now() WHERE session_id=${sessionId} RETURNING id`;
 if(!rows.length)throw new ShippingBlocked("order","A verified paid inventory order is required.");
 await shippingEvent(rows[0].id,"outbound",`order-approval:${rows[0].id}`,{actor,action:"fulfillment_authorized"});
}
export async function reconcileOrderShipping(job:Row,options:{provider?:ShippingProvider;config?:ShippingConfig;verifiedInput?:ReturnType<typeof paidOrderInput>}={}){
 if(job.reason_code==="admin_operation"||!job.approved_at||["creating","unknown","sandbox_ready","label_created","in_transit","delivered","voided"].includes(job.status))return;
 const db=inventoryDb();
 try{
  const provider=options.provider||shippingProvider(),config=options.config||shippingConfig();
  if(provider.environment!==job.environment)throw new ShippingBlocked("environment","Payment and shipping environments must match.");
  if(job.status==="provider_created"){await publishOrder(job,provider);return;}
  const claimed=await db`UPDATE ssc_order_shipping SET status='preparing',lease_at=now(),updated_at=now() WHERE id=${job.id}::uuid AND coalesce(reason_code,'')<>'admin_operation' AND creation_started_at IS NULL AND (status IN ('pending','blocked','error') OR status='preparing' AND lease_at<now()-interval '5 minutes') RETURNING id`;if(!claimed.length)return;
  if(!options.provider&&provider.environment==="sandbox"&&!testShippingEnabled()&&!(process.env.SHIPPO_TEST_ORDER_ALLOWLIST||"").split(",").includes(job.session_id))throw new ShippingBlocked("sandbox_only","Test label processing is restricted to explicitly allowlisted test orders.");
  let input=options.verifiedInput;
  if(!input){const session=await getStripe().checkout.sessions.retrieve(job.session_id),context=await orderContext(session),charge=await orderCharge(getStripe(),session);if(!charge)throw new ShippingBlocked("payment","The paid charge must be confirmed before fulfillment.");input=paidOrderInput(session,context.checkout,context.sold,charge.refunded||charge.amount_refunded>0,completeAddress(job.address)?job.address:undefined);}
  const plan=packingPlan(input.count,input.valueCents,config.fulfillment||config.company,input.address,job.attempt_reference||job.id,config);
  if(!await provider.validateAddress(plan.from)||!await provider.validateAddress(plan.to))throw new ShippingBlocked("address","An order shipping address requires review.");
  const rate=await provider.rate(plan);if(!Number.isSafeInteger(rate)||rate<0||rate>plan.maxRateCents)throw new ShippingBlocked("rate_limit","The order shipping rate exceeds its configured budget.");
  const lock=await db`UPDATE ssc_order_shipping SET status='creating',creation_started_at=now(),plan=${JSON.stringify(plan)}::jsonb,reason=NULL,reason_code=NULL,updated_at=now() WHERE id=${job.id}::uuid AND coalesce(reason_code,'')<>'admin_operation' AND status='preparing' AND approved_at IS NOT NULL RETURNING id`;if(!lock.length)return;
  let result:CreatedShipment;try{result=await provider.create(plan);}catch{await db`UPDATE ssc_order_shipping SET status='unknown',reason_code='reconciliation',reason='Shippo creation is unconfirmed. Reconcile before any replacement.',updated_at=now() WHERE id=${job.id}::uuid`;return;}
  await db`UPDATE ssc_order_shipping SET status='provider_created',provider_result=${JSON.stringify(result)}::jsonb,updated_at=now() WHERE id=${job.id}::uuid AND status='creating'`;
  await publishOrder({...job,plan,provider_result:result},provider);
 }catch(e){const error=e instanceof ShippingBlocked?e:new ShippingBlocked("shipping_error","Order shipping requires review.");await db`UPDATE ssc_order_shipping SET status=CASE WHEN creation_started_at IS NULL THEN 'blocked' ELSE status END,reason_code=${error.code},reason=${error.message},updated_at=now() WHERE id=${job.id}::uuid`;}
}
async function publishOrder(job:Row,provider:ShippingProvider){
 const db=inventoryDb(),plan=job.plan as ShipmentPlan;let result=job.provider_result as CreatedShipment;
 if(result.mode!==(provider.environment==="sandbox"?"test":"live"))throw new ShippingBlocked("environment","Order recovery must use its original mode.");
 if(provider.reconcile)result=await provider.reconcile(result);
 if(result.status&&result.status!=="SUCCESS"||result.trackingNumbers.length!==1)throw new ShippingBlocked("provider_pending","Order shipping transaction is pending.");
 await db`UPDATE ssc_order_shipping SET provider_result=${JSON.stringify(result)}::jsonb WHERE id=${job.id}::uuid`;
 if(result.chargedCents>plan.maxRateCents){await provider.void(result.transactionId||result.shipmentId);await db`UPDATE ssc_order_shipping SET status='voided',reason_code='rate_limit',reason='Label cost exceeded the cap; refund confirmed.' WHERE id=${job.id}::uuid`;return;}
 const bytes=await provider.retrieveLabel(result.trackingNumbers[0],result);
 await db.transaction([db`SELECT id FROM ssc_order_shipping WHERE id=${job.id}::uuid FOR UPDATE`,db`INSERT INTO ssc_shipping_events(job_id,kind,event_key,data) SELECT ${job.id}::uuid,'outbound',${`order-label:${job.id}`},${JSON.stringify({action:"label_created",test:provider.environment==="sandbox",transactionId:result.transactionId,tracking:result.trackingNumbers})}::jsonb WHERE EXISTS(SELECT 1 FROM ssc_order_shipping WHERE id=${job.id}::uuid AND status='provider_created' AND coalesce(reason_code,'')<>'admin_operation') ON CONFLICT(event_key) DO NOTHING`,db`UPDATE ssc_order_shipping SET status=${provider.environment==="sandbox"&&!testShippingEnabled()?"sandbox_ready":"label_created"},provider_result=${JSON.stringify(result)}::jsonb,label_contents=decode(${Buffer.from(bytes).toString("base64")},'base64'),reason=NULL,reason_code=NULL,updated_at=now() WHERE id=${job.id}::uuid AND status='provider_created' AND coalesce(reason_code,'')<>'admin_operation'`]);
}
export async function syncOrderTracking(job:Row,injected?:ShippingProvider){
 const result=job.provider_result as CreatedShipment,provider=injected||providerForRecord(result);if(provider.environment!==job.environment)return;
 const events=await provider.track(result.trackingNumbers[0],result.carrier);const latest=[...events].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time))[0];
 for(const event of events)await shippingEvent(job.id,"outbound",createHash("sha256").update(JSON.stringify([job.id,event])).digest("hex"),event);
 await inventoryDb()`UPDATE ssc_order_shipping SET tracking=${JSON.stringify(events)}::jsonb,status=CASE WHEN status='sandbox_ready' THEN status WHEN ${latest?.code||""}='D' THEN 'delivered' WHEN ${latest?.code||""}='I' AND status<>'delivered' THEN 'in_transit' ELSE status END,updated_at=now() WHERE id=${job.id}::uuid`;
}
export async function processOrderShippingQueue(){
 await ensureShipping();const db=inventoryDb();
 const unqueued=await db`SELECT session_id FROM ssc_checkouts c WHERE status='paid' AND session_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM ssc_order_shipping s WHERE s.checkout_id=c.id) ORDER BY created_at LIMIT 10`;
 for(const row of unqueued){try{await queueOrderShipping(await getStripe().checkout.sessions.retrieve(row.session_id));}catch{/* Missing addresses remain a fulfillment review, never a new frontend requirement. */}}
 await db`UPDATE ssc_order_shipping SET status='unknown',reason_code='reconciliation',reason='Purchase was interrupted; reconcile the original transaction.',updated_at=now() WHERE status='creating' AND creation_started_at<now()-interval '10 minutes'`;
 const rows=await db`SELECT * FROM ssc_order_shipping WHERE approved_at IS NOT NULL AND status IN ('pending','blocked','error','preparing','provider_created') ORDER BY updated_at LIMIT 10`;
 for(const row of rows)await reconcileOrderShipping(row);
 const tracking=await db`SELECT * FROM ssc_order_shipping WHERE status IN ('label_created','in_transit') ORDER BY updated_at LIMIT 10`;for(const row of tracking){try{await syncOrderTracking(row);}catch{/* Retain the last verified event. */}}
 return rows.length;
}
