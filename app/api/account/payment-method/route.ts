import { getMember } from "../../../../lib/member-session";
import { checkoutOrigin } from "../../../../lib/billing-config";
import { billingCustomer } from "../../../../lib/member-billing";
import { getStripe } from "../../../../lib/stripe";
import { paymentMethodPortal } from "../../../../lib/member-payment";
export async function POST(request:Request){
 const origin=checkoutOrigin(request.headers.get("origin"));
 if(!origin)return Response.json({error:"Invalid origin."},{status:403});
 const member=await getMember();if(!member)return Response.json({error:"Sign in required."},{status:401});
 if(!member.email)return Response.json({error:"Verify your email before adding a payment card."},{status:403});
 try{const stripe=getStripe();const customer=await billingCustomer(stripe,{id:member.id,email:member.email});const url=await paymentMethodPortal(stripe,customer,origin);return Response.json({url},{headers:{"Cache-Control":"no-store"}});}
 catch{return Response.json({error:"Payment settings could not open. Please try again."},{status:503});}
}
