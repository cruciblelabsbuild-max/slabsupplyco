"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import MemberLoading from "./MemberLoading";
export default function MemberArrival({destination}:{destination:string}){
 const router=useRouter();
 useEffect(()=>{let target=destination;try{const saved=JSON.parse(sessionStorage.getItem("ssc_sign_in_destination")||"null");if(saved?.next==="trades"&&typeof saved.at==="number"&&Date.now()-saved.at>=0&&Date.now()-saved.at<600000)target="/trade-ins#start-trade";}catch{}router.prefetch(target);const timer=window.setTimeout(()=>{try{sessionStorage.removeItem("ssc_sign_in_destination");}catch{}router.replace(target);},650);return()=>window.clearTimeout(timer);},[destination,router]);
 return <MemberLoading fullScreen/>;
}
