import {getMember} from '../../../../../lib/member-session';
import {ownedBillingCustomer} from '../../../../../lib/membership-management';
import {siteOrigin} from '../../../../../lib/billing-config';
export async function POST(request:Request){if(request.headers.get('origin')!==new URL(request.url).origin)return new Response(null,{status:403});const member=await getMember();if(!member)return new Response(null,{status:401});try{const {stripe,customer}=await ownedBillingCustomer(member.id);const portal=await stripe.billingPortal.sessions.create({customer:customer.id,return_url:siteOrigin()+'/account/profile#membership'});return Response.json({url:portal.url});}catch{return Response.json({error:'Billing settings could not open. Please try again.'},{status:503});}}
