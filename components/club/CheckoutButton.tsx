"use client";
import { annualMembership } from "../../lib/membership-plan";

import Link from "next/link";
import { enrollmentArrivalUrl } from "../../lib/member-arrival";
import { authAppearance } from "./auth-appearance";
import { SignUp, SignIn } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
const consentKey = "ssc_membership_consent";
import { enrollmentTermsVersion, hasRecentEnrollmentConsent } from "../../lib/enrollment-consent";
export default function CheckoutButton({ ready, signedIn = false, autoContinue = false, identity, next }: { ready: boolean; signedIn?: boolean; autoContinue?: boolean; identity?: "sign-in" | "sign-up"; next?: "trades" }) {
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [details, setDetails] = useState(Boolean(identity));
  const signIn = identity === "sign-in";
  const [initialValues, setInitialValues] = useState<{firstName?:string;emailAddress?:string}>({});
  const [error, setError] = useState("");
  const started = useRef(false);
  const destinationSuffix = next === "trades" ? "&next=trades" : "";
  const returnUrl = enrollmentArrivalUrl(next);
  useEffect(()=>{try{if(next === "trades")sessionStorage.setItem("ssc_membership_next",JSON.stringify({next:"trades",at:Date.now()}));}catch{}},[next]);
  async function checkout(consent: boolean) {
    if (!consent) return;
    setPending(true);setError("");
    try {
      const response=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({acceptRenewal:true})});
      const result=await response.json() as {url?:string;message?:string};
      if(!response.ok || !result.url)throw new Error(result.message || "Checkout could not open. Please try again.");
      const url=new URL(result.url);
      if(url.protocol!=="https:" || url.hostname!=="checkout.stripe.com")throw new Error("Checkout could not open. Please try again.");
      try{sessionStorage.removeItem(consentKey);sessionStorage.removeItem("ssc_join_details");}catch{}
      window.location.assign(url.toString());
    }catch(error){setError(error instanceof Error ? error.message : "Checkout could not open.");setPending(false);}
  }
  useEffect(()=>{
    try {
      const prefill=JSON.parse(sessionStorage.getItem("ssc_join_details") || "{}");
      setInitialValues({firstName:typeof prefill.firstName==="string" ? prefill.firstName:undefined,emailAddress:typeof prefill.emailAddress==="string" ? prefill.emailAddress:undefined});
      const consent=JSON.parse(sessionStorage.getItem(consentKey)||"null");
      if(signedIn && ready && autoContinue && hasRecentEnrollmentConsent(consent) && !started.current){started.current=true;setAccepted(true);void checkout(true);}
    }catch{/* Consent is never assumed from invalid or unavailable storage. */}
  },[signedIn,ready,autoContinue]);
  function proceed(){
    if(!accepted || pending)return;
    if(signedIn){void checkout(true);return;}
    try{sessionStorage.setItem(consentKey,JSON.stringify({version:enrollmentTermsVersion,at:Date.now()}));}catch{}
    setDetails(true);
  }
  if(!ready)return <div className="checkout-unavailable"><p>Checkout is unavailable. Please try again.</p></div>;
  if(details && !signedIn)return <div className="join-inline-identity"><p className="eyebrow">Your details</p>{signIn ? <SignIn appearance={authAppearance} routing="hash" forceRedirectUrl={returnUrl} signUpForceRedirectUrl={returnUrl} signUpUrl={`/join?identity=sign-up${destinationSuffix}`}/>:<SignUp appearance={authAppearance} routing="hash" initialValues={initialValues} forceRedirectUrl={returnUrl} signInForceRedirectUrl={returnUrl} signInUrl={`/join?identity=sign-in${destinationSuffix}`}/>}</div>;
  return <div className="checkout-controls"><label className="club-consent"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>I agree to the <Link href="/membership/terms">membership terms</Link>. Membership renews at {annualMembership.display} USD/year until canceled.</span></label><button className="button club-wide" type="button" onClick={proceed} disabled={!accepted || pending}>{pending ? "Opening secure checkout…" : "Become a member"}<ArrowRight size={16}/></button><p className="club-small join-payment-note"><LockKeyhole size={12}/> Secure payment through Stripe.</p>{error && <p className="club-form-error" role="alert">{error}</p>}</div>;
}
