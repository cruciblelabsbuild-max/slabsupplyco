export function enrollmentArrivalUrl(next?:string){
 return `/member-entry?checkout=continue${next==="trades"?"&next=trades":""}`;
}
export function memberArrivalDestination({enrollment,activeMembership,next}:{enrollment:boolean;activeMembership:boolean;next?:string}){
 if(enrollment&&!activeMembership)return `/join?checkout=continue${next==="trades"?"&next=trades":""}`;
 return next==="trades"?"/trade-ins#start-trade":"/account";
}
