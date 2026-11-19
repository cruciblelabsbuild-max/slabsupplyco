import {testShippingEnabled,visibleShippingDocument} from "../lib/shipping/mode";
import {test} from "node:test";
import assert from "node:assert/strict";
import {createHmac} from "node:crypto";
import {ShippoProvider,safeShippoLabelUrl} from "../lib/shipping/shippo";
import {shippoShippingConfig} from "../lib/shipping/shippo-config";
import {packingPlan} from "../lib/shipping/config";
import {shippingProvider} from "../lib/shipping/provider";
import {authenticateShippoWebhook,webhookHint} from "../lib/shipping/webhooks";
import {paidOrderInput} from "../lib/shipping/orders";
import type Stripe from "stripe";
import type {InventoryCheckout} from "../lib/inventory-db";
const address={name:"QA",line1:"123 Fixture Street",city:"Fixture City",region:"NY",postalCode:"10001",country:"US"};
const env={SHIPPO_MODE:"test",SHIPPO_AUTOMATION_ENABLED:"true",SHIPPO_TEST_TOKEN:"shippo_test_SYNTHETIC_FIXTURE",SHIPPO_COMPANY_ADDRESS:JSON.stringify(address),SHIPPO_BUSINESS_EMAIL:"business@example.com",SHIPPO_BUSINESS_PHONE:"+12125550100"};
const oid=(n:number)=>String(n).padStart(32,"0");
function fixture(){
 const calls:{path:string;body:any;auth:string|null}[]=[];let transactionStatus="SUCCESS",wrongMode=false; // eslint-disable-line @typescript-eslint/no-explicit-any
 const transport:typeof fetch=async(input,init)=>{
  const path=new URL(String(input)).pathname,body=init?.body?JSON.parse(String(init.body)):null;calls.push({path,body,auth:new Headers(init?.headers).get('Authorization')});
  const rate=(n:number,provider:string,service:string,amount:string)=>({object_id:oid(n),provider,servicelevel:{token:service},amount,currency:'USD',carrier_account:oid(n+10)});
  if(path.includes('carrier_accounts'))return Response.json({results:[{object_id:oid(11),active:true,test:true,carrier:'usps',service_levels:[{token:'usps_priority'}]},{object_id:oid(12),active:true,test:true,carrier:'ups',service_levels:[{token:'ups_ground'}]}],next:null});
  if(path.includes('addresses'))return Response.json({validation_results:{is_valid:true}});
  if(path.includes('shipments'))return Response.json({object_id:oid(20),test:true,rates:[rate(2,'UPS','ups_ground','4.00'),rate(1,'USPS','usps_priority','8.00')]});
  if(path.includes('transactions'))return Response.json({object_id:oid(30),status:transactionStatus,test:!wrongMode,metadata:'qa-ref',tracking_number:'TEST-NOT-POSTAGE',label_url:'https://shippo-delivery.s3.amazonaws.com/test.pdf',tracking_url_provider:'https://tools.usps.com/go/TrackConfirmAction?tLabels=TEST',rate:{amount:'8.00',currency:'USD'},object_created:'2026-11-19T00:00:00Z'});
  if(path.includes('tracks'))return Response.json({tracking_history:[{status:'TRANSIT',status_date:'2026-11-19T10:00:00Z'},{status:'DELIVERED',status_date:'2026-11-19T12:00:00Z'}]});
  if(path.includes('refunds'))return Response.json({object_id:oid(40),status:'SUCCESS',test:true});
  return new Response('%PDF-1.4 SYNTHETIC TEST ONLY');
 };
 return {calls,provider:new ShippoProvider(env,transport),setStatus:(v:string)=>{transactionStatus=v;},wrongMode:()=>{wrongMode=true;}};
}
test('Shippo packing presets estimate 1/3/8 slabs, never photos; 11+ and live unmeasured packing are blocked',()=>{
 const c=shippoShippingConfig(env);
 for(const [count,height,oz] of [[1,5,11],[3,6,17],[8,8,32]]){const p=packingPlan(count,8500,address,address,'qa-ref',c);assert.equal(p.packages.length,1);assert.equal(p.packages[0].heightIn,height);assert.equal(p.packages[0].weightLb*16,oz);assert.equal(p.insurance?.verified,false);}
 assert.throws(()=>packingPlan(11,8500,address,address,'qa-ref',c),/review/);
 assert.throws(()=>shippoShippingConfig({...env,SHIPPO_MODE:'live'}),/Production requires/);
 assert.throws(()=>shippoShippingConfig({...env,SHIPPO_COMPANY_ADDRESS:''}),/address/);
});
test('Shippo mode is explicit, tokens never fall back, and live activation has separate gates',()=>{
 assert.throws(()=>shippingProvider({}),/explicit/);
 assert.throws(()=>new ShippoProvider({...env,SHIPPO_TEST_TOKEN:'',SHIPPO_LIVE_TOKEN:'shippo_live_fixture'}),/credentials/);
 assert.throws(()=>new ShippoProvider({...env,SHIPPO_MODE:'live',SHIPPO_LIVE_TOKEN:'shippo_live_fixture'}),/separate activation/);
 assert.throws(()=>new ShippoProvider({...env,SHIPPO_MODE:'oops'}),/explicit/);
});
test('Shippo contract prefers approved USPS service, persists IDs, buys once, recovers read-only and downloads only approved PDFs',async()=>{
 const f=fixture(),plan=packingPlan(1,8500,address,address,'qa-ref',shippoShippingConfig(env));
 assert.equal(await f.provider.validateAddress(address),true);assert.equal(await f.provider.validateAddress({...address,line1:''}),false);
 assert.equal(await f.provider.rate(plan),800);assert.equal(plan.quote?.carrier,'USPS');
 const transaction=await f.provider.create(plan),confirmed=await f.provider.reconcile(transaction);
 assert.equal(confirmed.transactionId,oid(30));assert.equal(confirmed.status,'SUCCESS');assert.equal(confirmed.test,true);
 assert.match(Buffer.from(await f.provider.retrieveLabel(confirmed.trackingNumbers[0],confirmed)).toString(),/^%PDF-/);
 assert.equal((await f.provider.track('TEST','usps')).at(-1)?.code,'D');await f.provider.void(confirmed.transactionId!);
 assert.equal(f.calls.filter(c=>c.path==='/transactions/'&&c.body).length,1);
 assert(f.calls.filter(c=>c.path!=='/test.pdf').every(c=>c.auth==='ShippoToken shippo_test_SYNTHETIC_FIXTURE'));
 assert.equal(f.calls.find(c=>c.path==='/test.pdf')!.auth,null);
 const shipment=f.calls.find(c=>c.path==='/shipments/')!.body;
 assert.equal(shipment.parcels[0].weight,'11');assert.equal(shipment.extra.insurance.content,'Graded Pokemon trading cards');assert.equal(shipment.extra.is_return,undefined);assert.equal(shipment.address_from.email,env.SHIPPO_BUSINESS_EMAIL);assert.equal(shipment.address_from.phone,env.SHIPPO_BUSINESS_PHONE);assert.equal(shipment.address_to.email,undefined);
 assert.throws(()=>safeShippoLabelUrl('https://attacker.example/label.pdf'),/host/);
});
test('pending transactions only poll original ID, and cross-mode confirmations never publish a label',async()=>{
 const f=fixture(),plan=packingPlan(3,8500,address,address,'qa-ref',shippoShippingConfig(env));await f.provider.rate(plan);f.setStatus('WAITING');const tx=await f.provider.create(plan);assert.equal(tx.trackingNumbers.length,0);
 await assert.rejects(()=>f.provider.reconcile(tx),/pending/);await assert.rejects(()=>f.provider.reconcile(tx),/pending/);assert.equal(f.calls.filter(c=>c.path==='/transactions/'&&c.body).length,1);
 f.setStatus('SUCCESS');f.wrongMode();await assert.rejects(()=>f.provider.reconcile(tx),/mode/);
});
test('unavailable service fails before a transaction; errors do not expose raw provider messages or secrets',async()=>{
 const p=new ShippoProvider({...env,SHIPPO_SERVICES:'unsupported'},async()=>Response.json({results:[],next:null}));await assert.rejects(()=>p.rate(packingPlan(1,8500,address,address,'qa-ref',shippoShippingConfig(env))),/No connected carrier/);
 const rejected=new ShippoProvider(env,async()=>Response.json({detail:'PRIVATE SECRET SHOULD NOT LEAK'},{status:401}));await assert.rejects(()=>rejected.validateAddress(address),e=>e instanceof Error&&e.message.includes('HTTP 401')&&!e.message.includes('PRIVATE'));
});
test('webhooks authenticate, reject stale HMAC, isolate mode, and strip addresses from durable hints',()=>{
 const raw=JSON.stringify({event:'track_updated',test:true,data:{transaction:oid(30),tracking_number:'TEST',carrier:'usps',address_to:{street1:'private'}}}),token='test-only-webhook-secret-32-characters';
 assert.equal(authenticateShippoWebhook(new Request(`https://example.com/api/shippo/webhook?token=${token}`),raw,{SHIPPO_WEBHOOK_TOKEN:token}),true);
 assert.equal(authenticateShippoWebhook(new Request('https://example.com/api/shippo/webhook'),raw,{SHIPPO_WEBHOOK_TOKEN:token}),false);
 const timestamp=Math.floor(Date.now()/1000),sign=(t:number)=>`t=${t},v1=${createHmac('sha256','fixture').update(`${t}.${raw}`).digest('hex')}`;
 assert.equal(authenticateShippoWebhook(new Request('https://example.com',{headers:{'shippo-auth-signature':sign(timestamp)}}),raw,{SHIPPO_WEBHOOK_HMAC_SECRET:'fixture'}),true);
 assert.equal(authenticateShippoWebhook(new Request('https://example.com',{headers:{'shippo-auth-signature':sign(timestamp-1000)}}),raw,{SHIPPO_WEBHOOK_HMAC_SECRET:'fixture'}),false);
 assert.equal(webhookHint(raw).mode,'test');assert(!JSON.stringify(webhookHint(raw)).includes('private'));assert.equal(webhookHint(raw).key,webhookHint(raw).key);
});
test('outbound shipping requires paid, inventory-backed identity and excludes membership from insured value',()=>{
 const checkout={id:'fixture',user_id:'member',slugs:['card-1','card-2','card-3'],status:'paid',session_id:'cs_test_fixture',payload:{customer:'cus_fixture',metadata:{card_cents:'30000',membership_cents:'14900'}}} as unknown as InventoryCheckout;
 const session={id:'cs_test_fixture',livemode:false,status:'complete',payment_status:'paid',currency:'usd',amount_subtotal:44900,customer:'cus_fixture',client_reference_id:'member',metadata:{kind:'bag-order-v2',phase:'test',reservation_id:'fixture',clerk_user_id:'member',card_count:'3',card_cents:'30000'},collected_information:{shipping_details:{name:'Member',address:{line1:'123 Fixture Street',city:'Fixture City',state:'NY',postal_code:'10001',country:'US'}}}} as unknown as Stripe.Checkout.Session;
 const input=paidOrderInput(session,checkout,true);assert.equal(input.count,3);assert.equal(input.valueCents,30000);assert.equal(input.addressValid,true);
 for(const invalid of [{...session,payment_status:'unpaid'},{...session,status:'expired'},{...session,livemode:true},{...session,client_reference_id:'other'}])assert.throws(()=>paidOrderInput(invalid as Stripe.Checkout.Session,checkout,true),/verified/);
 assert.throws(()=>paidOrderInput(session,checkout,false),/verified/);assert.throws(()=>paidOrderInput(session,checkout,true,true),/verified/);
 assert.equal(paidOrderInput({...session,collected_information:null},checkout,true).addressValid,false);
});

test('test PDFs are available only in an explicitly enabled test application',()=>{
 const enabled={SHIPPO_MODE:'test',SHIPPO_TEST_WORKFLOWS_ENABLED:'true'};assert.equal(testShippingEnabled(enabled),true);assert.equal(visibleShippingDocument({provider:'shippo',mode:'test'},enabled),true);assert.equal(visibleShippingDocument({provider:'shippo',mode:'live'},enabled),false);assert.equal(visibleShippingDocument({provider:'shippo',mode:'test'},{SHIPPO_MODE:'live',SHIPPO_TEST_WORKFLOWS_ENABLED:'true'}),false);assert.equal(visibleShippingDocument({provider:'shippo',mode:'test'},{SHIPPO_MODE:'test'}),false);
});
