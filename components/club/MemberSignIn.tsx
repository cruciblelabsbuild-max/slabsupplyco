"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {SignIn} from "@clerk/nextjs";
import {enrollmentArrivalUrl} from "../../lib/member-arrival";
import {authAppearance} from "./auth-appearance";
export default function MemberSignIn({next,enrollment=false}:{next:"home"|"trades";enrollment?:boolean}){
 const path=usePathname();const [tradeIntent,setTradeIntent]=useState(next==="trades");
 useEffect(()=>{try{if(next==="trades"){setTradeIntent(true);sessionStorage.setItem("ssc_sign_in_destination",JSON.stringify({next,at:Date.now()}));}else if(path==="/sign-in")sessionStorage.removeItem("ssc_sign_in_destination");else {const saved=JSON.parse(sessionStorage.getItem("ssc_sign_in_destination")||"null");if(saved?.next==="trades"&&Date.now()-saved.at<600000)setTradeIntent(true);}}catch{/* Default destination remains member home. */}},[next,path]);
 return <SignIn routing="path" path="/sign-in" signUpUrl={tradeIntent?"/join?next=trades":"/join"} forceRedirectUrl={enrollment ? enrollmentArrivalUrl(tradeIntent?"trades":undefined) : "/member-entry"} appearance={authAppearance}/>;
}
