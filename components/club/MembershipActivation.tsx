"use client";
import {useEffect,useState} from 'react';
import {Check,Clock3} from 'lucide-react';
import SupportLink from './SupportLink';
export default function MembershipActivation({sessionId,initialState}:{sessionId:string;initialState:'invalid'|'processing'|'confirmed'|'entered'}){
 const [state,setState]=useState(initialState),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(state==='entered'){window.location.replace('/account');return;}if(state!=='processing')return;let stopped=false;const timer=setInterval(()=>{void fetch('/api/membership/activation?session_id='+encodeURIComponent(sessionId),{cache:'no-store'}).then(async r=>r.ok?await r.json() as {state:typeof state}:null).then(data=>{if(!stopped&&data)setState(data.state);}).catch(()=>{});},2000);return()=>{stopped=true;clearInterval(timer);};},[state,sessionId]);
 async function enter(){setBusy(true);setError('');try{const r=await fetch('/api/membership/activation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:sessionId})});if(!r.ok)throw Error('Your membership could not open. Please try again.');window.location.replace('/account');}catch(e){setError(e instanceof Error?e.message:'Please try again.');setBusy(false);}}
 const confirmed=state==='confirmed';
 return <section className="section-shell club-result membership-activation" aria-live="polite"><span className="club-result-icon">{confirmed?<Check size={35}/>:<Clock3 size={35}/>}</span><h1>{confirmed?<>You’re officially<br/><em>a member.</em></>:state==='invalid'?<>We couldn’t confirm<br/><em>this checkout.</em></>:<>Confirming your<br/><em>membership.</em></>}</h1><p>{confirmed?"Welcome to Slab Supply. Your membership is active, and you’re ready to start collecting.":state==='invalid'?"Check your checkout link or contact us for help.":"We’re verifying your payment. This page will update automatically when your membership is ready."}</p>{confirmed&&<button className="button" disabled={busy} onClick={()=>void enter()}>{busy?'Opening your membership…':'Enter your membership'}</button>}{error&&<p role="alert">{error}</p>}<SupportLink category="members"/></section>;
}
