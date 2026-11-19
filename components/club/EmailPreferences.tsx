"use client";
import {useEffect,useState} from 'react';
export default function EmailPreferences(){
 const [value,setValue]=useState<boolean|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{void fetch('/api/email/preferences').then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{grails:boolean}>;}).then(data=>setValue(data.grails)).catch(()=>setMessage('Email preferences could not load.'));},[]);
 async function change(enabled:boolean){setBusy(true);setMessage('');try{const response=await fetch('/api/email/preferences',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({grails:enabled})});if(!response.ok)throw Error();setValue(enabled);setMessage('Saved.');}catch{setMessage('Could not save. Please try again.');}finally{setBusy(false);}}
 return <div style={{marginTop:24,paddingTop:20,borderTop:'1px solid var(--line)'}}><label style={{display:'flex',gap:10,alignItems:'center'}}><input type="checkbox" checked={value===true} disabled={value===null||busy} onChange={e=>void change(e.target.checked)}/>Email me upcoming and live grail drops.</label><p style={{fontSize:12,color:'var(--muted)',marginTop:8}}>Membership, order and trade updates are always sent when needed.</p>{message&&<p role="status" style={{fontSize:12}}>{message}</p>}</div>;
}
