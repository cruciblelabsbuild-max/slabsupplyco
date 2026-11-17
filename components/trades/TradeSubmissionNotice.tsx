"use client";
import {useEffect,useRef,useState} from "react";
import {Check,X} from "lucide-react";
export const tradeSubmissionKey="ssc_trade_submitted";
export default function TradeSubmissionNotice(){
 const [visible,setVisible]=useState(false),confirmed=useRef(false);
 useEffect(()=>{
  if(!confirmed.current){try{const raw=sessionStorage.getItem(tradeSubmissionKey);if(!raw)return;const saved=JSON.parse(raw);sessionStorage.removeItem(tradeSubmissionKey);if(typeof saved.id!=="string"||typeof saved.at!=="number"||Date.now()-saved.at<0||Date.now()-saved.at>60000)return;confirmed.current=true;const url=new URL(window.location.href);if(url.searchParams.get("trade")===saved.id){url.searchParams.delete("trade");window.history.replaceState(null,"",url.pathname+url.search+url.hash);}}catch{return;}}
  const show=window.setTimeout(()=>setVisible(true),0);
  const timer=window.setTimeout(()=>setVisible(false),6500);return()=>{window.clearTimeout(show);window.clearTimeout(timer);};
 },[]);
 return visible?<div className="trade-submission-notice section-shell" role="status"><Check size={16}/><span>Trade submitted. We’ll be in touch with an offer.</span><button type="button" aria-label="Dismiss trade confirmation" onClick={()=>setVisible(false)}><X size={15}/></button></div>:null;
}
