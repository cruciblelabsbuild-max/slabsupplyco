// Trade credit is a server-owned ledger, separate from Stripe invoice balances and quotes.
export function availableTradeCredit(metadata:Record<string,unknown>):number|null{
 const ledger=metadata.tradeCreditLedger;if(ledger===undefined)return 0;
 if(!ledger||typeof ledger!=="object"||Array.isArray(ledger))return null;
 let balance=0;
 for(const value of Object.values(ledger)){
  if(!value||typeof value!=="object"||Array.isArray(value))return null;
  const entry=value as Record<string,unknown>;
  if(!["posted","pending","void"].includes(String(entry.status))||entry.currency!=="usd"||!Number.isSafeInteger(entry.amountCents))return null;
  if(entry.status==="posted"){balance+=entry.amountCents as number;if(!Number.isSafeInteger(balance))return null;}
 }
 return balance>=0?balance:null;
}
export function displayTradeCredit(cents:number|null){return cents===null?"Unavailable":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(cents/100);}
