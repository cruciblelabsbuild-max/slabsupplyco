import {NextResponse,type NextRequest} from "next/server";
import {inventorySnapshot} from "../../../lib/inventory";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 try{const id=request.cookies.get("ssc_bag_id")?.value;return NextResponse.json({stock:await inventorySnapshot(/^[a-f0-9-]{36}$/.test(id||"")?id:undefined)},{headers:{"Cache-Control":"no-store"}});}
 catch{return NextResponse.json({message:"Card availability could not be checked."},{status:503,headers:{"Cache-Control":"no-store"}});}
}
