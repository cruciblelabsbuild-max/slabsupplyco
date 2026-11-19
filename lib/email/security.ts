import {createHmac,timingSafeEqual} from 'node:crypto';
function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
function tokenSecret(){const secret=process.env.EMAIL_UNSUBSCRIBE_SECRET;if(!secret||secret.length<32)throw Error('Email preference signing is not configured.');return secret;}
export function unsubscribeToken(userId:string){const encoded=Buffer.from(userId).toString('base64url');return `${encoded}.${createHmac('sha256',tokenSecret()).update('grails:'+encoded).digest('base64url')}`;}
export function tokenOwner(token:string){const [id,signature,...rest]=token.split('.');if(!id||!signature||rest.length||!equal(unsubscribeToken(Buffer.from(id,'base64url').toString()),token))throw Error('Invalid preference link.');return Buffer.from(id,'base64url').toString();}
export function verifyResendWebhook(body:string,headers:Headers,secret:string,now=Date.now()){
 const id=headers.get('svix-id'),timestamp=headers.get('svix-timestamp'),signatures=headers.get('svix-signature');
 if(!id||!timestamp||!signatures||!/^\d+$/.test(timestamp)||Math.abs(now/1000-Number(timestamp))>300)throw Error('Invalid webhook.');
 const expected=createHmac('sha256',Buffer.from(secret.replace(/^whsec_/,''),'base64')).update(`${id}.${timestamp}.${body}`).digest('base64');
 if(!signatures.split(' ').some(s=>s.startsWith('v1,')&&equal(s.slice(3),expected)))throw Error('Invalid webhook.');
 return {id,event:JSON.parse(body) as {type:string;created_at:string;data:{email_id:string;to?:string[]}}};
}
export function sendingAllowed(env:Record<string,string|undefined>=process.env){return env.EMAIL_SENDING_ENABLED==='true'&&env.VERCEL_ENV==='production'&&!!env.RESEND_API_KEY;}
