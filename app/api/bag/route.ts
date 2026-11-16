import {randomUUID} from "node:crypto";
import {NextResponse,type NextRequest} from "next/server";
import {checkoutOrigin} from "../../../lib/billing-config";
import {normalizeBag} from "../../../lib/bag";
import {ensureInventory,inventoryDb} from "../../../lib/inventory-db";
export async function POST(request:NextRequest){
 if(!checkoutOrigin(request.headers.get("origin")))return NextResponse.json({message:"Use Slab Supply Co. to update your bag."},{status:403});
 if(Number(request.headers.get("content-length")||0)>4000)return NextResponse.json({message:"Bag is too large."},{status:413});
 try{
  const body=await request.json() as {slugs?:unknown};
  const slugs=normalizeBag(body.slugs);
  const saved=request.cookies.get("ssc_bag_id")?.value;
  const id=/^[a-f0-9-]{36}$/.test(saved||"")?saved!:randomUUID();
  await ensureInventory();const db=inventoryDb();
  await db.transaction([
   db`DELETE FROM ssc_bag_presence WHERE bag_id=${id}::uuid OR expires_at<now()`,
   db`INSERT INTO ssc_bag_presence(bag_id,slug,expires_at) SELECT ${id}::uuid,i.slug,now()+interval '2 minutes' FROM ssc_inventory i WHERE i.slug=ANY(${slugs}::text[]) AND i.status='available' ON CONFLICT(bag_id,slug) DO UPDATE SET expires_at=excluded.expires_at`,
  ]);
  const response=NextResponse.json({ok:true});response.cookies.set("ssc_bag_id",id,{httpOnly:true,secure:request.nextUrl.protocol==="https:",sameSite:"lax",maxAge:60*60*24*30,path:"/"});return response;
 }catch{return NextResponse.json({message:"Your bag is saved on this device. Availability could not be updated."},{status:503});}
}
