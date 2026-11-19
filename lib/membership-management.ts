import {clerkClient} from '@clerk/nextjs/server';
import {getStripe} from './stripe';
import {isOwnedTestMembership} from './member-subscription';
import {membershipPeriod} from './membership-period';
export async function ownedBillingCustomer(userId:string){const user=await(await clerkClient()).users.getUser(userId);const id=user.privateMetadata.stripeTestCustomerId;if(typeof id!=='string')throw Error('No membership billing record was found.');const stripe=getStripe(),customer=await stripe.customers.retrieve(id);if(customer.deleted||customer.livemode||customer.metadata.clerk_user_id!==userId)throw Error('Membership billing could not be verified.');return {stripe,customer};}
export async function cancelOwnedMembership(userId:string,expectedEnd:number,requestId:string){
 const {stripe,customer}=await ownedBillingCustomer(userId);const subscriptions=await stripe.subscriptions.list({customer:customer.id,status:'all',limit:100});const owned=subscriptions.data.filter(s=>isOwnedTestMembership(s,userId));
 if(owned.length!==1)throw Error('Your active membership could not be verified.');const sub=owned[0],period=membershipPeriod(sub);if(!period.activeUntil||period.activeUntil!==expectedEnd)throw Error('Your membership dates changed. Refresh before confirming.');
 if(sub.cancel_at_period_end||sub.cancel_at)return sub;
 return stripe.subscriptions.update(sub.id,{cancel_at_period_end:true},{idempotencyKey:`ssc-cancel:${sub.id}:${requestId}`});
}
