import test from 'node:test';
import assert from 'node:assert/strict';
import {compareCatalogCards,demonstratedSavings} from '../lib/catalog-sort';
import {pendingTradeStage} from '../lib/trades/presentation';
import {tradeRequest} from '../components/trades/api';
import type {Trade} from '../lib/trades/model';

test('Most savings uses dollar savings, retains stable curated ties and puts missing comparisons last',()=>{
 const cards=[{id:'percent',retail:20,member:10},{id:'dollars',retail:200,member:175},{id:'missing',retail:NaN,member:1},{id:'zero',retail:15,member:15},{id:'tie',retail:50,member:40}];
 assert.deepEqual([...cards].sort((a,b)=>compareCatalogCards(a,b,'savings')).map(c=>c.id),['dollars','percent','tie','zero','missing']);
 assert.deepEqual([...cards].sort((a,b)=>compareCatalogCards(a,b,'curated')),cards);
 assert.equal(demonstratedSavings({retail:45.99,member:40.24}),575);
 assert.equal(demonstratedSavings({retail:0,member:10}),null);
 assert.equal([...cards].sort((a,b)=>compareCatalogCards(a,b,'low'))[0].id,'missing');
 assert.equal([...cards].sort((a,b)=>compareCatalogCards(a,b,'high'))[0].id,'dollars');
});
const pending=(state:Trade['state'],accepted=true)=>({state,acceptedOfferId:accepted?'offer':null,offers:[{id:'offer',creditCents:10000}]} as Trade);
test('Pending credit captions reflect accepted offers at their actual lifecycle stage',()=>{
 assert.equal(pendingTradeStage([]),'No pending trades');
 assert.equal(pendingTradeStage([pending('offer_ready',false)]),'No pending trades');
 assert.equal(pendingTradeStage([pending('awaiting_label')]),'Awaiting shipment');
 assert.equal(pendingTradeStage([pending('awaiting_shipment')]),'Awaiting shipment');
 assert.equal(pendingTradeStage([pending('in_transit')]),'In transit');
 assert.equal(pendingTradeStage([pending('inspecting')]),'Awaiting inspection');
 assert.equal(pendingTradeStage([pending('ready_credit')]),'Awaiting credit approval');
 assert.equal(pendingTradeStage([pending('revised_offer')]),'Review revised offer');
 assert.equal(pendingTradeStage([pending('awaiting_shipment'),pending('inspecting')]),'View trade progress');
 assert.equal(pendingTradeStage([pending('credit_issued')]),'No pending trades');
});
test('Submission transport only confirms saved records and surfaces server and network failures',async()=>{
 const original=globalThis.fetch;const payload={requestId:'same-retry-id',description:'15 graded Pokémon cards'};
 try{
  globalThis.fetch=async(_url,options)=>{assert.deepEqual(JSON.parse(String(options?.body)),payload);return Response.json({message:'Storage unavailable'},{status:503});};
  await assert.rejects(tradeRequest('/api/trades',payload),/Storage unavailable/);
  globalThis.fetch=async()=>Response.json({});await assert.rejects(tradeRequest('/api/trades',payload));
  globalThis.fetch=async()=>{throw Error('Offline');};await assert.rejects(tradeRequest('/api/trades',payload),/Offline/);
  globalThis.fetch=async()=>Response.json({trade:{id:'confirmed',state:'submitted',files:[{id:'retained-file'}]}});
  const saved=await tradeRequest('/api/trades',payload);assert.equal(saved.id,'confirmed');assert.equal(saved.files[0].id,'retained-file');
 }finally{globalThis.fetch=original;}
});
