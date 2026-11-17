import {dropState,grailTimeZone} from "./grail-cycle";
import type {GrailDrop,ConfirmedGrail} from "./grail-data";
export const grailMonthLabel=(month:string)=>new Intl.DateTimeFormat("en-US",{month:"long",timeZone:"UTC"}).format(new Date(`${month}-01T12:00:00Z`));
export const grailDateLabel=(value:string)=>new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",hour:"numeric",minute:"2-digit",timeZone:grailTimeZone,timeZoneName:"short"}).format(new Date(value));
export function grailCardState(drop:GrailDrop,card:ConfirmedGrail,now:Date,stock=card.stock){return drop.preview_only||!drop.starts_at?"upcoming":dropState(stock,drop.starts_at,drop.ends_at,now);}
export function grailDropSummary(drop:GrailDrop|null,now:Date,unavailable=false,stock?:ReadonlyArray<{slug:string;status:string}>){
 if(unavailable)return {title:"Release calendar",status:"Details unavailable",message:"Release details couldn’t load. Check Grail drops for updates."};
 if(!drop?.cards.length)return {title:"Release calendar",status:"No scheduled drop",message:"No grail drop is scheduled right now."};
 const title=`${grailMonthLabel(drop.month)} Member Drop`;
 let status:string;
 if(drop.preview_only||!drop.starts_at)status="Preview";
 else if(drop.ends_at&&now.getTime()>=Date.parse(drop.ends_at))status="Complete";
 else if(now.getTime()<Date.parse(drop.starts_at))status=`Opens ${grailDateLabel(drop.starts_at)}`;
 else {
  const states=drop.cards.map(card=>grailCardState(drop,card,now,stock?.find(s=>s.slug===card.slug)?.status||card.stock));
  status=states.includes("live")?"Available now":states.every(s=>s==="sold-out"||s==="ended")?"Complete":states.includes("reserved")?"In checkout":"Unavailable";
 }
 return {title,status,message:`${title} · ${status}`};
}
