import {randomUUID,createHash} from "node:crypto";
import type Stripe from "stripe";
import {ensureInventory,inventoryDb,type InventoryCheckout} from "./inventory-db";
import {getStripe} from "./stripe";
import {bagCheckoutParams,checkoutUrl,type BagCheckoutInput} from "./bag-checkout";
import {validAnnualPrice} from "./billing-config";
import {blocksNewMembership} from "./member-billing";
export type StockStatus="available"|"reserved"|"sold";
export type StockRecord={slug:string;status:StockStatus;inAnotherBag:boolean};
export async function reservationById(id:string){
 await ensureInventory();const rows=await inventoryDb()`SELECT * FROM ssc_checkouts WHERE id=${id}::uuid`;
 return rows[0] as InventoryCheckout|undefined;
}
export async function reconcileCheckout(session:Stripe.Checkout.Session){
 const id=session.metadata?.reservation_id;
 if(!id||!/^[-0-9a-f]{36}$/.test(id)||session.livemode)return;
 const checkout=await reservationById(id);if(!checkout)return;
 if(checkout.user_id!==session.metadata?.clerk_user_id||session.client_reference_id!==checkout.user_id||session.customer!==checkout.payload.customer)throw new Error("Checkout identity mismatch.");
 if(checkout.session_id&&checkout.session_id!==session.id)throw new Error("Checkout session mismatch.");
 const db=inventoryDb();
 if(session.status==="complete"&&session.payment_status==="paid"){
  const expected=Number(checkout.payload.metadata?.card_cents)+Number(checkout.payload.metadata?.membership_cents);
  if(session.amount_subtotal!==expected||session.currency!=="usd")throw new Error("Checkout amount mismatch.");
  await db`SELECT ssc_settle(${id}::uuid,${session.id},true)`;
 }else if(session.status==="expired")await db`SELECT ssc_settle(${id}::uuid,${session.id},false)`;
 else await db`UPDATE ssc_checkouts SET session_id=${session.id},status='open' WHERE id=${id}::uuid AND status IN ('creating','open')`;
}
async function findSession(stripe:Stripe,checkout:InventoryCheckout){
 if(checkout.session_id)return stripe.checkout.sessions.retrieve(checkout.session_id);
 for await(const session of stripe.checkout.sessions.list({customer:String(checkout.payload.customer),limit:100})){
  if(session.metadata?.reservation_id===checkout.id)return session;
 }
 return null;
}
export async function syncPendingInventory(){
 await ensureInventory();const db=inventoryDb();
 const pending=await db`SELECT * FROM ssc_checkouts WHERE status IN ('creating','open') ORDER BY created_at LIMIT 30` as InventoryCheckout[];
 if(!pending.length)return;
 const stripe=getStripe();
 await Promise.all(pending.map(async checkout=>{
  const session=await findSession(stripe,checkout);
  if(session){await reconcileCheckout(session);return;}
  // A lost create response never frees stock while its fixed Stripe expiry can
  // still be payable. Reuse the original request and idempotency key to recover.
  if(Number(checkout.expires_at)>Date.now()/1000+30*60){
   const recovered=await stripe.checkout.sessions.create(checkout.payload,{idempotencyKey:`bag-${checkout.id}`});
   await reconcileCheckout(recovered);
  }else if(Date.now()/1000>Number(checkout.expires_at)+300){
   // No session exists for this reservation, and its immutable expires_at is
   // already in the past. No delayed create can produce a payable checkout.
   await db`SELECT ssc_settle(${checkout.id}::uuid,${`uncreated_${checkout.id}`},false)`;
  }
 }));
}
export async function inventorySnapshot(bagId?:string):Promise<StockRecord[]>{
 await syncPendingInventory();
 const rows=await inventoryDb()`SELECT i.slug,i.status,EXISTS(SELECT 1 FROM ssc_bag_presence p WHERE p.slug=i.slug AND p.expires_at>now() AND p.bag_id<>${bagId||"00000000-0000-0000-0000-000000000000"}::uuid) AS "inAnotherBag" FROM ssc_inventory i`;
 return rows as StockRecord[];
}
export async function cancelReservation(id:string,userId:string){
 const checkout=await reservationById(id);
 if(!checkout||checkout.user_id!==userId)throw new Error("Checkout not found.");
 if(checkout.status==="released"||checkout.status==="paid")return checkout.status;
 const stripe=getStripe();let session=await findSession(stripe,checkout);
 if(!session)throw new Error("Your checkout is still being prepared. Please try again shortly.");
 if(session.status==="open"){
  try{session=await stripe.checkout.sessions.expire(session.id);}catch{session=await stripe.checkout.sessions.retrieve(session.id);}
 }
 await reconcileCheckout(session);
 return session.status==="complete"&&session.payment_status==="paid"?"paid":session.status==="expired"?"released":"pending";
}
export async function managedCheckout(input:Omit<BagCheckoutInput,"reservationId"|"expiresAt">){
 await syncPendingInventory();const db=inventoryDb(),stripe=getStripe();
 if(input.membership){
  const price=await stripe.prices.retrieve(input.priceId);
  if(price.livemode||!validAnnualPrice(price))throw new Error("Annual membership price is unavailable.");
  const subscriptions=await stripe.subscriptions.list({customer:input.customerId,status:"all",limit:100});
  if(subscriptions.data.some(s=>blocksNewMembership(s.status)))throw new Error("Your membership needs attention. Manage billing from your profile.");
  // Retire legacy checkout links so they cannot create another membership.
  for await(const session of stripe.checkout.sessions.list({customer:input.customerId,status:"open",limit:100})){
   if(session.metadata?.membership==="founding-annual"&&!session.metadata.reservation_id)await stripe.checkout.sessions.expire(session.id);
  }
 }
 const hash=createHash("sha256").update(JSON.stringify([input.slugs.slice().sort(),input.membership,input.priceId,input.origin])).digest("hex");
 const prior=await db`SELECT * FROM ssc_checkouts WHERE user_id=${input.userId} AND status IN ('creating','open')` as InventoryCheckout[];
 if(prior[0]&&prior[0].cart_hash!==hash){
  const state=await cancelReservation(prior[0].id,input.userId);
  if(state!=="released")throw new Error("Your previous checkout has not been canceled. Please check Orders before trying again.");
 }
 const id=randomUUID(),expiresAt=Math.floor(Date.now()/1000)+35*60;
 const payload=bagCheckoutParams({...input,reservationId:id,expiresAt});
 let checkout:InventoryCheckout;
 try{
  const rows=await db`SELECT ssc_reserve(${id}::uuid,${input.userId},${hash},${input.slugs.slice().sort()}::text[],${JSON.stringify(payload)}::jsonb,${expiresAt}) AS checkout`;
  checkout=rows[0].checkout as InventoryCheckout;
 }catch(error){
  if(error instanceof Error&&error.message.includes("CARD_UNAVAILABLE"))throw new Error("One of these cards is already in checkout or has sold. Please review your bag.");
  if(error instanceof Error&&error.message.includes("CHECKOUT_ALREADY_OPEN"))throw new Error("Another checkout is being prepared for your account. Please try again shortly.");throw error;
 }
 const session=checkout.session_id?await stripe.checkout.sessions.retrieve(checkout.session_id):await stripe.checkout.sessions.create(checkout.payload,{idempotencyKey:`bag-${checkout.id}`});
 await reconcileCheckout(session);
 if(session.status!=="open")throw new Error("This checkout has ended. Please refresh your bag.");
 return checkoutUrl(session);
}
