import {inventoryDb} from '../inventory-db';
import {ensureShipping} from './store';
import {visibleShippingDocument} from './mode';
import type {CreatedShipment} from './types';
export async function orderFulfillment(sessionId:string,userId:string){
 await ensureShipping();const job=(await inventoryDb()`SELECT status,provider_result,tracking FROM ssc_order_shipping WHERE session_id=${sessionId} AND user_id=${userId}`)[0];
 if(!job)return null;const shipment=job.provider_result as CreatedShipment|null;
 if(!shipment||!visibleShippingDocument(shipment))return {status:'pending',tracking:[]};
 return {status:job.status,carrier:shipment.carrier,service:shipment.service,trackingNumber:shipment.trackingNumbers[0],trackingUrl:shipment.trackingUrl,tracking:job.tracking};
}
