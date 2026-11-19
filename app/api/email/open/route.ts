import {getMember} from '../../../../lib/member-session';
import {emailDestination} from '../../../../lib/email/links';
import {emailOrigin} from '../../../../lib/email/templates';
export async function GET(request:Request){const path=emailDestination(new URL(request.url).searchParams.get('path'));if(!path)return new Response('Invalid member link.',{status:400});const member=await getMember();return Response.redirect(emailOrigin()+(member?path:'/sign-in?emailTo='+encodeURIComponent(path)),303);}
