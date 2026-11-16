import { cache } from "react";
import { clerkClient } from "@clerk/nextjs/server";
import type Stripe from "stripe";
import {reconcileCheckout} from "./inventory";
import { getStripe } from "./stripe";
export type OrderCard={slug:string;name:string;grade:string;image:string;cardCents:number;retailCents:number};
export type CardOrder = {
  items:OrderCard[];
  id:string; created:number; name:string; grade:string; slug:string; image:string;
  cardCents:number; retailCents:number; membershipCents:number; totalCents:number;
  status:"paid"|"refunded"|"partially-refunded";
  shipping:Stripe.Checkout.Session.CollectedInformation.ShippingDetails|null;
};
export function cardOrderFromSession(session:Stripe.Checkout.Session,userId:string):CardOrder|null {
  const data=session.metadata;
  if(session.livemode || session.status!=="complete" || session.payment_status!=="paid" || session.currency!=="usd" || data?.kind!=="card-order-v1" || data.phase!=="test" || data.clerk_user_id!==userId || session.client_reference_id!==userId)return null;
  const cardCents=Number(data.card_cents),retailCents=Number(data.retail_cents),membershipCents=Number(data.membership_cents);
  if(![cardCents,retailCents,membershipCents].every(n=>Number.isSafeInteger(n)&&n>=0) || !cardCents || session.amount_subtotal!==cardCents+membershipCents || !data.card_name || !/^selection-[a-z0-9-]+$/.test(data.card_slug) || !/^\/cards\/selection\/[a-zA-Z0-9-]+\.webp$/.test(data.card_image))return null;
  return {items:[{slug:data.card_slug,name:data.card_name,grade:data.card_grade,image:data.card_image,cardCents,retailCents}],id:session.id,created:session.created,name:data.card_name,grade:data.card_grade,slug:data.card_slug,image:data.card_image,cardCents,retailCents,membershipCents,totalCents:session.amount_total??cardCents+membershipCents,status:"paid",shipping:session.collected_information?.shipping_details??null};
}
async function orderCharge(stripe:Stripe,session:Stripe.Checkout.Session) {
  let intent=session.payment_intent;
  if(!intent && session.invoice) {
    const payments=await stripe.invoicePayments.list({invoice:typeof session.invoice==="string"?session.invoice:session.invoice.id,status:"paid",limit:10});
    intent=payments.data.find(payment=>payment.payment.type==="payment_intent")?.payment.payment_intent??null;
  }
  if(!intent)return null;
  const payment=typeof intent==="string"?await stripe.paymentIntents.retrieve(intent,{expand:["latest_charge"]}):intent;
  return typeof payment.latest_charge==="object"?payment.latest_charge:null;
}
export const ordersForUser=cache(async(userId:string):Promise<CardOrder[]|null>=>{
  try {
    const user=await(await clerkClient()).users.getUser(userId);
    const customerId=user.privateMetadata.stripeTestCustomerId;
    if(typeof customerId!=="string")return [];
    const stripe=getStripe();
    const customer=await stripe.customers.retrieve(customerId);
    if(customer.deleted || customer.livemode || customer.metadata.clerk_user_id!==userId)throw new Error("Order identity unavailable.");
    const orders:CardOrder[]=[];
    for await(const session of stripe.checkout.sessions.list({customer:customerId,status:"complete",limit:100})){
      let order=cardOrderFromSession(session,userId);
      if(session.metadata?.kind==="bag-order-v2"&&session.metadata.clerk_user_id===userId){
       const lines=await stripe.checkout.sessions.listLineItems(session.id,{limit:100,expand:["data.price.product"]});
       order=bagOrderFromSession(session,lines.data,userId);
       if(order)await reconcileCheckout(session);
      }
      if(!order)continue;
      const charge=await orderCharge(stripe,session);
      if(charge?.refunded)order.status="refunded";
      else if(charge?.amount_refunded)order.status="partially-refunded";
      orders.push(order);
    }
    return orders;
  } catch {return null;}
});
export const orderSavings=(orders:CardOrder[]|null)=>orders===null?null:orders.reduce((total,order)=>total+(order.status==="paid"?Math.max(0,order.retailCents-order.cardCents):0),0);

export function bagOrderFromSession(session:Stripe.Checkout.Session,lines:Stripe.LineItem[],userId:string):CardOrder|null{
 const data=session.metadata;
 if(session.livemode||session.status!=="complete"||session.payment_status!=="paid"||session.currency!=="usd"||data?.kind!=="bag-order-v2"||data.phase!=="test"||data.clerk_user_id!==userId||session.client_reference_id!==userId)return null;
 const items:OrderCard[]=[];
 for(const line of lines){
  const product=line.price?.product;
  if(!product||typeof product==="string"||product.deleted||!product.metadata.card_slug)continue;
  const info=product.metadata,cardCents=line.amount_subtotal,retailCents=Number(info.retail_cents);
  if(line.quantity!==1||line.price?.recurring||!/^selection-[a-z0-9-]+$/.test(info.card_slug)||!/^\/cards\/selection\/[a-zA-Z0-9-]+\.webp$/.test(info.card_image)||!Number.isSafeInteger(retailCents)||retailCents<0||cardCents<=0)return null;
  items.push({slug:info.card_slug,name:product.name.replace(` · ${info.card_grade}`,""),grade:info.card_grade,image:info.card_image,cardCents,retailCents});
 }
 const cardCents=items.reduce((sum,item)=>sum+item.cardCents,0),retailCents=items.reduce((sum,item)=>sum+item.retailCents,0),membershipCents=Number(data.membership_cents);
 if(!items.length||items.length!==Number(data.card_count)||new Set(items.map(item=>item.slug)).size!==items.length||cardCents!==Number(data.card_cents)||retailCents!==Number(data.retail_cents)||!Number.isSafeInteger(membershipCents)||membershipCents<0||session.amount_subtotal!==cardCents+membershipCents)return null;
 return {items,id:session.id,created:session.created,name:items[0].name,slug:items[0].slug,grade:items[0].grade,image:items[0].image,cardCents,retailCents,membershipCents,totalCents:session.amount_total??session.amount_subtotal,status:"paid",shipping:session.collected_information?.shipping_details??null};
}
