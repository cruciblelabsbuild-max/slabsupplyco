import type Stripe from 'stripe';
import {profileAddress} from './shipping/config';
export function profileCheckoutShipping(profile:unknown):Stripe.CustomerUpdateParams.Shipping|null{
 const a=profileAddress(profile);if(!a||a.country!=='US')return null;
 return {name:a.name,address:{line1:a.line1,line2:a.line2||'',city:a.city,state:a.region,postal_code:a.postalCode,country:'US'}};
}
export function matchesProfileShipping(existing:Stripe.Customer.Shipping|null,shipping:Stripe.CustomerUpdateParams.Shipping){
 return existing?.name===shipping.name&&(['line1','line2','city','state','postal_code','country'] as const).every(key=>(existing?.address?.[key]||'')===(shipping.address?.[key]||''));
}
