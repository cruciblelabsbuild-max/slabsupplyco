import {getMember} from "../../../../lib/member-session";
import {membershipForUser} from "../../../../lib/member-subscription";
import {saveGrailInterest} from "../../../../lib/grail-data";
export const runtime="nodejs";
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({message:"Use Slab Supply Co. to save your interest."},{status:403});
 const member=await getMember();if(!member)return Response.json({message:"Sign in to save your interest."},{status:401});
 const membership=await membershipForUser(member.id);
 if(membership.state!=="active-test")return Response.json({message:membership.state==="unavailable"?"Membership could not be checked. Please try again.":"An active membership is required."},{status:membership.state==="unavailable"?503:403});
 const text=await request.text();if(text.length>3000)return Response.json({message:"Please shorten your suggestion."},{status:413});
 let body:Record<string,unknown>;
 try{body=JSON.parse(text);if(!body||typeof body!=="object"||Array.isArray(body))throw Error();}catch{return Response.json({message:"Please check your interest details."},{status:400});}
 try{return Response.json({interest:await saveGrailInterest(member.id,body)},{headers:{"Cache-Control":"no-store"}});}
 catch(error){const message=error instanceof Error?error.message:"";const expected=/month has changed|candidate has changed|Choose whether|maximum price|card, set|30 suggestions/.test(message);return Response.json({message:expected?message:"Your interest could not be saved. Please try again."},{status:expected?400:503});}
}
