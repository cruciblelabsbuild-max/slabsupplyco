import {randomUUID} from "node:crypto";
import {inventoryDb} from '../inventory-db';
import {ensureShipping,shippingEvent} from './store';
import {completeAddress,profileAddressDetails} from './config';
import type {Trade} from '../trades/model';
import type {ShippingAddress} from './types';
/** Fill the trade summary from the profile before a shipping job has captured its address. */
export function withProfileReturnAddress(trade:Trade,profile:unknown):Trade{
 if(!trade.shipping||trade.shipping.address||trade.labels.length)return trade;
 return {...trade,shipping:{...trade.shipping,address:profileAddressDetails(profile)}};
}
/** Purchased labels keep their original address. Old in-flight preparations lose their claim. */
export async function refreshMemberTradeAddresses(userId:string,address:ShippingAddress|null){
 await ensureShipping();const db=inventoryDb(),encoded=JSON.stringify(address);
 const rows=await db`UPDATE ssc_trade_shipping j SET address=${encoded}::jsonb,status='pending',lease_at=NULL,reason_code=${completeAddress(address)?null:'address'},reason=${completeAddress(address)?null:'Add a complete return address in your profile.'},updated_at=now() FROM ssc_trades_v3 t WHERE t.id=j.trade_id AND t.user_id=${userId} AND j.offer_id=t.current_offer_id AND t.state IN ('offer_ready','revised_offer','awaiting_label','return_requested') AND j.creation_started_at IS NULL AND j.status NOT IN ('superseded','voided') AND coalesce(j.reason_code,'')<>'admin_operation' AND j.address IS DISTINCT FROM ${encoded}::jsonb RETURNING j.id,j.trade_id`;
 for(const row of rows)await shippingEvent(row.id,'profile',`profile-address:${row.id}:${randomUUID()}`,{action:'profile_return_address_updated',actor:userId});
 const pending=await db`SELECT id FROM ssc_trades_v3 WHERE user_id=${userId} AND state IN ('awaiting_label','return_requested')`;
 return pending.map(row=>row.id as string);
}
