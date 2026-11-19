import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {emailTypes,definitions,renderEmail,promotional} from '../lib/email/templates';
import {sendingAllowed,unsubscribeToken,tokenOwner,verifyResendWebhook} from '../lib/email/security';
import {stripeEmailEvent} from '../lib/email/events';
import type Stripe from 'stripe';
const content={name:'Alex <script>',reference:'TRADE-ABC',amountCents:18500,balanceCents:26500,totalCents:10000,endDate:'November 20, 2027',date:'December 1, 7 PM EST',ctaUrl:'https://www.slabsupply.co/account',cards:[{name:'Actual selected card',grade:'PSA 10',image:'/cards/grails/umbreon-vmax-215.png',paidCents:10000,retailCents:12000}]};
test('exactly ten branded templates with matching subject, category, HTML and plaintext',()=>{
 assert.equal(emailTypes.length,10);
 for(const type of emailTypes){const result=renderEmail(type,content,{unsubscribeUrl:promotional(type)?'https://www.slabsupply.co/api/email/unsubscribe?token=fixture':undefined});assert.equal(result.subject,definitions[type].subject);assert.ok(result.html.includes('/email/logo.png'));assert.ok(result.html.includes(definitions[type].cta));assert.ok(result.text.includes(definitions[type].cta));assert.ok(result.text.includes(`${definitions[type].category}@slabsupply.co`));assert.ok(result.html.includes('viewport'));assert.ok(!result.html.includes('<script>'));assert.equal(result.html.includes('Unsubscribe'),promotional(type));}
});
test('preview and development cannot send even if a flag is accidentally enabled',()=>{
 for(const env of ['preview','development',undefined])assert.equal(sendingAllowed({VERCEL_ENV:env,EMAIL_SENDING_ENABLED:'true',RESEND_API_KEY:'key'}),false);
 assert.equal(sendingAllowed({VERCEL_ENV:'production',EMAIL_SENDING_ENABLED:'false',RESEND_API_KEY:'key'}),false);
 assert.equal(sendingAllowed({VERCEL_ENV:'production',EMAIL_SENDING_ENABLED:'true',RESEND_API_KEY:'key'}),true);
});
test('unsubscribe tokens bind the member and reject tampering',()=>{process.env.EMAIL_UNSUBSCRIBE_SECRET='only-for-unit-tests-long-secret-key';const token=unsubscribeToken('user_fixture');assert.equal(tokenOwner(token),'user_fixture');assert.throws(()=>tokenOwner(token+'x'));assert.throws(()=>tokenOwner('garbage'));});
test('delivery webhook verifies exact body, signature and replay window',()=>{
 const body=JSON.stringify({type:'email.delivered',data:{email_id:'fixture'}}),stamp=String(Math.floor(Date.now()/1000)),key=Buffer.from('unit-test-signing-key').toString('base64');
 const signature=createHmac('sha256',Buffer.from(key,'base64')).update(`evt_fixture.${stamp}.${body}`).digest('base64'),headers=new Headers({'svix-id':'evt_fixture','svix-timestamp':stamp,'svix-signature':'v1,'+signature});
 assert.equal(verifyResendWebhook(body,headers,'whsec_'+key).event.type,'email.delivered');assert.throws(()=>verifyResendWebhook(body+' ',headers,'whsec_'+key));assert.throws(()=>verifyResendWebhook(body,headers,'whsec_'+key,Date.now()+600000));
});
test('welcome only comes from a successful initial paid membership invoice',()=>{
 const event={type:'invoice.paid',data:{object:{id:'in_fixture',status:'paid',amount_paid:14900,billing_reason:'subscription_create',parent:{subscription_details:{subscription:'sub_fixture',metadata:{clerk_user_id:'user_fixture',membership:'founding-annual'}}}}}} as unknown as Stripe.Event;
 assert.equal(stripeEmailEvent(event)?.id,'membership:sub_fixture');
 const invoice=event.data.object as Stripe.Invoice;invoice.amount_paid=0;assert.equal(stripeEmailEvent(event),null);invoice.amount_paid=14900;invoice.billing_reason='subscription_cycle';assert.equal(stripeEmailEvent(event),null);event.type='checkout.session.completed';assert.equal(stripeEmailEvent(event),null);
});
test('cancellation is deduplicated across scheduling and deletion',()=>{
 const event={type:'customer.subscription.updated',data:{object:{id:'sub_fixture',canceled_at:100,cancel_at_period_end:true,status:'active',metadata:{clerk_user_id:'user_fixture',membership:'founding-annual'}}}} as unknown as Stripe.Event;
 const scheduled=stripeEmailEvent(event);event.type='customer.subscription.deleted';(event.data.object as Stripe.Subscription).status='canceled';assert.equal(stripeEmailEvent(event)?.id,scheduled?.id);
});
test('cancellation accurately preserves paid-through access',()=>{assert.match(renderEmail('membership_cancelled',content).text,/continues through November 20, 2027/);assert.match(renderEmail('membership_cancelled',{...content,endDate:undefined}).text,/has ended/);});
test('transactional links reject unsafe protocols',()=>{assert.throws(()=>renderEmail('trade_label',{...content,ctaUrl:'javascript:alert(1)'}));});

test('email return links allow only known authenticated destinations',async()=>{const {emailDestination}=await import('../lib/email/links');assert.equal(emailDestination('/account'),'/account');assert.equal(emailDestination('/api/trades/11111111-1111-4111-a111-111111111111/files/22222222-2222-4222-a222-222222222222'),'/api/trades/11111111-1111-4111-a111-111111111111/files/22222222-2222-4222-a222-222222222222');for(const value of ['https://evil.example','//evil.example','/api/admin','/account?redirect=https://evil.example','/account/../api/admin'])assert.equal(emailDestination(value),null);});
