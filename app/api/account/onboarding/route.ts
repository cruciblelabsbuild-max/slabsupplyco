import {getMember} from '../../../../lib/member-session';
import {ensureActivation} from '../../../../lib/membership-activation';
import {inventoryDb} from '../../../../lib/inventory-db';
export async function GET(){const member=await getMember();if(!member)return new Response(null,{status:401});await ensureActivation();return Response.json({dismissed:(await inventoryDb()`SELECT 1 FROM ssc_member_onboarding WHERE user_id=${member.id}`).length>0},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:Request){if(request.headers.get('origin')!==new URL(request.url).origin)return new Response(null,{status:403});const member=await getMember();if(!member)return new Response(null,{status:401});await ensureActivation();await inventoryDb()`INSERT INTO ssc_member_onboarding(user_id) VALUES(${member.id}) ON CONFLICT DO NOTHING`;return Response.json({saved:true});}
