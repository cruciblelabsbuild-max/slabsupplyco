"use client";
import {createContext,useCallback,useContext,useEffect,useState,useTransition,type ReactNode} from "react";
import {usePathname,useRouter} from "next/navigation";

type Handoff={destination:string;from:string;reduced:boolean};
const HandoffContext=createContext<((destination:string)=>void)|null>(null);

/** Covers only the two completion handoffs; ordinary page navigation stays unchanged. */
export default function ArrivalHandoff({children}:{children:ReactNode}){
 const router=useRouter(),pathname=usePathname();
 const [handoff,setHandoff]=useState<Handoff|null>(null),[revealing,setRevealing]=useState(false),[pending,startTransition]=useTransition();
 const navigate=useCallback((destination:string)=>{
  setRevealing(false);
  setHandoff({destination,from:pathname,reduced:window.matchMedia("(prefers-reduced-motion: reduce)").matches});
 },[pathname]);
 useEffect(()=>{
  if(!handoff)return;
  const timer=window.setTimeout(()=>startTransition(()=>router.replace(handoff.destination)),handoff.reduced?0:650);
  const fallback=window.setTimeout(()=>setHandoff(null),15000);
  return()=>{window.clearTimeout(timer);window.clearTimeout(fallback);};
 },[handoff,router]);
 useEffect(()=>{
  if(!handoff||pending||pathname===handoff.from)return;
  const frame=window.requestAnimationFrame(()=>setRevealing(true));
  const timer=window.setTimeout(()=>setHandoff(null),handoff.reduced?0:750);
  return()=>{window.cancelAnimationFrame(frame);window.clearTimeout(timer);};
 },[handoff,pending,pathname]);
 return <HandoffContext.Provider value={navigate}>{children}{handoff&&<div className={`arrival-handoff${revealing?" is-revealing":""}`} aria-hidden="true"/>}</HandoffContext.Provider>;
}
export function useArrivalHandoff(){
 const navigate=useContext(HandoffContext);
 if(!navigate)throw new Error("Arrival handoff requires its provider.");
 return navigate;
}
