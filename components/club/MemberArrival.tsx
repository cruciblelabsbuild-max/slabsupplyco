"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import MemberLoading from "./MemberLoading";
export default function MemberArrival({destination,name,allowStoredTradeIntent=true}:{destination:string;name:string;allowStoredTradeIntent?:boolean}){
 const router=useRouter();const [leaving,setLeaving]=useState(false);
 useEffect(()=>{let target=destination;try{const saved=JSON.parse(sessionStorage.getItem("ssc_sign_in_destination")||"null");if(allowStoredTradeIntent&&saved?.next==="trades"&&typeof saved.at==="number"&&Date.now()-saved.at>=0&&Date.now()-saved.at<600000)target="/trade-ins#start-trade";}catch{}router.prefetch(target);const exit=window.setTimeout(()=>setLeaving(true),1950);const timer=window.setTimeout(()=>{try{sessionStorage.removeItem("ssc_sign_in_destination");}catch{}router.replace(target);},2350);return()=>{window.clearTimeout(exit);window.clearTimeout(timer);};},[destination,allowStoredTradeIntent,router]);
 return <MemberLoading fullScreen leaving={leaving} name={name}/>;
}
