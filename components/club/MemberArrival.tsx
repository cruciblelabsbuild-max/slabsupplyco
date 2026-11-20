"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {useArrivalHandoff} from "./ArrivalHandoff";
import MemberLoading from "./MemberLoading";
export default function MemberArrival({destination,name,allowStoredTradeIntent=true,freshNavigation=false}:{destination:string;name:string;allowStoredTradeIntent?:boolean;freshNavigation?:boolean}){
 const router=useRouter();const navigate=useArrivalHandoff();const [leaving,setLeaving]=useState(false);
 useEffect(()=>{let target=destination;try{const saved=JSON.parse(sessionStorage.getItem("ssc_sign_in_destination")||"null");if(allowStoredTradeIntent&&saved?.next==="trades"&&typeof saved.at==="number"&&Date.now()-saved.at>=0&&Date.now()-saved.at<600000)target="/trade-ins#start-trade";}catch{}router.prefetch(target);const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;let reloadTimer:number|undefined;const timer=window.setTimeout(()=>{setLeaving(true);try{sessionStorage.removeItem("ssc_sign_in_destination");}catch{}if(freshNavigation){reloadTimer=window.setTimeout(()=>window.location.replace(target),reduced?0:280);}else navigate(target);},reduced?650:2600);return()=>{window.clearTimeout(timer);window.clearTimeout(reloadTimer);};},[destination,allowStoredTradeIntent,freshNavigation,router,navigate]);
 return <MemberLoading fullScreen leaving={leaving} name={name}/>;
}
