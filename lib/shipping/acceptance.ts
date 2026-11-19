import {getTrade} from '../trades/store';
import type {Trade} from '../trades/model';
import {reconcileShipping} from './service';
/** Return the issued label with acceptance when Shippo completes it synchronously. */
export async function prepareAcceptedTrade(trade:Trade,options?:Parameters<typeof reconcileShipping>[1]):Promise<Trade>{
 if(!['awaiting_label','return_requested'].includes(trade.state))return trade;
 try{await reconcileShipping(trade.id,options);return await getTrade(trade.id,trade.userId);}catch{
  // Acceptance is already committed. The durable queue continues without a second purchase.
  return trade;
 }
}
