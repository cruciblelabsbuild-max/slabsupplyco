import {test} from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {inventoryDb} from "../lib/inventory-db";
import {ensureShipping} from "../lib/shipping/store";
import {reconcileOrderShipping,syncOrderTracking} from "../lib/shipping/orders";
import {reconcileShipping,syncShipmentTracking} from "../lib/shipping/service";
import {enqueueShippoWebhook,webhookHint} from "../lib/shipping/webhooks";
import {submitTrade,getTrade,operatorAction,applyTradeCommand,tradeCreditBalance} from "../lib/trades/store";
import {ShippingBlocked,type ShippingProvider} from "../lib/shipping/types";
import {qaAddress,qaShippingConfig} from "./fixtures/shipping";
test('Shippo durable jobs serialize concurrent purchases, resume pending transactions read-only, dedupe webhooks and keep delivery separate from credit',{skip:process.env.RUN_SHIPPO_DB_TESTS!=='1'},async()=>{
 await ensureShipping();const db=inventoryDb(),owner=`shippo-qa-${randomUUID()}`,tradeId=randomUUID(),checkoutId=randomUUID(),jobId=randomUUID(),sessionId=`cs_test_qa_${randomUUID()}`;let creates=0,pending=true;const oldMode=process.env.SHIPPO_MODE,oldEnabled=process.env.SHIPPO_TEST_WORKFLOWS_ENABLED;process.env.SHIPPO_MODE='test';process.env.SHIPPO_TEST_WORKFLOWS_ENABLED='true';
 const provider:ShippingProvider={name:'shippo-fixture',environment:'sandbox',validateAddress:async()=>true,rate:async()=>800,create:async plan=>{creates++;return {shipmentId:randomUUID().replaceAll('-',''),transactionId:randomUUID().replaceAll('-',''),rateId:randomUUID().replaceAll('-',''),provider:'shippo',mode:'test',test:true,status:'SUCCESS',carrier:'USPS',service:'usps_priority',trackingNumbers:[`TEST-NOT-POSTAGE-${creates}`],trackingUrl:'https://tools.usps.com/go/TrackConfirmAction?tLabels=TEST',chargedCents:800,currency:'USD',reference:plan.reference};},reconcile:async result=>{if(pending)throw new ShippingBlocked('provider_pending','Fixture transaction pending');return result;},retrieveLabel:async()=>Buffer.from('%PDF-1.4 SYNTHETIC QA ONLY - NOT A SHIPPING LABEL'),track:async tracking=>[{tracking,code:'I',description:'Fixture transit',date:'20261119',time:'100000'},{tracking,code:'D',description:'Fixture delivery',date:'20261119',time:'120000'}],void:async()=>{}};
 let eventKey='';
 try{
  let trade=await submitTrade(owner,{requestId:tradeId,mode:'bulk',description:'Synthetic Shippo QA collection, not member inventory',cardCount:1,consent:true});
  trade=await operatorAction(trade,'fixture-operator',{action:'offer',requestId:randomUUID(),useStandardTerms:true,creditCents:8500,shippingApproved:true});
  await reconcileShipping(tradeId,{provider,config:qaShippingConfig,address:qaAddress});assert.equal(creates,0);
  trade=await applyTradeCommand(trade,owner,owner,'accept',{offerId:trade.currentOfferId,consent:true},randomUUID());
  await Promise.all([1,2,3].map(()=>reconcileShipping(tradeId,{provider,config:qaShippingConfig,address:qaAddress})));
  assert.equal(creates,1);let row=(await db`SELECT * FROM ssc_trade_shipping WHERE trade_id=${tradeId}::uuid`)[0];assert.equal(row.status,'provider_created');assert.equal((await getTrade(tradeId)).labels.length,0);
  pending=false;await reconcileShipping(tradeId,{provider,config:qaShippingConfig,address:qaAddress});assert.equal(creates,1);trade=await getTrade(tradeId);assert.equal(trade.labels.length,1);process.env.SHIPPO_MODE='live';assert.equal((await getTrade(tradeId)).labels.length,0);process.env.SHIPPO_MODE='test';
  row=(await db`SELECT * FROM ssc_trade_shipping WHERE trade_id=${tradeId}::uuid`)[0];await syncShipmentTracking(row,provider);await syncShipmentTracking(row,provider);assert.equal((await getTrade(tradeId)).state,'delivered');assert.equal(await tradeCreditBalance(owner),0);
  assert.equal(Number((await db`SELECT count(*) AS n FROM ssc_trade_tracking WHERE shipment_id=${row.id}::uuid`)[0].n),2);
  // Outbound labels require explicit fulfillment approval even for a paid-order fixture.
  await db`INSERT INTO ssc_checkouts(id,user_id,cart_hash,slugs,payload,status,session_id,expires_at) VALUES(${checkoutId}::uuid,${owner},'synthetic',ARRAY['synthetic-card'],${JSON.stringify({metadata:{card_cents:'8500',membership_cents:'0'}})}::jsonb,'paid',${sessionId},0)`;
  await db`INSERT INTO ssc_order_shipping(id,checkout_id,session_id,user_id,address,card_count,value_cents,environment,status) VALUES(${jobId}::uuid,${checkoutId}::uuid,${sessionId},${owner},${JSON.stringify(qaAddress)}::jsonb,1,8500,'sandbox','pending')`;
  process.env.SHIPPO_TEST_WORKFLOWS_ENABLED='false';
  const fixtureProvider={...provider,environment:'sandbox' as const,create:async(plan:Parameters<ShippingProvider['create']>[0])=>({...await provider.create(plan),mode:'test' as const,test:true})};
  const run=async()=>reconcileOrderShipping((await db`SELECT * FROM ssc_order_shipping WHERE id=${jobId}::uuid`)[0],{provider:fixtureProvider,config:qaShippingConfig,verifiedInput:{address:qaAddress,addressValid:true,count:1,valueCents:8500,test:true}});
  await run();assert.equal(creates,1);await db`UPDATE ssc_order_shipping SET approved_at=now() WHERE id=${jobId}::uuid`;await Promise.all([run(),run(),run()]);assert.equal(creates,2);
  const order=(await db`SELECT * FROM ssc_order_shipping WHERE id=${jobId}::uuid`)[0];assert.equal(order.status,'sandbox_ready');assert(order.label_contents);await run();assert.equal(creates,2);await syncOrderTracking(order,fixtureProvider);assert.equal((await db`SELECT status FROM ssc_order_shipping WHERE id=${jobId}::uuid`)[0].status,'sandbox_ready');
  const raw=JSON.stringify({event:'track_updated',test:true,data:{transaction:order.provider_result.transactionId,tracking_number:order.provider_result.trackingNumbers[0],carrier:'usps'}});eventKey=webhookHint(raw).key;await Promise.all([enqueueShippoWebhook(raw),enqueueShippoWebhook(raw)]);assert.equal(Number((await db`SELECT count(*) AS n FROM ssc_shipping_webhooks WHERE event_key=${eventKey}`)[0].n),1);
 }finally{
  if(eventKey)await db`DELETE FROM ssc_shipping_webhooks WHERE event_key=${eventKey}`;await db`DELETE FROM ssc_shipping_events WHERE job_id=${jobId}::uuid`;await db`DELETE FROM ssc_order_shipping WHERE id=${jobId}::uuid AND user_id=${owner}`;await db`DELETE FROM ssc_checkouts WHERE id=${checkoutId}::uuid AND user_id=${owner}`;
  await db`DELETE FROM ssc_trade_tracking WHERE shipment_id IN (SELECT id FROM ssc_trade_shipping WHERE trade_id=${tradeId}::uuid)`;await db`DELETE FROM ssc_trade_shipping WHERE trade_id=${tradeId}::uuid`;for(const table of ['ssc_trade_credit','ssc_trade_events','ssc_trade_labels','ssc_trade_files','ssc_trade_offers'])await db.query(`DELETE FROM ${table} WHERE trade_id=$1::uuid`,[tradeId]);await db`DELETE FROM ssc_trades_v3 WHERE id=${tradeId}::uuid AND user_id=${owner}`;
  if(oldEnabled===undefined)delete process.env.SHIPPO_TEST_WORKFLOWS_ENABLED;else process.env.SHIPPO_TEST_WORKFLOWS_ENABLED=oldEnabled;
  if(oldMode===undefined)delete process.env.SHIPPO_MODE;else process.env.SHIPPO_MODE=oldMode;
 }
});
