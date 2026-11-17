"use client";
import {useEffect,useState,type ReactNode} from "react";
import {useClerk} from "@clerk/nextjs";
import {ArrowUpRight,ShieldCheck} from "lucide-react";
import MemberProfileForm from "./MemberProfileForm";
import type {MemberProfile} from "../../lib/member-profile";
const tabs=[["membership","Membership"],["preferences","Collector preferences"],["shipping","Shipping"],["payment","Payment"],["security","Sign-in & security"]] as const;
export default function AccountSettings({profile,membership,payment}:{profile:MemberProfile;membership:ReactNode;payment:ReactNode}){
 const [active,setActive]=useState("membership");const {openUserProfile}=useClerk();
 useEffect(()=>{const sync=()=>{const id=window.location.hash.slice(1);if(tabs.some(([key])=>key===id))setActive(id);};sync();window.addEventListener("hashchange",sync);return()=>window.removeEventListener("hashchange",sync);},[]);
 function select(id:string,focus=false){setActive(id);window.history.replaceState(null,"",`#${id}`);if(focus)document.getElementById(`settings-tab-${id}`)?.focus();}
 return <><div className="profile-section-nav" role="tablist" aria-label="Account settings">{tabs.map(([id,label],i)=><button key={id} id={`settings-tab-${id}`} role="tab" aria-selected={active===id} aria-controls={id==="preferences"||id==="shipping"?id:`settings-panel-${id}`} tabIndex={active===id?0:-1} onClick={()=>select(id)} onKeyDown={e=>{const next=e.key==="ArrowRight"?(i+1)%tabs.length:e.key==="ArrowLeft"?(i+tabs.length-1)%tabs.length:e.key==="Home"?0:e.key==="End"?tabs.length-1:-1;if(next>=0){e.preventDefault();select(tabs[next][0],true);}}}>{label}</button>)}</div><div className="profile-sheet"><div role="tabpanel" id="settings-panel-membership" aria-labelledby="settings-tab-membership" hidden={active!=="membership"}>{membership}</div><MemberProfileForm initialProfile={profile} activeSection={active}/><div role="tabpanel" id="settings-panel-payment" aria-labelledby="settings-tab-payment" hidden={active!=="payment"}>{payment}</div><section role="tabpanel" id="settings-panel-security" aria-labelledby="settings-tab-security" hidden={active!=="security"} className="settings-security"><ShieldCheck size={24} strokeWidth={1.25}/><h2>Sign-in & security</h2><p>Manage your name, email addresses, connected accounts, and password.</p><button className="button" onClick={()=>openUserProfile()}>Manage sign-in & security<ArrowUpRight size={15}/></button></section></div></>;
}
