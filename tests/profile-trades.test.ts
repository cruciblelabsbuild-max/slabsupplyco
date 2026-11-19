import {profileCheckoutShipping,matchesProfileShipping} from "../lib/profile-checkout-shipping";
import type Stripe from "stripe";
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {withProfileReturnAddress} from '../lib/shipping/profile-address';
import {operatorAction} from '../lib/trades/store';
import {memberStatus,operatorStatus} from '../components/trades/status-copy';
import {actionRequired,nextTradeAction} from '../lib/trades/model';
import type {Trade} from '../lib/trades/model';
const address={name:'Avery Member',line1:'123 Example Street',line2:'',city:'Brooklyn',region:'NY',postalCode:'11249',country:'US'};
const profile={shipping:{recipient:address.name,...address}};
function trade():Trade{return {id:'11111111-1111-4111-a111-111111111111',userId:'member',reference:'TRADE-11111111',state:'awaiting_label',revision:1,createdAt:'2026-11-19T12:00:00Z',updatedAt:'2026-11-19T12:00:00Z',submission:{mode:'bulk',cards:[],description:'A collection of graded cards',notes:'',cardCount:null},offers:[],currentOfferId:null,acceptedOfferId:null,files:[],labels:[],events:[],creditTransactionId:null,shipping:{status:'pending',adminStatus:'Label pending',reason:'',needsCount:true,needsAddress:false,approved:true,direction:'inbound',cardCount:null,address:null}};}
test('trade summary reuses the profile address and keeps an existing shipment address',()=>{
 const t=trade();assert.deepEqual(withProfileReturnAddress(t,profile).shipping?.address,address);
 const saved={...t,shipping:{...t.shipping!,address:{...address,line1:'Original shipment address'}}};assert.equal(withProfileReturnAddress(saved,profile).shipping?.address?.line1,'Original shipment address');
 assert.equal(withProfileReturnAddress(t,{shipping:{...profile.shipping,country:'Canada'}}).shipping?.address,null);
});
test('only missing return addresses require member action; missing card counts belong to the admin',()=>{
 const t=withProfileReturnAddress(trade(),profile);assert.equal(memberStatus(t).title,'Shipping label pending.');assert.equal(operatorStatus(t).owner,'You');assert.equal(actionRequired(t),false);
 t.shipping!.needsAddress=true;t.shipping!.address=null;assert.equal(memberStatus(t).title,'Add your shipping address.');assert.match(memberStatus(t).copy,/prepaid label/);assert.equal(actionRequired(t),true);assert.equal(nextTradeAction(t),'Add return address');
});
test('new offers cannot leave card count for the member to supply later',async()=>{
 const t=trade();t.state='submitted';await assert.rejects(()=>operatorAction(t,'admin',{action:'offer',useStandardTerms:true,creditCents:8500,shippingApproved:true}),/number of cards/);
});

test('the same complete US profile address prefills purchase checkout without changing paid orders',()=>{
 const shipping=profileCheckoutShipping(profile)!;assert.equal(shipping.name,address.name);assert.equal(shipping.address?.line1,address.line1);assert.equal(shipping.address?.country,'US');assert.equal(matchesProfileShipping(shipping as Stripe.Customer.Shipping,shipping),true);assert.equal(matchesProfileShipping(null,shipping),false);assert.equal(profileCheckoutShipping({shipping:{...profile.shipping,region:''}}),null);
});
