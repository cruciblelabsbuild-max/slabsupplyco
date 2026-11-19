import {after} from 'next/server';
import {getMember} from '../../../../../lib/member-session';
import {cancelOwnedMembership} from '../../../../../lib/membership-management';
import {membershipPeriod} from '../../../../../lib/membership-period';
import {enqueueEmail} from '../../../../../lib/email/store';
import {dispatchEmails} from '../../../../../lib/email/dispatch';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return new Response(null,{status:403});const member=await getMember();if(!member)return new Response(null,{status:401});
 try{const body=await request.json() as {activeUntil?:number;requestId?:string};if(!Number.isSafeInteger(body.activeUntil)||typeof body.requestId!=="string"||!/^[a-f0-9-]{36}$/.test(body.requestId))return Response.json({error:'Refresh your membership details.'},{status:400});const sub=await cancelOwnedMembership(member.id,body.activeUntil!,body.requestId!);const period=membershipPeriod(sub);
 after(async()=>{try{await enqueueEmail(`cancellation:${sub.id}:${sub.canceled_at||sub.cancel_at||0}`,'membership_cancelled',member.id,{subscriptionId:sub.id});}catch{/* Stripe's durable event scanner retries. */}await dispatchEmails();});
 return Response.json({canceled:true,activeUntil:period.activeUntil},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return Response.json({error:error instanceof Error&&/dates changed|active membership/.test(error.message)?error.message:'Cancellation could not be completed. Please try again.'},{status:409});}
}
