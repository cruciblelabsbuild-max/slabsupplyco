import {timingSafeEqual} from 'node:crypto';
import {processEmailQueue} from '../../../../lib/email/worker';
export const maxDuration=300;
export async function GET(request:Request){const secret=process.env.CRON_SECRET,expected=`Bearer ${secret||''}`,actual=request.headers.get('authorization')||'';if(!secret||Buffer.byteLength(expected)!==Buffer.byteLength(actual)||!timingSafeEqual(Buffer.from(expected),Buffer.from(actual)))return new Response(null,{status:401});try{return Response.json(await processEmailQueue(),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({message:'Email worker unavailable.'},{status:503});}}
