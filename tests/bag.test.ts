import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bagCards,bagTotals,checkoutSlugs,normalizeBag} from '../lib/bag';
import {bagCheckoutParams,checkoutUrl} from '../lib/bag-checkout';
import {memberArrivalDestination} from '../lib/member-arrival';
const slugs=bagCards.slice(0,2).map(c=>c.slug);
const input={slugs,membership:false,priceId:'price_annual',origin:'https://www.slabsupply.co',userId:'user_bag',customerId:'cus_bag',reservationId:'7f04347a-f534-4244-a8ed-3bab7c7e912e',expiresAt:1900000000};
test('bag deduplicates locally, rejects checkout tampering and caps at twenty unique slabs',()=>{
 assert.deepEqual(normalizeBag([...slugs,...slugs,'bad']),slugs);
 for(const invalid of [[],[...slugs,slugs[0]],['bad'],bagCards.slice(0,21).map(c=>c.slug),{slugs}])assert.throws(()=>checkoutSlugs(invalid));
 assert.equal(normalizeBag(bagCards.map(c=>c.slug)).length,20);
 const totals=bagTotals(slugs);assert.equal(totals.savingsCents,totals.retailCents-totals.memberCents);
});
test('one checkout contains every selected card once and exactly one annual fee for new members',()=>{
 for(const membership of [true,false]){
 const p=bagCheckoutParams({...input,membership});assert.equal(p.mode,membership?'subscription':'payment');assert.equal(p.line_items?.length,membership?3:2);
 assert.equal(p.metadata?.membership_cents,membership?'14900':'0');assert.equal(p.metadata?.card_cents,String(bagTotals(slugs).memberCents));assert.equal(p.expires_at,input.expiresAt);
 const cards=p.line_items!.filter(c=>c.price_data);assert.ok(cards.every(c=>c.quantity===1&&!c.price_data?.recurring));
 assert.deepEqual(cards.map(c=>c.price_data?.product_data?.metadata?.card_slug),slugs);
 assert.equal(p.line_items!.filter(c=>c.price==='price_annual').length,membership?1:0);
 assert.ok(p.cancel_url?.includes(input.reservationId));assert.ok(p.success_url?.includes('/account/orders'));
 }
 const max=bagCheckoutParams({...input,slugs:bagCards.slice(0,20).map(c=>c.slug),membership:true});assert.equal(max.line_items?.length,21);assert.ok(Object.values(max.metadata!).every(v=>String(v).length<=500));
 assert.throws(()=>bagCheckoutParams({...input,slugs:[]}));assert.equal(bagCheckoutParams({...input,slugs:[],membership:true}).line_items?.length,1);
});
test('bag intent survives enrollment and checkout URLs reject live or external destinations',()=>{
 assert.equal(memberArrivalDestination({enrollment:true,activeMembership:true,card:'bag'}),'/checkout?bag=1&continue=1');
 assert.equal(memberArrivalDestination({enrollment:true,activeMembership:false,card:'bag'}),'/join?checkout=continue&bag=1');
 for(const url of ['https://evil.test','http://checkout.stripe.com'])assert.throws(()=>checkoutUrl({url,livemode:false}));
 assert.throws(()=>checkoutUrl({url:'https://checkout.stripe.com/c/pay/example',livemode:true}));
});
import type Stripe from 'stripe';
import {bagOrderFromSession,orderSavings} from '../lib/member-orders';
test('paid bag orders retain all card snapshots and exclude the membership from savings',()=>{
 const params=bagCheckoutParams({...input,membership:true}),totals=bagTotals(slugs);
 const lines=params.line_items!.filter(c=>c.price_data).map(c=>({quantity:1,amount_subtotal:c.price_data!.unit_amount,price:{recurring:null,product:{...c.price_data!.product_data,deleted:false}}})) as unknown as Stripe.LineItem[];
 const session={id:'cs_test_bag',created:100,livemode:false,status:'complete',payment_status:'paid',currency:'usd',client_reference_id:input.userId,metadata:params.metadata,amount_subtotal:totals.memberCents+14900,amount_total:totals.memberCents+14900} as unknown as Stripe.Checkout.Session;
 const order=bagOrderFromSession(session,lines,input.userId)!;assert.ok(order);assert.equal(order.items.length,2);assert.equal(order.membershipCents,14900);assert.equal(orderSavings([order]),totals.savingsCents);
 assert.equal(bagOrderFromSession(session,lines,'someone_else'),null);assert.equal(bagOrderFromSession({...session,payment_status:'unpaid'},lines,input.userId),null);assert.equal(bagOrderFromSession(session,lines.slice(0,1),input.userId),null);assert.equal(bagOrderFromSession({...session,amount_subtotal:1},lines,input.userId),null);
});
