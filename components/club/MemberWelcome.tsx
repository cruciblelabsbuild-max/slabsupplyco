"use client";
import Link from "next/link";
import {useEffect,useRef,useState,useCallback} from "react";
import {ArrowUpRight,Check,X} from "lucide-react";
const steps=[
 {href:"/shop",title:"Browse your member pricing",description:"Find your first deal."},
 {href:"/trade-ins#start-trade",title:"Get a trade-in quote",description:"Find out what your slabs could be worth in credit."},
 {href:"/account/profile#preferences",title:"Set your collecting preferences",description:"Tell us which cards you’d like to see in future drops."},
];
export default function MemberWelcome({memberId}:{memberId:string}){
 const [open,setOpen]=useState(false);const seen=useRef<string|null>(null);const trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  const key=`ssc_member_welcome_v1:${memberId}`;if(seen.current===key)return;seen.current=key;let stopped=false;let timer:ReturnType<typeof setTimeout>|undefined;
  async function schedule(){
   try{if(localStorage.getItem(key)==="seen"){void fetch('/api/account/onboarding',{method:'POST'}).catch(()=>{});return;}}catch{}
   try{const r=await fetch('/api/account/onboarding',{cache:'no-store'});if(!r.ok)return;const data=await r.json() as {dismissed:boolean};if(data.dismissed)return;}catch{return;}
   function ready(){if(stopped)return;const focus=document.activeElement;const occupied=document.visibilityState!=='visible'||!!document.querySelector('dialog[open],[role="dialog"][aria-modal="true"],.arrival-handoff')||focus instanceof HTMLElement&&(focus.matches('input,textarea,select')||focus.isContentEditable);if(occupied){timer=setTimeout(ready,500);return;}setOpen(true);}
   if(!stopped)timer=setTimeout(ready,4000);
  }
  void schedule();return()=>{stopped=true;if(timer)clearTimeout(timer);seen.current=null;};
 },[memberId]);
 const dismiss=useCallback(()=>{setOpen(false);try{localStorage.setItem(`ssc_member_welcome_v1:${memberId}`,"seen");}catch{}void fetch('/api/account/onboarding',{method:'POST'}).catch(()=>{});requestAnimationFrame(()=>trigger.current?.focus({preventScroll:true}));},[memberId]);
 useEffect(()=>{if(!open)return;function escape(event:KeyboardEvent){if(event.key==="Escape"){event.preventDefault();dismiss();}}document.addEventListener("keydown",escape);return()=>document.removeEventListener("keydown",escape);},[open,dismiss]);
 return <div className="member-welcome"><button ref={trigger} className="member-welcome-trigger" type="button" hidden={open} aria-expanded={open} aria-controls="member-welcome-panel" onClick={()=>setOpen(true)}>Getting started<ArrowUpRight size={15}/></button>{open&&<aside className="member-welcome-panel" id="member-welcome-panel" aria-labelledby="member-welcome-title"><button className="member-welcome-close" type="button" aria-label="Dismiss getting started" onClick={dismiss}><X size={18}/></button><span className="member-welcome-status"><Check size={13}/>Your membership is active.</span><h2 id="member-welcome-title">Here’s how to<br/><em>get started.</em></h2><ol>{steps.map((step,index)=><li key={step.href}><Link href={step.href} onClick={dismiss}><span className="member-welcome-number">0{index+1}</span><span><strong>{step.title}</strong><span>{step.description}</span></span><ArrowUpRight size={16}/></Link></li>)}</ol><button className="member-welcome-later" type="button" onClick={dismiss}>I’ll explore on my own<ArrowUpRight size={14}/></button></aside>}</div>;
}
