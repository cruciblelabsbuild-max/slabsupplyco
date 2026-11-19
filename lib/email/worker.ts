import {emailDestination} from './links';
import {createHash} from 'node:crypto';
import {inventoryDb} from '../inventory-db';
import {ensureEmail} from './store';
import {collectEmailEvents} from './events';
import {buildEmailContent,SkipEmail} from './content';
import {definitions,emailOrigin,promotional,renderEmail,type EmailType} from './templates';
import {sendingAllowed,unsubscribeToken} from './security';
export type ResendMessage={from:string;to:string[];reply_to:string;subject:string;html:string;text:string;headers?:Record<string,string>};
export class EmailTransportError extends Error{constructor(public retryable:boolean,public status:number){super(`Resend request failed (${status}).`);}}
export async function sendResend(message:ResendMessage,id:string,apiKey=process.env.RESEND_API_KEY){
 if(!apiKey)throw Error('Resend is not configured.');
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`ssc-${createHash('sha256').update(id).digest('hex')}`},body:JSON.stringify(message),signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new EmailTransportError(response.status===429||response.status>=500,response.status);
 const data=await response.json() as {id?:unknown};if(typeof data.id!=='string')throw Error('Resend returned no message identifier.');return data.id as string;
}
export function resendMessage(type:EmailType,to:string,data:Parameters<typeof renderEmail>[1],userId:string):ResendMessage{
 const category=definitions[type].category,address=process.env[`EMAIL_${category.toUpperCase()}`]||`${category}@${process.env.EMAIL_DOMAIN||'slabsupply.co'}`;
 const unsubscribeUrl=promotional(type)?`${emailOrigin()}/api/email/unsubscribe?token=${encodeURIComponent(unsubscribeToken(userId))}`:undefined;
 const target=new URL(data.ctaUrl,emailOrigin());const protectedPath=emailDestination(target.pathname+target.search+target.hash);
 const linked=protectedPath?{...data,ctaUrl:`${emailOrigin()}/api/email/open?path=${encodeURIComponent(protectedPath)}`}:data;
 const content=renderEmail(type,linked,{unsubscribeUrl,mailingAddress:promotional(type)?process.env.EMAIL_BUSINESS_MAILING_ADDRESS:undefined});
 return {from:`${process.env.EMAIL_FROM_NAME||'Slab Supply Co.'} <${address}>`,to:[to],reply_to:address,...content,...(unsubscribeUrl?{headers:{'List-Unsubscribe':`<${unsubscribeUrl}>`,'List-Unsubscribe-Post':'List-Unsubscribe=One-Click'}}:{})};
}
export async function processEmailQueue(){
 await ensureEmail();try{await collectEmailEvents();}catch{/* Persisted notifications still drain when an upstream event source is temporarily unavailable. */}
 if(!sendingAllowed())return {enabled:false,sent:0};
 const db=inventoryDb();let sent=0;const deadline=Date.now()+240000;
 for(let i=0;i<20&&Date.now()<deadline;i++){
  const rows=await db`UPDATE ssc_email_outbox SET status='processing',lease_at=now(),attempts=attempts+1 WHERE id=(SELECT id FROM ssc_email_outbox WHERE ((status='pending' AND next_attempt_at<=now()) OR (status='processing' AND lease_at<now()-interval '10 minutes')) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`;
  const row=rows[0];if(!row)break;
  try{
   // Resend's idempotency window is 24h. Never risk a second delivery after an ambiguous, expired attempt.
   if(row.first_attempt_at&&Date.now()-new Date(row.first_attempt_at).getTime()>23*3600000){await db`UPDATE ssc_email_outbox SET status='review',last_error='Delivery reconciliation required; idempotency window closing.' WHERE id=${row.id}`;continue;}
   const built=await buildEmailContent(row.type as EmailType,row.user_id,row.source);
   if((await db`SELECT 1 FROM ssc_email_suppression WHERE address=${built.to.toLowerCase()}`).length)throw new SkipEmail('Recipient is suppressed.');
   let message=row.request as ResendMessage|null;
   if(!message){message=resendMessage(row.type,built.to,built.data,row.user_id);await db`UPDATE ssc_email_outbox SET request=${JSON.stringify(message)}::jsonb WHERE id=${row.id}`;}
   // A recipient change must never send an old frozen payload to a previous mailbox.
   if(message.to[0]!==built.to)throw new SkipEmail('Recipient changed during delivery.');
   if(promotional(row.type)&&message.html!==resendMessage(row.type,built.to,built.data,row.user_id).html)throw new SkipEmail('Drop inventory or prices changed during delivery.');
   await db`UPDATE ssc_email_outbox SET first_attempt_at=coalesce(first_attempt_at,now()) WHERE id=${row.id}`;
   const id=await sendResend(message,row.id);
   await db.transaction([db`UPDATE ssc_email_outbox SET status='sent',resend_id=${id},sent_at=now(),last_error=NULL WHERE id=${row.id}`,db`INSERT INTO ssc_email_attempts(notification_id,attempt,result) VALUES(${row.id},${row.attempts},'accepted')`]);sent++;
  }catch(error){
   const skipped=error instanceof SkipEmail,permanent=error instanceof EmailTransportError&&!error.retryable;
   const status=skipped?'skipped':permanent||row.attempts>=10?'review':'pending';
   const safeError=skipped?(error as Error).message:error instanceof EmailTransportError?error.message:'Temporary email preparation or delivery failure.';
   await db.transaction([db`UPDATE ssc_email_outbox SET status=${status},last_error=${safeError},next_attempt_at=now()+make_interval(secs=>${Math.min(3600,120*2**Math.min(row.attempts,5))}) WHERE id=${row.id}`,db`INSERT INTO ssc_email_attempts(notification_id,attempt,result) VALUES(${row.id},${row.attempts},${status})`]);
  }
 }
 return {enabled:true,sent};
}
