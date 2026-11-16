import type Stripe from "stripe";
import {annualMembership} from "./membership-plan";
import {bagTotals,checkoutSlugs} from "./bag";
export type BagCheckoutInput={slugs:string[];membership:boolean;priceId:string;origin:string;userId:string;customerId:string;reservationId:string;expiresAt:number};
export function bagCheckoutParams(input:BagCheckoutInput):Stripe.Checkout.SessionCreateParams{
 const slugs=input.slugs.length?checkoutSlugs(input.slugs):[];
 if(!slugs.length&&!input.membership)throw new Error("Your bag is empty.");
 const totals=bagTotals(slugs);
 const metadata={kind:slugs.length?"bag-order-v2":"membership-v2",phase:"test",clerk_user_id:input.userId,reservation_id:input.reservationId,card_count:String(slugs.length),retail_cents:String(totals.retailCents),card_cents:String(totals.memberCents),membership_cents:String(input.membership?annualMembership.amountCents:0),...(input.membership?{membership:"founding-annual",membership_price:input.priceId}:{})};
 return {
  mode:input.membership?"subscription":"payment",customer:input.customerId,client_reference_id:input.userId,
  expires_at:input.expiresAt,
  line_items:[...(input.membership?[{price:input.priceId,quantity:1}]:[]),...totals.cards.map(card=>({price_data:{currency:"usd",unit_amount:Math.round(card.member*100),product_data:{name:`${card.name} · ${card.grade}`,images:[`${input.origin}${card.image}`],metadata:{card_slug:card.slug,card_grade:card.grade,card_image:card.image,retail_cents:String(Math.round(card.retail*100))}}},quantity:1}))],
  ...(input.membership?{subscription_data:{metadata:{membership:"founding-annual",phase:"test",clerk_user_id:input.userId}}}:{payment_intent_data:{setup_future_usage:"off_session",metadata}}),
  metadata,
  success_url:slugs.length?`${input.origin}/account/orders?session_id={CHECKOUT_SESSION_ID}`:`${input.origin}/membership/welcome?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url:`${input.origin}/checkout?canceled=${input.reservationId}`,
  allowed_payment_method_types:["card","link"],billing_address_collection:"required",
  ...(slugs.length?{shipping_address_collection:{allowed_countries:["US","CA","GB","AU"] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[]}}:{}),
  customer_update:{address:"auto",name:"auto",...(slugs.length?{shipping:"auto" as const}:{})},
  saved_payment_method_options:{payment_method_save:"enabled"},
  custom_text:{submit:{message:`Test checkout. No real payment or shipment.${input.membership?` Membership renews at ${annualMembership.display} USD/year until canceled. Cards are one-time purchases.`:""}`}},
 };
}
export function checkoutUrl(session:Pick<Stripe.Checkout.Session,"url"|"livemode">){
 if(session.livemode||!session.url)throw new Error("Test checkout unavailable.");
 const url=new URL(session.url);if(url.protocol!=="https:"||url.hostname!=="checkout.stripe.com")throw new Error("Unexpected checkout destination.");return url.toString();
}
