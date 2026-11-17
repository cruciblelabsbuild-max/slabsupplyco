import {terminalStates,pendingCredit,type Trade} from "./model";
export function collectionTitle(trade:Trade){const names=trade.submission.cards?.map(c=>[c.description,[c.grader,c.grade].filter(Boolean).join(" ")].filter(Boolean).join(" · ")).filter(Boolean)||[];const value=(trade.submission.mode==="quick"&&names.length?names.join(", "):trade.submission.description)||names.join(", ")||(trade.submission.cardCount?`${trade.submission.cardCount} graded Pokémon cards`:"Graded Pokémon cards");return value.length>100?value.slice(0,97)+"…":value;}
export const tradeDate=(value:string)=>new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"America/New_York"}).format(new Date(value));
export function queueGroup(t:Trade){if(terminalStates.has(t.state))return "completed";if(["offer_ready","revised_offer","more_info"].includes(t.state))return "member";if(["submitted","reviewing","legacy_quoted"].includes(t.state))return "review";return "shipping";}

// Describe accepted, nonspendable credit using the actual outstanding stage.
export function pendingTradeStage(trades:Trade[]){
 const pending=trades.filter(t=>pendingCredit(t)>0);
 if(!pending.length)return "No pending trades";
 const stages=new Set(pending.map(t=>t.state==="awaiting_label"||t.state==="awaiting_shipment"?"Awaiting shipment":t.state==="in_transit"?"In transit":t.state==="revised_offer"?"Review revised offer":t.state==="ready_credit"?"Awaiting credit approval":"Awaiting inspection"));
 return stages.size===1?[...stages][0]:"View trade progress";
}
