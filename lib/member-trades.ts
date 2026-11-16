export class TradeValidationError extends Error {}
export const maxTradeCards=5;
export type TradeCard={cardName:string;set:string;year:string;grader:string;grade:string;condition:string;certification:string};
export type TradeRequest={id:string;createdAt:string;status:"submitted"|"reviewing"|"quoted"|"declined"|"completed";cards:TradeCard[];goal:string;preference:"credit"|"cash"|"either"};
const statuses=["submitted","reviewing","quoted","declined","completed"];
function text(body:Record<string,unknown>,key:string,max:number,required=true){const value=body[key]??(required?null:"");if(typeof value!=="string"||value.trim().length>max||(required&&!value.trim())||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw new TradeValidationError("Please check your card details.");return value.trim();}
function parseCard(value:unknown,now:Date):TradeCard{
 if(!value||typeof value!=="object"||Array.isArray(value))throw new TradeValidationError("Enter details for every card.");const body=value as Record<string,unknown>;
 const grader=text(body,"grader",20);if(!["PSA","CGC","BGS","Other"].includes(grader))throw new TradeValidationError("Select a grading service for every card.");
 const year=text(body,"year",4);if(!/^\d{4}$/.test(year)||+year<1900||+year>now.getUTCFullYear()+1)throw new TradeValidationError("Enter a valid card year.");
 return {cardName:text(body,"cardName",100),set:text(body,"set",80),year,grader,grade:text(body,"grade",20),condition:text(body,"condition",220),certification:text(body,"certification",60,false)};
}
export function memberTrades(value:unknown):TradeRequest[]{
 if(!value||typeof value!=="object"||Array.isArray(value))return [];
 return Object.values(value).flatMap((item):TradeRequest[]=>{try{
  if(!item||typeof item!=="object"||Array.isArray(item))return [];const r=item as Record<string,unknown>;
  if(typeof r.id!=="string"||!/^[a-f0-9-]{36}$/i.test(r.id)||typeof r.createdAt!=="string"||!Number.isFinite(Date.parse(r.createdAt))||!statuses.includes(String(r.status)))return [];
  const cards=Array.isArray(r.cards)?r.cards:[r];if(!cards.length||cards.length>maxTradeCards)return [];
  return [{id:r.id,createdAt:r.createdAt,status:r.status as TradeRequest["status"],cards:cards.map(card=>parseCard(card,new Date())),goal:text(r,"goal",160,false),preference:["credit","cash","either"].includes(String(r.preference))?r.preference as TradeRequest["preference"]:"either"}];
 }catch{return [];}}).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export function parseTradeRequest(body:Record<string,unknown>,now=new Date()):TradeRequest{
 const id=text(body,"requestId",36);if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)||body.consent!==true)throw new TradeValidationError("Confirm the trade request details before submitting.");
 const multi=Object.hasOwn(body,"cards");const values=multi?body.cards:[body];
 if(!Array.isArray(values)||!values.length||values.length>maxTradeCards)throw new TradeValidationError(`Submit between 1 and ${maxTradeCards} cards per request.`);
 if(multi&&body.cardCount!==values.length)throw new TradeValidationError("The number of cards must match the card details.");
 const preference=multi?body.preference:"either";if(!["credit","cash","either"].includes(String(preference)))throw new TradeValidationError("Choose store credit, cash, or either.");
 return {id,createdAt:now.toISOString(),status:"submitted",cards:values.map(value=>parseCard(value,now)),goal:text(body,"goal",160,false),preference:preference as TradeRequest["preference"]};
}
export async function saveMemberTrade(body:Record<string,unknown>,store:{read:()=>Promise<Record<string,unknown>>;write:(id:string,trade:TradeRequest)=>Promise<void>}){
 const request=parseTradeRequest(body);const metadata=await store.read();const existing=memberTrades(metadata.tradeRequests);const previous=existing.find(t=>t.id===request.id);if(previous)return previous;
 if(existing.filter(t=>!["declined","completed"].includes(t.status)).length>=3)throw new TradeValidationError("You have three open trade requests. Review them in Trades before submitting another.");
 const next={...metadata,tradeRequests:{...(typeof metadata.tradeRequests==="object"?metadata.tradeRequests:{}),[request.id]:request}};
 if(new TextEncoder().encode(JSON.stringify(next)).length>7000)throw new TradeValidationError("Your trade request could not be added. Contact the trade-in desk before submitting another.");
 await store.write(request.id,request);return request;
}
