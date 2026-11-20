"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import AuthCompletionBridge from "./AuthCompletionBridge";
import {cardQuery} from "../../lib/card-intent";
import {SignIn} from "@clerk/nextjs";
import {enrollmentArrivalUrl} from "../../lib/member-arrival";
import {authAppearance} from "./auth-appearance";
export default function MemberSignIn({next,enrollment=false,card,emailDestination}:{next:"home"|"trades";enrollment?:boolean;card?:string;emailDestination?:string}){
 const path=usePathname();const [tradeIntent,setTradeIntent]=useState(next==="trades");
 useEffect(()=>{let mounted=true;try{if(next==="trades"){sessionStorage.setItem("ssc_sign_in_destination",JSON.stringify({next,at:Date.now()}));}else if(path==="/sign-in")sessionStorage.removeItem("ssc_sign_in_destination");else {const saved=JSON.parse(sessionStorage.getItem("ssc_sign_in_destination")||"null");if(saved?.next==="trades"&&Date.now()-saved.at<600000)queueMicrotask(()=>{if(mounted)setTradeIntent(true);});}}catch{/* Default destination remains member home. */}return()=>{mounted=false;};},[next,path]);
 const destination=(emailDestination?`/member-entry?emailTo=${encodeURIComponent(emailDestination)}`:null)||(enrollment ? enrollmentArrivalUrl(tradeIntent?"trades":undefined,card) : tradeIntent?"/member-entry?next=trades":"/member-entry");
 return <><AuthCompletionBridge destination={destination}/><SignIn oauthFlow="redirect" routing="path" path="/sign-in" signUpUrl={`${tradeIntent?"/join?next=trades":"/join?identity=sign-up"}${cardQuery(card)}`} forceRedirectUrl={destination} signUpForceRedirectUrl={destination} appearance={authAppearance}/></>;
}
