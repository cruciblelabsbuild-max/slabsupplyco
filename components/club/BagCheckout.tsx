"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {useBag,BagItems,BagSummary,seedBagCard} from "./BagProvider";
import {ArrowRight} from "lucide-react";
export function BagCheckoutButton({active,autoContinue=false}:{active:boolean;autoContinue?:boolean}){
 const bag=useBag(),[pending,setPending]=useState(false),[error,setError]=useState("");const started=useRef(false),router=useRouter();
 async function checkout(){setPending(true);setError("");try{
  const response=await fetch("/api/cards/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slugs:bag.slugs})});
  const result=await response.json() as {url?:string;message?:string};
  if(response.status===401||response.status===400){router.push("/join?bag=1");return;}
  if(!response.ok||!result.url)throw Error(result.message||"Checkout could not open.");
  const url=new URL(result.url);if(url.protocol!=="https:"||url.hostname!=="checkout.stripe.com")throw Error("Checkout could not open.");window.location.assign(url.toString());
 }catch(error){setError(error instanceof Error?error.message:"Please try again.");setPending(false);await bag.refresh();}}
 useEffect(()=>{if(autoContinue&&active&&bag.slugs.length&&!started.current){started.current=true;void checkout();}
 // The authenticated return consumes this checkout intent once after the bag loads.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[autoContinue,active,bag.slugs.length]);
 return <>{active?<button className="button club-wide" type="button" onClick={()=>void checkout()} disabled={pending||!bag.slugs.length}>{pending?"Opening checkout…":"Checkout"}<ArrowRight size={16}/></button>:<Link className="button club-wide" href="/join?bag=1">Continue to checkout<ArrowRight size={16}/></Link>}{error&&<p className="club-form-error" role="alert">{error}</p>}</>;
}
export default function BagCheckout({active,autoContinue=false,canceled,initialSlug}:{active:boolean;autoContinue?:boolean;canceled?:string;initialSlug?:string}){
 useEffect(()=>{if(initialSlug)seedBagCard(initialSlug);},[initialSlug]);
 const bag=useBag(),router=useRouter();const refresh=bag.refresh;const [cancelMessage,setCancelMessage]=useState(canceled?"Closing your previous checkout…":"");
 useEffect(()=>{if(!canceled||!/^[-a-f0-9]{36}$/.test(canceled))return;void fetch("/api/checkout/cancel",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:canceled})}).then(async response=>{const result=await response.json() as {status?:string;message?:string};if(result.status==="paid"){router.replace("/account/orders");return;}setCancelMessage(result.status==="released"?"Checkout canceled. Your bag is saved.":result.message||"Your payment status is being checked. Please review Orders before trying again.");await refresh();}).catch(()=>setCancelMessage("Checkout could not be canceled. Please try again."));},[canceled,router,refresh]);
 return <section className="section-shell bag-checkout-page"><p className="eyebrow">Your selection</p><h1>Your bag.</h1>{cancelMessage&&<p className="club-notice" role="status">{cancelMessage}</p>}{bag.slugs.length?<div className="bag-checkout-layout"><BagItems/><aside><BagSummary/><BagCheckoutButton active={active} autoContinue={!canceled&&autoContinue}/><Link className="club-text-link" href="/shop">Keep browsing</Link></aside></div>:<div className="club-empty"><h2>Find your next card.</h2><Link className="button" href="/shop">Browse member deals<ArrowRight size={16}/></Link></div>}</section>;
}
export function JoinBagSummary(){const bag=useBag();return bag.slugs.length?<div className="join-bag-summary"><BagItems/><BagSummary membership/></div>:null;}
export function ClearPurchasedBag({slugs}:{slugs:string[]}){const {removePurchased}=useBag();const key=slugs.join(",");useEffect(()=>{if(key)removePurchased(key.split(","));
 // Only the confirmed server-owned purchase snapshot can clear purchased cards.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[key]);return null;}
