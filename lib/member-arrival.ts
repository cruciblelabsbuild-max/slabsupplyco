import { cardQuery, safeCardSlug } from "./card-intent";
export function enrollmentArrivalUrl(next?:string,card?:string){
 return `/member-entry?checkout=continue${next==="trades"?"&next=trades":""}${cardQuery(card)}`;
}
export function memberArrivalDestination({enrollment,activeMembership,next,card}:{enrollment:boolean;activeMembership:boolean;next?:string;card?:string}){
 const slug=safeCardSlug(card);
 if(slug && activeMembership)return `/checkout?card=${slug}&continue=1`;
 if(enrollment&&!activeMembership)return `/join?checkout=continue${next==="trades"?"&next=trades":""}${cardQuery(card)}`;
 return next==="trades"?"/trade-ins#start-trade":"/account";
}
