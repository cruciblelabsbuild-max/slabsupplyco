"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {ArrowRight} from "lucide-react";
export default function MembershipCompletionActions({paid}:{paid:boolean}){
 const [trade,setTrade]=useState(false);
 useEffect(()=>{try{const saved=JSON.parse(sessionStorage.getItem("ssc_membership_next")||"null");if(paid&&saved?.next==="trades"&&typeof saved.at==="number"&&Date.now()-saved.at>=0&&Date.now()-saved.at<3600000)setTrade(true);}catch{}},[paid]);
 function clear(){try{sessionStorage.removeItem("ssc_membership_next");}catch{}}
 if(!paid)return <div className="club-result-actions"><Link className="button" href="/join?checkout=continue">Continue to checkout<ArrowRight size={16}/></Link></div>;
 return <div className="club-result-actions"><Link className="button" href={trade?"/member-entry?next=trades":"/member-entry"} onClick={clear}>{trade?"Start a trade":"Member home"}<ArrowRight size={16}/></Link><Link className="button club-button-outline" href="/shop" onClick={clear}>Browse member deals</Link></div>;
}
