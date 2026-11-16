import {NextResponse} from "next/server";
import {checkoutOrigin} from "../../../../lib/billing-config";
import {getMember} from "../../../../lib/member-session";
import {cancelReservation} from "../../../../lib/inventory";
export async function POST(request:Request){
 if(!checkoutOrigin(request.headers.get("origin")))return NextResponse.json({message:"Use Slab Supply Co. to cancel checkout."},{status:403});
 try{
  const member=await getMember();if(!member)return NextResponse.json({message:"Sign in to continue."},{status:401});
  const body=await request.json() as {id?:string};if(!/^[a-f0-9-]{36}$/.test(body.id||""))return NextResponse.json({message:"Checkout not found."},{status:404});
  return NextResponse.json({status:await cancelReservation(body.id!,member.id)});
 }catch(error){return NextResponse.json({message:error instanceof Error?error.message:"Checkout could not be canceled."},{status:409});}
}
