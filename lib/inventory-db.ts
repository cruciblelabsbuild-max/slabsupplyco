import {neon} from "@neondatabase/serverless";
import {inventorySchema} from "../db/inventory/schema";
import {memberSelection} from "./member-selection";
export function inventoryDb(){
 const url=process.env.INVENTORY_DATABASE_URL||process.env.INVENTORY_POSTGRES_URL||process.env.INVENTORY_URL;
 if(!url)throw new Error("Inventory database is unavailable.");
 return neon(url);
}
let initialized:Promise<void>|undefined;
export function ensureInventory(){
 return initialized ||= (async()=>{
  const db=inventoryDb();
  // The HTTP driver accepts one statement per query; transaction batches handle DDL.
  await db.transaction(inventorySchema.split("-- statement").map(statement=>db.query(statement)));
  await db`INSERT INTO ssc_inventory(slug) SELECT unnest(${memberSelection.map(c=>c.slug)}::text[]) ON CONFLICT(slug) DO NOTHING`;
 })().catch(error=>{initialized=undefined;throw error;});
}
export type InventoryCheckout={id:string;user_id:string;cart_hash:string;slugs:string[];payload:import("stripe").default.Checkout.SessionCreateParams;status:"creating"|"open"|"paid"|"released";session_id:string|null;expires_at:number};
