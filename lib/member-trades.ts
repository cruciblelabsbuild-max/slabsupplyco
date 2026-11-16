export class TradeValidationError extends Error {}
export type TradeRequest = { id:string; createdAt:string; status:"submitted"|"reviewing"|"quoted"|"declined"|"completed"; cardName:string; set:string; year:string; grader:string; grade:string; condition:string; goal:string };
const statuses=["submitted","reviewing","quoted","declined","completed"];
export function memberTrades(value:unknown):TradeRequest[]{
 if(!value || typeof value!=="object" || Array.isArray(value))return [];
 return Object.values(value).filter((item):item is TradeRequest=>{
  if(!item || typeof item!=="object")return false;
  const r=item as Record<string,unknown>;
  return typeof r.id==="string" && /^[a-f0-9-]{36}$/i.test(r.id) && typeof r.createdAt==="string" && Number.isFinite(Date.parse(r.createdAt)) && statuses.includes(String(r.status)) && ["cardName","set","year","grader","grade","condition","goal"].every(k=>typeof r[k]==="string");
 }).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export function parseTradeRequest(body:Record<string,unknown>,now=new Date()):TradeRequest {
 const text=(key:string,max:number,required=true)=>{const value=body[key];if(typeof value!=="string" || value.trim().length>max || (required && !value.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw new TradeValidationError("Please check your card details.");return value.trim();};
 const id=text("requestId",36);
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id) || body.consent!==true)throw new TradeValidationError("Confirm the trade request details before submitting.");
 const grader=text("grader",20);if(!["PSA","CGC","BGS","Other"].includes(grader))throw new TradeValidationError("Select a grading service.");
 const year=text("year",4);if(!/^\d{4}$/.test(year) || +year<1900 || +year>now.getUTCFullYear()+1)throw new TradeValidationError("Enter a valid card year.");
 return {id,createdAt:now.toISOString(),status:"submitted",cardName:text("cardName",100),set:text("set",80),year,grader,grade:text("grade",20),condition:text("condition",220),goal:text("goal",160,false)};
}
export async function saveMemberTrade(body:Record<string,unknown>,store:{read:()=>Promise<Record<string,unknown>>;write:(id:string,trade:TradeRequest)=>Promise<void>}) {
 const request=parseTradeRequest(body);
 const metadata=await store.read();const existing=memberTrades(metadata.tradeRequests);
 const previous=existing.find(t=>t.id===request.id);if(previous)return previous;
 if(existing.filter(t=>!["declined","completed"].includes(t.status)).length>=3)throw new TradeValidationError("You have three open trade requests. Review them in Trades before submitting another.");
 const next={...metadata,tradeRequests:{...(typeof metadata.tradeRequests==="object" ? metadata.tradeRequests:{}),[request.id]:request}};
 if(new TextEncoder().encode(JSON.stringify(next)).length>7000)throw new TradeValidationError("Your trade request could not be added. Contact the trade-in desk before submitting another.");
 await store.write(request.id,request);return request;
}
