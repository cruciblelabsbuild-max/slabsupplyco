import {verifyResendWebhook} from '../../../../lib/email/security';
import {ensureEmail} from '../../../../lib/email/store';
import {inventoryDb} from '../../../../lib/inventory-db';
export const runtime='nodejs';
export async function POST(request:Request){
 const secret=process.env.RESEND_WEBHOOK_SECRET;if(!secret)return Response.json({message:'Not configured.'},{status:503});
 if(Number(request.headers.get('content-length')||0)>100000)return new Response(null,{status:413});
 let verified;try{verified=verifyResendWebhook(await request.text(),request.headers,secret);}catch{return Response.json({message:'Invalid signature.'},{status:400});}
 const {id,event}=verified;if(!event.data?.email_id||!event.type.startsWith('email.')||!Number.isFinite(Date.parse(event.created_at)))return new Response(null,{status:400});
 try{await ensureEmail();const db=inventoryDb();await db`INSERT INTO ssc_email_delivery(event_id,email_id,event_type,occurred_at) VALUES(${id},${event.data.email_id},${event.type},${event.created_at}::timestamptz) ON CONFLICT DO NOTHING`;
 if(['email.failed','email.bounced','email.complained','email.suppressed'].includes(event.type))await db`UPDATE ssc_email_outbox SET last_error=${event.type} WHERE resend_id=${event.data.email_id}`;
 if(['email.bounced','email.complained','email.suppressed'].includes(event.type))for(const address of event.data.to||[])await db`INSERT INTO ssc_email_suppression(address,reason) VALUES(${address.toLowerCase()},${event.type}) ON CONFLICT(address) DO NOTHING`;
 return Response.json({received:true});}catch{return new Response(null,{status:503});}
}
