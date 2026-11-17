import {test} from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {inventoryDb} from "../lib/inventory-db";
import {ensureTrades,submitTrade,getTrade,operatorAction,applyTradeCommand,tradeCreditBalance} from "../lib/trades/store";
import {reconcileShipping} from "../lib/shipping/service";
import {pendingCredit,type Trade} from "../lib/trades/model";
import type {ShippingProvider,ShippingConfig} from "../lib/shipping/types";
const address={name:"QA Only",line1:"123 Synthetic Street",city:"Synthetic City",region:"NY",postalCode:"10001",country:"US"};
const config:ShippingConfig={company:address,profiles:[{id:"QA-FIXTURE-NOT-MEASURED",capacity:3,lengthIn:8,widthIn:6,heightIn:4,emptyWeightLb:.5,slabWeightLb:.2,serviceCode:"03",measurementRecord:"SYNTHETIC TEST ONLY",measuredAt:"2026-11-16"}],coverage:{verified:true,reference:"QA FIXTURE ONLY",method:"third_party",perPackageMaxCents:100000,shipmentMaxCents:100000,signatureThresholdCents:50000,approvedServices:["03"]},maxRateCents:5000,maxPackages:12};
test("automatic shipping requires both approvals, handles either order, isolates sandbox and cannot repurchase ambiguous requests",{skip:process.env.RUN_TRADE_DB_TESTS!=="1"},async()=>{
 await ensureTrades();const db=inventoryDb(),owner=`shipping-qa-${randomUUID()}`,ids:string[]=[];let creates=0,recoveries=0,failCreate=false,failRecovery=false;const provider:ShippingProvider={name:"SYNTHETIC-TEST-ONLY",environment:"production",validateAddress:async()=>true,rate:async()=>1000,create:async plan=>{creates++;if(failCreate)throw Error("Fixture timeout");return {shipmentId:`QA-${creates}`,trackingNumbers:plan.packages.map((_,i)=>`1ZQA${String(creates).padStart(12,"0")}${i}Q`),chargedCents:1000,currency:"USD"};},retrieveLabel:async()=>{recoveries++;if(failRecovery)throw Error("Fixture PDF unavailable");return Buffer.from("%PDF-1.4 SYNTHETIC TEST ONLY - NOT A POSTAGE LABEL");},track:async()=>[],void:async()=>{}};
 const op=(t:Trade,action:string,data:Record<string,unknown>={})=>operatorAction(t,"qa-operator",{action,note:"Synthetic QA action",requestId:randomUUID(),...data});
 const accept=(t:Trade)=>applyTradeCommand(t,owner,owner,"accept",{offerId:t.currentOfferId,consent:true},randomUUID());
 async function newOffer(approved:boolean,count=1){const id=randomUUID();ids.push(id);const t=await submitTrade(owner,{requestId:id,mode:"bulk",description:"Synthetic shipping QA collection",cardCount:count,consent:true});return op(t,"offer",{useStandardTerms:true,creditCents:8500,shippingApproved:approved});}
 const run=(id:string,environment:"sandbox"|"production"="production")=>reconcileShipping(id,{provider:{...provider,environment},config,address});
 try{
  // Approval first; acceptance later. Unaccepted offers cannot create labels.
  let t=await newOffer(true,7);await run(t.id);assert.equal(creates,0);t=await accept(t);await Promise.all([run(t.id),run(t.id),run(t.id)]);t=await getTrade(t.id);assert.equal(creates,1);assert.equal(t.labels.length,3);assert.equal(t.state,"awaiting_shipment");assert.equal(pendingCredit(t),8500);assert.equal(await tradeCreditBalance(owner),0);await run(t.id);assert.equal(creates,1);
  // Member accepts first, then administrator approves.
  let reverse=await accept(await newOffer(false));await run(reverse.id);assert.equal(creates,1);reverse=await op(await getTrade(reverse.id),"approve_shipping",{termsVerified:true});await run(reverse.id);assert.equal(creates,2);assert.equal((await getTrade(reverse.id)).labels.length,1);
  // No configured UPS credentials: no fabricated label or tracking.
  let unavailable=await accept(await newOffer(true));await reconcileShipping(unavailable.id);unavailable=await getTrade(unavailable.id);assert.equal(unavailable.labels.length,0);assert.equal(unavailable.state,"awaiting_label");assert.match(unavailable.shipping!.reason,/unavailable/);assert.equal(creates,2);
  // Sandbox documents never enter member-facing production labels.
  let sandbox=await accept(await newOffer(true));await run(sandbox.id,"sandbox");sandbox=await getTrade(sandbox.id);assert.equal(sandbox.labels.length,0);assert.equal(sandbox.state,"awaiting_label");assert.equal((await db`SELECT status FROM ssc_trade_shipping WHERE trade_id=${sandbox.id}::uuid`)[0].status,"sandbox_ready");
  // A timeout after creation starts is not blindly retried, even by concurrent workers.
  const uncertain=await accept(await newOffer(true));failCreate=true;const before=creates;await run(uncertain.id);await Promise.all([run(uncertain.id),run(uncertain.id)]);assert.equal(creates,before+1);assert.equal((await db`SELECT status FROM ssc_trade_shipping WHERE trade_id=${uncertain.id}::uuid`)[0].status,"unknown");failCreate=false;
  // PDF recovery can retry without another shipment purchase.
  const recovery=await accept(await newOffer(true));failRecovery=true;const prior=creates;await run(recovery.id);assert.equal(creates,prior+1);assert.equal((await getTrade(recovery.id)).labels.length,0);failRecovery=false;await run(recovery.id);assert.equal(creates,prior+1);assert.equal((await getTrade(recovery.id)).labels.length,1);assert(recoveries>0);
  // Return labels cannot be created before a return decision is finalized.
  t=await op(t,"stage",{state:"in_transit"});t=await op(t,"stage",{state:"received"});t=await op(t,"offer",{useStandardTerms:true,kind:"inspection",creditCents:7000,reason:"Synthetic condition revision",shippingApproved:true});const preReturn=creates;await run(t.id);assert.equal(creates,preReturn);t=await applyTradeCommand(t,owner,owner,"decline_offer",{offerId:t.currentOfferId,consent:false},randomUUID());await run(t.id);t=await getTrade(t.id);assert.equal(t.state,"return_label");assert(t.labels.some(l=>l.direction==="return"));assert.equal(pendingCredit(t),0);assert.equal(await tradeCreditBalance(owner),0);
 }finally{await db`DELETE FROM ssc_trade_tracking WHERE shipment_id IN (SELECT id FROM ssc_trade_shipping WHERE trade_id=ANY(${ids}::uuid[]))`;await db`DELETE FROM ssc_trade_shipping WHERE trade_id=ANY(${ids}::uuid[])`;for(const table of ["ssc_trade_credit","ssc_trade_events","ssc_trade_labels","ssc_trade_files","ssc_trade_offers"])await db.query(`DELETE FROM ${table} WHERE trade_id=ANY($1::uuid[])`,[ids]);await db`DELETE FROM ssc_trades_v3 WHERE id=ANY(${ids}::uuid[]) AND user_id=${owner}`;}
});
