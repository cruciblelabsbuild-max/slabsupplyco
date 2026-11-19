import {ensureInventory,inventoryDb} from "../inventory-db";
import {ensureTrades} from "../trades/store";
import {shippoSchema} from "../../db/shipping/shippo-schema";
let initialized:Promise<void>|undefined;
export function ensureShipping(){return initialized ||= (async()=>{await ensureInventory();await ensureTrades();await inventoryDb().transaction(shippoSchema.split("-- statement").map(s=>inventoryDb().query(s)));})().catch(e=>{initialized=undefined;throw e;});}
export async function shippingEvent(jobId:string,kind:string,key:string,data:Record<string,unknown>){await ensureShipping();await inventoryDb()`INSERT INTO ssc_shipping_events(job_id,kind,event_key,data) VALUES(${jobId}::uuid,${kind},${key},${JSON.stringify(data)}::jsonb) ON CONFLICT(event_key) DO NOTHING`;}
