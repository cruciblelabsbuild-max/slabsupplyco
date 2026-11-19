import {test} from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import {createCardCheckout,purchaseCard} from "../lib/card-checkout";
import {cardOrderFromSession,orderSavings} from "../lib/member-orders";
import {enrollmentArrivalUrl,memberArrivalDestination} from "../lib/member-arrival";
import {enrollmentSignInUrl} from "../lib/enrollment-sign-in";
const slug="selection-sv3pt5-142-psa-9";
const input={slug,membership:false,priceId:"price_annual",origin:"https://www.slabsupply.co",userId:"user_example",customerId:"cus_example",key:"first"};
const annual={active:true,livemode:false,currency:"usd",unit_amount:14900,type:"recurring",recurring:{interval:"year",interval_count:1,usage_type:"licensed"}};
test("members buy a card once; new members pay card plus annual fee in a single session",async()=>{
 for(const membership of [false,true]){
  let params:Stripe.Checkout.SessionCreateParams|undefined;
  let key="";
  const stripe={prices:{retrieve:async()=>annual},checkout:{sessions:{create:async(p:Stripe.Checkout.SessionCreateParams,o:{idempotencyKey:string})=>{params=p;key=o.idempotencyKey;return {url:"https://checkout.stripe.com/c/pay/cs_test_checkout",livemode:false};}}}} as unknown as Stripe;
  await createCardCheckout(stripe,{...input,membership});
  assert.equal(params!.mode,membership?"subscription":"payment");
  assert.equal(params!.line_items!.length,membership?2:1);
  const card=params!.line_items!.at(-1)!;
  assert.equal(card.price_data!.unit_amount,1500);
  assert.equal(card.quantity,1);
  assert.equal(card.price_data!.recurring,undefined);
  assert.equal(params!.metadata!.membership_cents,membership?"14900":"0");
  assert.equal(params!.metadata!.clerk_user_id,input.userId);
  assert.deepEqual(params!.shipping_address_collection?.allowed_countries,["US"]);
  assert.ok(params!.success_url!.includes("/account/orders?session_id="));
  assert.equal(key,membership?"founding-user_example-first":`card-user_example-${slug}-first`);
  if(membership){assert.equal(params!.line_items![0].price,"price_annual");assert.equal(params!.subscription_data!.metadata!.clerk_user_id,input.userId);}
 }
});
test("card prices are server-owned and invalid selections or live annual prices are rejected",async()=>{
 assert.equal(purchaseCard("https://evil.test"),undefined);
 assert.equal(purchaseCard({slug}),undefined);
 let created=false;
 const stripe={prices:{retrieve:async()=>({...annual,livemode:true})},checkout:{sessions:{create:async()=>{created=true;}}}} as unknown as Stripe;
 await assert.rejects(()=>createCardCheckout(stripe,{...input,slug:"selection-missing"}));
 await assert.rejects(()=>createCardCheckout(stripe,{...input,membership:true}));
 assert.equal(created,false);
});
const session={id:"cs_test_order",created:100,livemode:false,mode:"subscription",status:"complete",payment_status:"paid",currency:"usd",client_reference_id:"user_example",amount_subtotal:16400,amount_total:16400,metadata:{kind:"card-order-v1",phase:"test",clerk_user_id:"user_example",card_slug:slug,card_name:"Aerodactyl #142",card_grade:"PSA 9",card_image:"/cards/selection/sv3pt5-142.webp",retail_cents:"1700",card_cents:"1500",membership_cents:"14900"}} as unknown as Stripe.Checkout.Session;
test("only owned, completed Stripe payments enter orders; membership never inflates card savings",()=>{
 const order=cardOrderFromSession(session,"user_example")!;
 assert.ok(order);
 assert.equal(order.membershipCents,14900);
 assert.equal(orderSavings([order]),200);
 assert.equal(orderSavings([{...order,status:"refunded"}]),0);
 assert.equal(orderSavings([{...order,status:"partially-refunded"}]),0);
 assert.equal(orderSavings(null),null);
 for(const bad of [{...session,livemode:true},{...session,payment_status:"unpaid"},{...session,status:"open"},{...session,amount_subtotal:1500},{...session,metadata:{...session.metadata,card_image:"https://evil.test/tracker"}}]) assert.equal(cardOrderFromSession(bad,"user_example"),null);
 assert.equal(cardOrderFromSession(session,"user_other"),null);
});
test("Google transfers preserve the card without allowing an external redirect",()=>{
 assert.equal(enrollmentArrivalUrl(undefined,slug),`/member-entry?checkout=continue&card=${slug}`);
 assert.equal(enrollmentSignInUrl(undefined,slug),`/sign-in?checkout=continue&card=${slug}`);
 assert.equal(memberArrivalDestination({enrollment:true,activeMembership:true,card:slug}),`/checkout?card=${slug}&continue=1`);
 assert.equal(memberArrivalDestination({enrollment:true,activeMembership:false,card:slug}),`/join?checkout=continue&card=${slug}`);
 assert.equal(enrollmentArrivalUrl(undefined,"https://evil.test"),"/member-entry?checkout=continue");
});
