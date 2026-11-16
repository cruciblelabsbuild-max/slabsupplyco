import {availableTradeCredit} from "./member-credit";
import {memberTrades} from "./member-trades";
// Purchase amounts are server-owned snapshots from completed card orders, never
// catalog estimates, membership fees, pending payments, or client profile fields.
export function totalMemberSavings(metadata:Record<string,unknown>):number|null{
 const purchases=metadata.memberPurchases;
 if(purchases===undefined)return 0;
 if(!purchases||typeof purchases!=="object"||Array.isArray(purchases))return null;
 let total=0;
 for(const value of Object.values(purchases)){
  if(!value||typeof value!=="object"||Array.isArray(value))return null;
  const purchase=value as Record<string,unknown>;
  if(!["completed","pending","refunded","canceled"].includes(String(purchase.status)))return null;
  if(purchase.status!=="completed")continue;
  if(purchase.currency!=="usd"||!Number.isSafeInteger(purchase.retailValueCents)||!Number.isSafeInteger(purchase.cardSubtotalCents)||Number(purchase.retailValueCents)<0||Number(purchase.cardSubtotalCents)<0)return null;
  total+=Math.max(0,Number(purchase.retailValueCents)-Number(purchase.cardSubtotalCents));
  if(!Number.isSafeInteger(total))return null;
 }
 return total;
}
export function memberHomeMetrics(metadata:Record<string,unknown>|null){
 return {
  savingsCents:metadata?totalMemberSavings(metadata):null,
  creditCents:metadata?availableTradeCredit(metadata):null,
  activeTrades:metadata?memberTrades(metadata.tradeRequests).filter(trade=>!["completed","declined"].includes(trade.status)).length:null,
 };
}
export function displayMemberMoney(cents:number|null){
 return cents===null?"Unavailable":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:cents%100===0?0:2,maximumFractionDigits:2}).format(cents/100);
}
