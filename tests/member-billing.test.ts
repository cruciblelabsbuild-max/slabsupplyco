import { test } from "node:test";
import assert from "node:assert/strict";
import { blocksNewMembership, reusableCheckout } from "../lib/member-billing";
import type Stripe from "stripe";
test("existing or unresolved subscriptions block a second membership",async()=>{
 for(const status of ["active","trialing","past_due","unpaid","incomplete","paused"]) {
 assert.equal(blocksNewMembership(status),true);
 const stripe={subscriptions:{list:async()=>({data:[{status}]})}} as unknown as Stripe;
 assert.equal((await reusableCheckout(stripe,"cus_member","user_member","price_annual")).blocked,true);
 }
 for(const status of ["canceled","incomplete_expired"])assert.equal(blocksNewMembership(status),false);
});
test("repeated checkout reuses one open session and concurrent requests share a stable server key",async()=>{
 const open={id:"cs_test_open",status:"open",livemode:false,url:"https://checkout.stripe.com/c/pay/cs_test_open",metadata:{clerk_user_id:"user_member",membership:"founding-annual",membership_price:"price_annual"}};
 const stripe=(sessions:unknown[])=>({subscriptions:{list:async()=>({data:[]})},checkout:{sessions:{list:async()=>({data:sessions})}}}) as unknown as Stripe;
 assert.equal((await reusableCheckout(stripe([open]),"cus_member","user_member","price_annual")).url,open.url);
 const expired={...open,id:"cs_test_expired",status:"expired",url:null};
 const [one,two]=await Promise.all([reusableCheckout(stripe([expired]),"cus_member","user_member","price_annual"),reusableCheckout(stripe([expired]),"cus_member","user_member","price_annual")]);
 assert.equal(one.key,"cs_test_expired");assert.deepEqual(one,two);
 assert.equal((await reusableCheckout(stripe([{...open,metadata:{...open.metadata,clerk_user_id:"user_other"}}]),"cus_member","user_member","price_annual")).url,undefined);
});
