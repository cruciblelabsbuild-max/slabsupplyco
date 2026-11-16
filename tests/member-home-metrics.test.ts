import assert from "node:assert/strict";
import test from "node:test";
import {memberHomeMetrics,totalMemberSavings,displayMemberMoney} from "../lib/member-home-metrics";
import {parseTradeRequest} from "../lib/member-trades";
test("savings count completed card purchases and exclude refunds and pending payments",()=>{
 const order={status:"completed",currency:"usd",retailValueCents:70000,cardSubtotalCents:59500};
 assert.equal(totalMemberSavings({memberPurchases:{a:order,b:{...order,status:"refunded"},c:{...order,status:"pending"},d:{...order,retailValueCents:100,cardSubtotalCents:200}}}),10500);
 assert.equal(totalMemberSavings({memberProfile:{savings:99999}}),0);
 for(const purchases of [[],null,{a:{...order,cardSubtotalCents:-1}},{a:{...order,currency:"eur"}}])assert.equal(totalMemberSavings({memberPurchases:purchases}),null);
});
test("active trade-ins count open submissions, excluding completed and declined requests",()=>{
 const card={cardName:"Snorlax #11",set:"Jungle",year:"1999",grader:"PSA",grade:"9",condition:"Intact",certification:""};
 const trade=parseTradeRequest({requestId:"00000000-0000-4000-8000-000000000001",cardCount:2,cards:[card,card],preference:"credit",consent:true});
 const tradeRequests=Object.fromEntries(["submitted","reviewing","quoted","completed","declined"].map((status,i)=>[status,{...trade,id:`00000000-0000-4000-8000-00000000000${i}`,status}]));
 assert.equal(memberHomeMetrics({tradeRequests}).activeTrades,3);
 assert.deepEqual(memberHomeMetrics({}),{savingsCents:0,creditCents:0,activeTrades:0});
 assert.deepEqual(memberHomeMetrics(null),{savingsCents:null,creditCents:null,activeTrades:null});
 assert.equal(displayMemberMoney(0),"$0");assert.equal(displayMemberMoney(10525),"$105.25");
});
