import type Stripe from "stripe";
export async function paymentMethodPortal(stripe:Stripe,customerId:string,origin:string){
 const configurations=await stripe.billingPortal.configurations.list({active:true,limit:100});
 const config=configurations.data.find(c=>c.metadata?.site==="slabsupplyco" && c.features.payment_method_update.enabled);
 if(!config)throw new Error("Payment settings are unavailable.");
 const session=await stripe.billingPortal.sessions.create({customer:customerId,configuration:config.id,return_url:`${origin}/account/profile`,flow_data:{type:"payment_method_update",after_completion:{type:"redirect",redirect:{return_url:`${origin}/account/profile`}}}});
 const url=new URL(session.url);if(url.protocol!=="https:"||url.hostname!=="billing.stripe.com")throw new Error("Unexpected billing destination.");
 return url.toString();
}
export async function savedPaymentCards(stripe:Stripe,customerId:string,userId:string){
 const customer=await stripe.customers.retrieve(customerId);
 if(customer.deleted || customer.livemode || customer.metadata.clerk_user_id!==userId)throw new Error("Payment identity unavailable.");
 const methods=await stripe.paymentMethods.list({customer:customerId,type:"card",limit:10});
 return methods.data.filter(m=>m.card).map(m=>({brand:m.card!.brand,last4:m.card!.last4,month:m.card!.exp_month,year:m.card!.exp_year}));
}
