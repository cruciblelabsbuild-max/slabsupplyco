import {clerkClient} from '@clerk/nextjs/server';
import {getStripe} from '../stripe';
import {inventoryDb} from '../inventory-db';
import {bagOrderFromSession,cardOrderFromSession,orderCharge} from '../member-orders';
import {getTrade,tradeCreditBalance} from '../trades/store';
import {membershipPeriod} from '../membership-period';
import {membershipForUser} from '../member-subscription';
import {confirmedGrailDrop} from '../grail-data';
import {grailDateLabel} from '../grail-presentation';
import {visibleShippingDocument} from '../shipping/mode';
import {emailPreference} from './store';
import {emailOrigin,promotional,type EmailType,type EmailContent} from './templates';
export class SkipEmail extends Error {}
const date=(seconds:number)=>new Intl.DateTimeFormat('en-US',{dateStyle:'long',timeZone:'America/New_York'}).format(new Date(seconds*1000));
function skip(message:string):never{throw new SkipEmail(message);}
export const emailContentDependencies={user:async(id:string)=>(await clerkClient()).users.getUser(id),stripe:getStripe,db:inventoryDb,trade:getTrade,balance:tradeCreditBalance,membership:membershipForUser,drop:confirmedGrailDrop,preference:emailPreference};
export async function buildEmailContent(type:EmailType,userId:string,source:Record<string,string>,deps=emailContentDependencies):Promise<{to:string;data:EmailContent}>{
 const user=await deps.user(userId);
 const email=user.emailAddresses.find(e=>e.id===user.primaryEmailAddressId&&e.verification?.status==='verified')?.emailAddress;
 if(!email)skip('No verified recipient.');const name=user.firstName||user.fullName||'Member';
 const origin=emailOrigin(),data:EmailContent={name,ctaUrl:origin+'/account'};
 if(promotional(type)){
  if(!await deps.preference(userId))skip('Promotional email opted out.');
  const membership=await deps.membership(userId);if(membership.state==='unavailable')throw Error('Membership verification unavailable.');if(membership.state!=='active-test')skip('Paid membership not active.');
  const drop=await deps.drop(source.month);if(!drop||drop.preview_only||!drop.starts_at||drop.month!==source.month||drop.starts_at!==source.startsAt)skip('Drop is not confirmed.');
  const days=(Date.parse(drop.starts_at!)-Date.now())/86400000;
  if(type==='grail_upcoming'&&(days<5||days>7)||type==='grail_live'&&(days>0||drop.ends_at&&Date.parse(drop.ends_at)<=Date.now()))skip('Outside announcement window.');
  const cards=drop.cards.filter(c=>c.stock==='available');if(!cards.length)skip('No confirmed available inventory.');
  // A member who already purchased any confirmed card from this month receives no further purchase prompt.
  const purchased=await deps.db()`SELECT 1 FROM ssc_checkouts c WHERE c.user_id=${userId} AND c.status='paid' AND c.slugs && ${drop.cards.map(c=>c.slug)}::text[] LIMIT 1`;if(purchased.length)skip('Monthly grail already purchased.');
  data.cards=cards.map(c=>({name:c.name,grade:c.grade,image:c.image,paidCents:Math.round(c.member*100),retailCents:Math.round(c.retail*100)}));data.date=grailDateLabel(drop.starts_at!);data.ctaUrl=origin+'/drops';
 }else if(type.startsWith('trade_')){
  const trade=await deps.trade(source.tradeId,userId);data.reference=trade.reference;data.ctaUrl=`${origin}/trade-ins?view=trades&trade=${trade.id}`;
  if(type==='trade_submitted'){if(trade.state==='draft')skip('Trade not submitted.');}
  if(type==='trade_offer'){
   const offer=trade.offers.find(o=>o.id===source.offerId);if(!offer||trade.currentOfferId!==offer.id||!['offer_ready','revised_offer'].includes(trade.state)||offer.expiresAt&&Date.parse(offer.expiresAt)<Date.now())skip('Offer no longer actionable.');data.amountCents=offer!.creditCents;
  }
  if(type==='trade_label'){
   const label=trade.labels.find(l=>l.id===source.labelId&&l.direction==='inbound'&&l.provider==='shippo'&&visibleShippingDocument(l));if(!label||!trade.acceptedOfferId)skip('No verified shipping label.');
   const job=await deps.db()`SELECT id FROM ssc_trade_shipping WHERE trade_id=${trade.id}::uuid AND offer_id=${trade.acceptedOfferId}::uuid AND direction='inbound' AND approved_at IS NOT NULL AND status IN ('label_created','in_transit','delivered')`;
   if(!job.length)skip('Shipping is not approved and created.');data.carrier=label!.carrier;data.tracking=label!.tracking;data.ctaUrl=`${origin}/api/trades/${trade.id}/files/${label!.fileId}`;
  }
  if(type==='trade_credit'){
   const credit=(await deps.db()`SELECT amount_cents FROM ssc_trade_credit WHERE id=${source.creditId}::uuid AND user_id=${userId} AND trade_id=${trade.id}::uuid AND status='posted' AND currency='usd'`)[0];
   if(!credit||trade.state!=='credit_issued'||trade.creditTransactionId!==source.creditId)skip('Credit not posted.');data.amountCents=Number(credit.amount_cents);data.balanceCents=await deps.balance(userId);data.ctaUrl=origin+'/shop';
  }
 }else if(type.startsWith('order_')){
  const stripe=deps.stripe(),session=await stripe.checkout.sessions.retrieve(source.sessionId);let order=cardOrderFromSession(session,userId);
  if(session.metadata?.kind==='bag-order-v2')order=bagOrderFromSession(session,(await stripe.checkout.sessions.listLineItems(session.id,{limit:100,expand:['data.price.product']})).data,userId);
  if(!order)skip('No verified paid order.');
  const charge=await orderCharge(stripe,session);if(!charge?.paid||charge.amount_refunded)skip('Order charge not paid or refunded.');
  const inventory=await deps.db()`SELECT c.id FROM ssc_checkouts c WHERE session_id=${session.id} AND user_id=${userId} AND status='paid' AND NOT EXISTS(SELECT 1 FROM unnest(c.slugs) AS required(slug) WHERE NOT EXISTS(SELECT 1 FROM ssc_inventory i WHERE i.slug=required.slug AND i.status='sold' AND i.sold_session=c.session_id))`;
  if(!inventory.length)skip('Paid inventory not committed.');
  data.reference=order!.id.slice(-12).toUpperCase();data.cards=order!.items.map(c=>({name:c.name,grade:c.grade,image:c.image,paidCents:c.cardCents}));data.totalCents=order!.totalCents;data.membershipCents=order!.membershipCents;
  // Card checkout has no credit-redemption path; zero reflects the actual charged checkout, not an estimated offset.
  data.creditUsedCents=0;const s=order!.shipping;data.shipping=s?[s.name,s.address?.line1,s.address?.line2,s.address?.city,s.address?.state,s.address?.postal_code].filter(Boolean).join(', '):undefined;data.ctaUrl=`${origin}/account/orders?session_id=${session.id}`;
  if(type==='order_shipped'){
   const shipping=(await deps.db()`SELECT provider_result,tracking FROM ssc_order_shipping WHERE session_id=${session.id} AND user_id=${userId} AND status IN ('in_transit','delivered')`)[0];
   if(!shipping||!shipping.tracking.some((e:{code:string})=>['I','D'].includes(e.code)))skip('Carrier handoff not confirmed.');
   data.carrier=shipping.provider_result.carrier;data.tracking=shipping.provider_result.trackingNumbers[0];data.ctaUrl=shipping.provider_result.trackingUrl||data.ctaUrl;
  }
 }else{
  const stripe=deps.stripe();let subscription;
  if(type==='membership_confirmed'){
   const invoice=await stripe.invoices.retrieve(source.invoiceId);const sub=invoice.parent?.subscription_details?.subscription;
   if(invoice.status!=='paid'||invoice.amount_paid<=0||invoice.billing_reason!=='subscription_create'||!sub)skip('Initial paid membership invoice not verified.');
   subscription=await stripe.subscriptions.retrieve(typeof sub==='string'?sub:sub.id);
   if(subscription.status!=='active')skip('Membership not active.');
  }else{subscription=await stripe.subscriptions.retrieve(source.subscriptionId);const invoices=await stripe.invoices.list({subscription:subscription.id,status:'paid',limit:100});if(!invoices.data.some(i=>i.amount_paid>0))skip('No paid membership to cancel.');}
  if(subscription.metadata.clerk_user_id!==userId||subscription.metadata.membership!=='founding-annual')skip('Membership ownership mismatch.');
  const period=membershipPeriod(subscription);if(type==='membership_cancelled'&&!subscription.cancel_at&&!subscription.cancel_at_period_end&&subscription.status!=='canceled')skip('Cancellation reversed.');
  const end=type==='membership_cancelled'&&subscription.status==='canceled'?subscription.ended_at:period.activeUntil;if(end&&end*1000>Date.now())data.endDate=date(end);if(type==='membership_confirmed'&&period.activeUntil)data.endDate=date(period.activeUntil);data.ctaUrl=origin+'/account/profile#membership';
  if(type==='membership_confirmed')data.ctaUrl=origin+'/account';
 }
 return {to:email!,data};
}
