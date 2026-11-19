import {NextResponse} from "next/server";
import {getStripe} from "../../../../lib/stripe";
import {queueOrderShipping} from "../../../../lib/shipping/orders";
import {reconcileCheckout} from "../../../../lib/inventory";
export const runtime="nodejs";
export async function POST(request:Request){
 const secret=process.env.STRIPE_WEBHOOK_SECRET,signature=request.headers.get("stripe-signature");
 if(!secret||!signature)return NextResponse.json({message:"Webhook not configured."},{status:400});
 const stripe=getStripe();let event;
 try{event=stripe.webhooks.constructEvent(await request.text(),signature,secret);}catch{return NextResponse.json({message:"Invalid webhook signature."},{status:400});}
 if(event.livemode)return NextResponse.json({message:"Only test events are accepted."},{status:400});
 try{
  if(["checkout.session.completed","checkout.session.async_payment_succeeded","checkout.session.expired"].includes(event.type)){
   const session=event.data.object as import("stripe").default.Checkout.Session;
   const verified=await stripe.checkout.sessions.retrieve(session.id);
   await reconcileCheckout(verified);
   if(process.env.SHIPPO_AUTOMATION_ENABLED==="true"){try{await queueOrderShipping(verified);}catch{/* Shipping cannot roll back a verified payment or inventory update; the shipping worker retries. */}}
  }
  return NextResponse.json({received:true});
 }catch(error){console.error("Inventory webhook reconciliation failed",error instanceof Error?error.message:"Unknown error");return NextResponse.json({message:"Retry inventory update."},{status:500});}
}
