import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {inventoryDb} from '../lib/inventory-db';
import {submitTrade,applyTradeCommand,operatorAction} from '../lib/trades/store';
import {parseOffer} from '../lib/trades/model';
import {defaultOfferInput} from '../lib/trades/policies';
test('admin confirms a missing legacy shipment count without changing the accepted offer or asking the member',{skip:process.env.RUN_TRADE_DB_TESTS!=='1'},async()=>{
 const id=randomUUID(),owner=`profile-trade-qa-${randomUUID()}`,db=inventoryDb();
 try{
  let trade=await submitTrade(owner,{requestId:id,mode:'bulk',description:'Disposable legacy collection shipping check',consent:true});
  const offer=parseOffer({...defaultOfferInput(trade),creditCents:8500},randomUUID(),1,'preliminary');assert.equal(offer.includedCount,null);
  trade=await applyTradeCommand(trade,'fixture-admin',null,'offer',offer,randomUUID());trade=await applyTradeCommand(trade,owner,owner,'accept',{offerId:offer.id,consent:true},randomUUID());
  assert.equal(trade.shipping?.needsCount,true);
  trade=await operatorAction(trade,'fixture-admin',{action:'approve_shipping',termsVerified:true,direction:'inbound',cardCount:3,requestId:randomUUID()});
  const row=(await db`SELECT card_count,approved_at FROM ssc_trade_shipping WHERE trade_id=${id}::uuid`)[0];assert.equal(row.card_count,3);assert(row.approved_at);assert.equal(trade.acceptedOfferId,offer.id);assert.equal(trade.offers[0].includedCount,null);assert.equal(trade.shipping?.needsCount,false);
 }finally{
  await db`DELETE FROM ssc_trade_shipping WHERE trade_id=${id}::uuid`;for(const table of ['ssc_trade_credit','ssc_trade_events','ssc_trade_labels','ssc_trade_files','ssc_trade_offers'])await db.query(`DELETE FROM ${table} WHERE trade_id=$1::uuid`,[id]);await db`DELETE FROM ssc_trades_v3 WHERE id=${id}::uuid AND user_id=${owner}`;
 }
});
