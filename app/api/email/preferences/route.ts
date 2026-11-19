import {getMember} from '../../../../lib/member-session';
import {emailPreference,setEmailPreference} from '../../../../lib/email/store';
export async function GET(){const member=await getMember();if(!member)return new Response(null,{status:401});return Response.json({grails:await emailPreference(member.id)},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return new Response(null,{status:403});const member=await getMember();if(!member)return new Response(null,{status:401});
 let body;try{body=await request.json() as {grails?:unknown};}catch{return new Response(null,{status:400});}if(typeof body?.grails!=='boolean')return new Response(null,{status:400});
 await setEmailPreference(member.id,body.grails);return Response.json({saved:true});
}
