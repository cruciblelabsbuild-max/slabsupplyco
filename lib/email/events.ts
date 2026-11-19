import type Stripe from 'stripe';
import {createHash} from 'node:crypto';
import {inventoryDb} from '../inventory-db';
import {getStripe} from '../stripe';
import {ensureShipping} from '../shipping/store';
import {ensureGrails} from '../grail-data';
import {enqueueEmail,ensureEmail} from './store';
import type {EmailType} from './templates';
export function stripeEmailEvent(event:Stripe.Event):{id:string;type:EmailType;userId:string;source:Record<string,unknown>}|null{
 const object=event.data.object;
 if(event.type==='invoice.paid'){
  const invoice=object as Stripe.Invoice,sub=invoice.parent?.subscription_details;
  const userId=sub?.metadata?.clerk_user_id;
  if(invoice.status==='paid'&&invoice.amount_paid>0&&invoice.billing_reason==='subscription_create'&&sub?.subscription&&userId&&sub.metadata?.membership==='founding-annual')return {id:`membership:${typeof sub.subscription==='string'?sub.subscription:sub.subscription.id}`,type:'membership_confirmed',userId,source:{invoiceId:invoice.id}};
 }
 if(event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'){
  const sub=object as Stripe.Subscription,userId=sub.metadata.clerk_user_id;
  if(userId&&sub.metadata.membership==='founding-annual'&&(sub.cancel_at_period_end||sub.cancel_at||sub.status==='canceled'))return {id:`cancellation:${sub.id}:${sub.canceled_at||sub.cancel_at||0}`,type:'membership_cancelled',userId,source:{subscriptionId:sub.id}};
 }
 return null;
}
export async function captureStripeEmail(event:Stripe.Event){const item=stripeEmailEvent(event);if(!item)return;await ensureEmail();const start=(await inventoryDb()`SELECT value FROM ssc_email_config WHERE key='started_at'`)[0].value;if(event.created*1000<Date.parse(start)-1000)return;await enqueueEmail(item.id,item.type,item.userId,item.source);}
/** Read committed source records, never frontend activity. Repeated scans are harmless. */
export async function collectEmailEvents(){
 await ensureEmail();await ensureShipping();await ensureGrails();const db=inventoryDb();
 const start=(await db`SELECT value FROM ssc_email_config WHERE key='started_at'`)[0].value;
 await db`INSERT INTO ssc_email_outbox(id,type,user_id,source)
 SELECT 'trade-submit:'||e.id,'trade_submitted',t.user_id,jsonb_build_object('tradeId',t.id) FROM ssc_trade_events e JOIN ssc_trades_v3 t ON t.id=e.trade_id WHERE e.action='submit' AND e.created_at>=${start}::timestamptz ON CONFLICT DO NOTHING`;
 await db`INSERT INTO ssc_email_outbox(id,type,user_id,source)
 SELECT 'trade-offer:'||o.id,'trade_offer',t.user_id,jsonb_build_object('tradeId',t.id,'offerId',o.id) FROM ssc_trade_offers o JOIN ssc_trades_v3 t ON t.id=o.trade_id JOIN ssc_trade_events e ON e.trade_id=t.id AND e.action='offer' AND e.data->>'id'=o.id::text WHERE e.created_at>=${start}::timestamptz ON CONFLICT DO NOTHING`;
 await db`INSERT INTO ssc_email_outbox(id,type,user_id,source)
 SELECT 'trade-label:'||l.id,'trade_label',t.user_id,jsonb_build_object('tradeId',t.id,'labelId',l.id) FROM ssc_trade_labels l JOIN ssc_trades_v3 t ON t.id=l.trade_id WHERE l.direction='inbound' AND l.data->>'provider'='shippo' AND (l.data->>'createdAt')::timestamptz>=${start}::timestamptz ON CONFLICT DO NOTHING`;
 await db`INSERT INTO ssc_email_outbox(id,type,user_id,source)
 SELECT 'trade-credit:'||c.id,'trade_credit',c.user_id,jsonb_build_object('tradeId',c.trade_id,'creditId',c.id) FROM ssc_trade_credit c WHERE c.status='posted' AND c.created_at>=${start}::timestamptz ON CONFLICT DO NOTHING`;
 await db`INSERT INTO ssc_email_outbox(id,type,user_id,source)
 SELECT 'order:'||c.session_id,'order_confirmed',c.user_id,jsonb_build_object('sessionId',c.session_id) FROM ssc_checkouts c WHERE c.status='paid' AND c.session_id IS NOT NULL AND c.created_at>=${start}::timestamptz ON CONFLICT DO NOTHING`;
 await db`INSERT INTO ssc_email_outbox(id,type,user_id,source)
 SELECT 'order-shipped:'||s.id,'order_shipped',s.user_id,jsonb_build_object('sessionId',s.session_id) FROM ssc_order_shipping s JOIN ssc_checkouts c ON c.id=s.checkout_id WHERE s.status IN ('in_transit','delivered') AND c.status='paid' AND s.updated_at>=${start}::timestamptz ON CONFLICT DO NOTHING`;
 // The Stripe event log recovers notifications even if immediate webhook enqueueing failed.
 const stripe=getStripe();const cursor=await db`SELECT value FROM ssc_email_config WHERE key='stripe_cursor'`;const since=cursor[0]?.value||start;
 const scanStarted=new Date().toISOString();
 for await(const event of stripe.events.list({created:{gte:Math.max(Math.floor(Date.parse(start)/1000),Math.floor(Date.parse(since)/1000)-600)},limit:100,types:['invoice.paid','customer.subscription.updated','customer.subscription.deleted']}))await captureStripeEmail(event);
 await db`INSERT INTO ssc_email_config(key,value) VALUES('stripe_cursor',${scanStarted}) ON CONFLICT(key) DO UPDATE SET value=excluded.value`;
 const drops=await db`SELECT month,starts_at::text,ends_at::text FROM ssc_grail_drops WHERE starts_at<=now()+interval '7 days' AND (ends_at IS NULL OR ends_at>now()) AND starts_at>=now()-interval '1 day'`;
 for(const drop of drops){const days=(Date.parse(drop.starts_at)-Date.now())/86400000;const type:EmailType|undefined=days>=5&&days<=7?'grail_upcoming':days<=0?'grail_live':undefined;if(!type)continue;
  const recipients=await db`SELECT user_id FROM ssc_email_preferences WHERE grails`;
  for(const recipient of recipients)await enqueueEmail(`grail:${drop.month}:${createHash('sha256').update(drop.starts_at).digest('hex').slice(0,12)}:${type}:${recipient.user_id}`,type,recipient.user_id,{month:drop.month,startsAt:new Date(drop.starts_at).toISOString()});
 }
}
