export const tradeStates={draft:"Draft",submitted:"Submitted",reviewing:"Under review",more_info:"More information needed",offer_ready:"Offer ready",revised_offer:"Revised offer",awaiting_label:"Offer accepted",awaiting_shipment:"Awaiting shipment",in_transit:"In transit",delivered:"Delivered",received:"Received",inspecting:"Under inspection",ready_credit:"Inspection approved",credit_issued:"Credit issued",declined:"Declined",return_requested:"Return requested",return_label:"Return label ready",return_shipped:"Return in transit",returned:"Returned",legacy_quoted:"Offer details pending",legacy_completed:"Completed"} as const;
export type TradeState=keyof typeof tradeStates;
export type CardInput={id:string;description:string;grader:string;grade:string;notes:string};
export type Submission={mode:"quick"|"bulk";cards:CardInput[];description:string;cardCount:number|null;notes:string;legacy?:unknown};
export type Offer={id:string;version:number;kind:"preliminary"|"inspection";creditCents:number;shippingDeductionCents:number;included:string[];includedCount:number|null;expiresAt:string|null;conditions:string;shippingTerms:string;inspectionTerms:string;returnTerms:string;coverage:string;reason:string;createdAt:string};
export type Label={id:string;direction:"inbound"|"return";fileId:string;carrier:string;tracking:string;trackingUrl:string;service:string;sender:string;recipient:string;package:string;approvedValueCents:number;coverage:string;instructions:string;createdAt:string};
export type TradeFile={id:string;name:string;mime:string;size:number;kind:"front"|"back"|"collection"|"label"|"return_label";cardKey:string|null};
export type TradeEvent={id:number;action:string;actor:string;at:string;note:string};
export type Trade={id:string;userId:string;reference:string;state:TradeState;revision:number;createdAt:string;updatedAt:string;submission:Submission;offers:Offer[];currentOfferId:string|null;acceptedOfferId:string|null;files:TradeFile[];labels:Label[];events:TradeEvent[];creditTransactionId:string|null};
export const terminalStates=new Set<TradeState>(["credit_issued","declined","returned","legacy_completed"]);
export const pendingStates=new Set<TradeState>(["awaiting_label","awaiting_shipment","in_transit","delivered","received","inspecting","revised_offer","ready_credit"]);
export function pendingCredit(trade:Pick<Trade,"state"|"acceptedOfferId"|"offers">){return pendingStates.has(trade.state)?trade.offers.find(o=>o.id===trade.acceptedOfferId)?.creditCents??0:0;}
export function actionRequired(trade:Pick<Trade,"state"|"offers"|"currentOfferId">,now=Date.now()){
 if(["more_info","awaiting_shipment","return_label"].includes(trade.state))return true;
 return ["offer_ready","revised_offer"].includes(trade.state)&&!offerExpired(trade.offers.find(o=>o.id===trade.currentOfferId),now);
}
export const offerExpired=(offer:Offer|undefined,now=Date.now())=>!offer||!!offer.expiresAt&&Date.parse(offer.expiresAt)<=now;
export function nextTradeAction(trade:Pick<Trade,"state"|"offers"|"currentOfferId">){
 if(["offer_ready","revised_offer"].includes(trade.state)&&offerExpired(trade.offers.find(o=>o.id===trade.currentOfferId)))return "Offer expired";
 return ({more_info:"Provide details",offer_ready:"Review offer",revised_offer:"Review revised offer",awaiting_label:"View accepted offer",awaiting_shipment:"Download shipping label",in_transit:"Track package",delivered:"View delivery",received:"View progress",inspecting:"View inspection",ready_credit:"View approved offer",credit_issued:"View credit transaction",return_requested:"View return request",return_label:"Download return label",return_shipped:"Track return",returned:"View return tracking"} as Partial<Record<TradeState,string>>)[trade.state]||"View submission";
}
export const tradeMoney=(cents:number|null)=>cents===null?"Unavailable":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:cents%100?2:0}).format(cents/100);
export class TradeError extends Error{}
export const validId=(value:unknown):value is string=>typeof value==="string"&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
export function text(value:unknown,max:number,required=false){if(value===undefined||value===null)value="";if(typeof value!=="string"||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)||required&&!value.trim())throw new TradeError("Please check the required details and field lengths.");return value.trim();}
export function cents(value:unknown,allowZero=false){if(!Number.isSafeInteger(value)||Number(value)<(allowZero?0:1)||Number(value)>100000000)throw new TradeError("Enter a valid amount in USD cents.");return Number(value);}
export function parseSubmission(body:Record<string,unknown>):Submission{
 if(body.consent!==true)throw new TradeError("Confirm the submission details before sending.");
 const mode=body.mode==="bulk"?"bulk":"quick",values=body.cards??[];
 if(!Array.isArray(values)||values.length>25)throw new TradeError("Use a collection list for more than 25 individual cards.");
 const cards=values.map((value):CardInput=>{if(!value||typeof value!=="object"||!validId(value.id))throw new TradeError("Please check your card details.");return {id:value.id,description:text(value.description,300),grader:text(value.grader,30),grade:text(value.grade,30),notes:text(value.notes,500)};});
 if(new Set(cards.map(c=>c.id)).size!==cards.length)throw new TradeError("Each card needs its own entry.");
 const cardCount=body.cardCount===null||body.cardCount===undefined||body.cardCount===""?null:Number(body.cardCount);
 if(cardCount!==null&&(!Number.isInteger(cardCount)||cardCount<1||cardCount>100000))throw new TradeError("Please check the number of cards.");
 return {mode,cards,description:text(body.description,6000),cardCount:mode==="quick"?cards.length||null:cardCount,notes:text(body.notes,2000)};
}
export function parseOffer(body:Record<string,unknown>,id:string,version:number,kind:Offer["kind"]):Offer{
 if(!Array.isArray(body.included)||!body.included.length||body.included.length>100)throw new TradeError("Identify the cards or lots included in the offer.");
 const expiresAt=body.expiresAt?text(body.expiresAt,60):null;
 if(expiresAt&&(!Number.isFinite(Date.parse(expiresAt))||Date.parse(expiresAt)<=Date.now()))throw new TradeError("Offer expiration must be in the future.");
 const count=body.includedCount===null||body.includedCount===undefined?null:Number(body.includedCount);
 if(count!==null&&(!Number.isInteger(count)||count<1||count>100000))throw new TradeError("Check the included card count.");
 return {id,version,kind,creditCents:cents(body.creditCents),shippingDeductionCents:cents(body.shippingDeductionCents??0,true),included:body.included.map(v=>text(v,500,true)),includedCount:count,expiresAt,conditions:text(body.conditions,2000,true),shippingTerms:text(body.shippingTerms,2000,true),inspectionTerms:text(body.inspectionTerms,2000,true),returnTerms:text(body.returnTerms,2000,true),coverage:text(body.coverage,2000,true),reason:text(body.reason,2000,version>1),createdAt:new Date().toISOString()};
}
