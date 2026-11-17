"use client";
import Link from "next/link";
import {annualMembership} from "@/lib/membership-plan";
import {createContext,useCallback,useContext,useEffect,useRef,useState,useSyncExternalStore} from "react";
import {ShoppingBag,X,Check,ArrowRight,Trash2,LockKeyhole} from "lucide-react";
import {usePathname} from "next/navigation";
import {bagTotals,maxBagCards,normalizeBag} from "../../lib/bag";
import {displayMemberMoney as money} from "../../lib/member-home-metrics";
import type {StockRecord} from "../../lib/inventory";
const storageKey="ssc_shopping_bag_v1",eventName="ssc-bag-change";
let memory="";
function snapshot(){try{return localStorage.getItem(storageKey)||memory;}catch{return memory;}}
function subscribe(callback:()=>void){window.addEventListener("storage",callback);window.addEventListener(eventName,callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener(eventName,callback);};}
function write(slugs:string[]){memory=JSON.stringify(normalizeBag(slugs));try{localStorage.setItem(storageKey,memory);}catch{}window.dispatchEvent(new Event(eventName));}
export function seedBagCard(slug:string){write([...read(),slug]);}
function read(){try{return normalizeBag(JSON.parse(snapshot()||"[]"));}catch{return [];}}
type BagContextValue={slugs:string[];add:(slug:string)=>void;remove:(slug:string)=>void;removePurchased:(slugs:string[])=>void;open:()=>void;close:()=>void;stock:StockRecord[];stockReady:boolean;refresh:()=>Promise<void>};
const BagContext=createContext<BagContextValue|null>(null);
export function useBag(){const context=useContext(BagContext);if(!context)throw new Error("Shopping bag is unavailable.");return context;}
export default function BagProvider({children}:{children:React.ReactNode}){
 const saved=useSyncExternalStore(subscribe,snapshot,()=>"");
 const slugs=(()=>{try{return normalizeBag(JSON.parse(saved||"[]"));}catch{return [];}})();
 const key=slugs.join(",");
 const [opened,setOpened]=useState(false),[message,setMessage]=useState(""),[stock,setStock]=useState<StockRecord[]>([]),[stockReady,setStockReady]=useState(false);
 const path=usePathname();
 const refresh=useCallback(async()=>{try{const response=await fetch("/api/inventory",{cache:"no-store"});if(!response.ok)throw Error();const data=await response.json() as {stock:StockRecord[]};setStock(data.stock);setStockReady(true);}catch{setStockReady(false);}},[]);
 useEffect(()=>{
  const sync=async()=>{if(document.visibilityState==="hidden")return;try{await fetch("/api/bag",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slugs:read()})});}catch{}await refresh();};
  void sync();const timer=setInterval(()=>void sync(),30000);window.addEventListener("focus",sync);return()=>{clearInterval(timer);window.removeEventListener("focus",sync);};
 },[key,path,refresh]);
 function add(slug:string){const current=read();if(current.length>=maxBagCards&&!current.includes(slug)){setMessage(`You can check out with up to ${maxBagCards} cards at a time.`);setOpened(true);return;}write([...current,slug]);setMessage("");setOpened(true);}
 function remove(slug:string){write(read().filter(value=>value!==slug));}
 return <BagContext.Provider value={{slugs,add,remove,removePurchased:values=>write(read().filter(slug=>!values.includes(slug))),open:()=>setOpened(true),close:()=>setOpened(false),stock,stockReady,refresh}}>{children}<BagDrawer opened={opened} onClose={()=>setOpened(false)} message={message}/></BagContext.Provider>;
}
export function BagTrigger({compact=false}:{compact?:boolean}){
 const bag=useBag();return <button className={`bag-trigger${compact?" bag-trigger-compact":""}`} type="button" title={compact?"Shopping bag":undefined} onClick={bag.open} aria-label={`Shopping bag, ${bag.slugs.length} ${bag.slugs.length===1?"card":"cards"}`}><ShoppingBag size={19} strokeWidth={1.5}/><span className="bag-trigger-label">Bag</span>{bag.slugs.length>0&&<b>{bag.slugs.length}</b>}</button>;
}
export function CardBagBadge({slug}:{slug:string}){
 const bag=useBag(),stock=bag.stock.find(item=>item.slug===slug);
 const own=bag.slugs.includes(slug);
 const label=stock?.status==="sold"?"Sold":stock?.status==="reserved"?"In checkout":own?"In your bag":stock?.inAnotherBag?"In a bag":null;
 return label?<span className={`card-bag-badge${own?" is-yours":""}`} title={stock?.status==="available"&&!own?"Available until checkout starts":undefined}>{own?<Check size={11}/>:stock?.status==="reserved"?<LockKeyhole size={11}/>:<ShoppingBag size={11}/>} {label}</span>:null;
}
export function AddToBag({slug}:{slug:string}){
 const bag=useBag(),stock=bag.stock.find(item=>item.slug===slug),own=bag.slugs.includes(slug);
 return <div className="card-buy-control"><button className={`button club-wide${own?" bag-added":""}`} type="button" disabled={stock?.status==="sold"||stock?.status==="reserved"} onClick={()=>own?bag.open():bag.add(slug)}>{stock?.status==="sold"?"Sold":stock?.status==="reserved"?"In checkout":own?"View bag":"Add to bag"}{own?<Check size={15}/>:<ShoppingBag size={15}/>}</button></div>;
}
export function BagItems(){
 const bag=useBag();const {cards}=bagTotals(bag.slugs);
 return <div className="bag-items">{cards.map(card=>{const stock=bag.stock.find(item=>item.slug===card.slug);return <article className="bag-item" key={card.slug}><img src={card.image} alt={card.name}/><div><Link href={`/shop/${card.slug}`} onClick={bag.close}>{card.name}</Link><span>{card.grade}</span><strong>{money(Math.round(card.member*100))}</strong>{stock?.status==="sold"&&<small role="status">This card has sold. Remove it to continue.</small>}{stock?.status==="reserved"&&<small>In checkout</small>}</div><button type="button" onClick={()=>bag.remove(card.slug)} aria-label={`Remove ${card.name} from bag`}><Trash2 size={15}/></button></article>;})}</div>;
}
export function BagSummary({membership=false}:{membership?:boolean}){
 const bag=useBag(),totals=bagTotals(bag.slugs);
 return <dl className="bag-totals"><div><dt>Retail total</dt><dd><s>{money(totals.retailCents)}</s></dd></div><div className="bag-member-total"><dt>Member total</dt><dd>{money(totals.memberCents)}</dd></div><div className="bag-savings"><dt>Your savings</dt><dd>{money(totals.savingsCents)}</dd></div>{membership&&<><div><dt>Annual membership</dt><dd>{annualMembership.display}</dd></div><div className="bag-total"><dt>Today’s total</dt><dd>{money(totals.memberCents+annualMembership.amountCents)}</dd></div></>}</dl>;
}
function BagDrawer({opened,onClose,message}:{opened:boolean;onClose:()=>void;message:string}){
 const ref=useRef<HTMLDialogElement>(null);const bag=useBag();
 useEffect(()=>{const dialog=ref.current;if(!dialog)return;if(opened&&!dialog.open)dialog.showModal();if(!opened&&dialog.open)dialog.close();},[opened]);
 return <dialog ref={ref} className="shopping-bag-dialog" aria-labelledby="bag-title" onCancel={onClose} onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)onClose();}}}><header><div><p className="eyebrow">Your selection</p><h2 id="bag-title">Shopping bag <span>{bag.slugs.length}</span></h2></div><button type="button" aria-label="Close shopping bag" onClick={onClose}><X size={21}/></button></header>{message&&<p className="bag-message" role="status">{message}</p>}{bag.slugs.length?<><div className="bag-scroll"><BagItems/></div><footer><BagSummary/><p>Each slab is one of a kind. Cards are reserved when checkout starts.</p><Link className="button club-wide" href="/checkout?bag=1" onClick={onClose}>Checkout<ArrowRight size={16}/></Link><button className="bag-keep-browsing" type="button" onClick={onClose}>Keep browsing</button></footer></>:<div className="bag-empty"><ShoppingBag size={36} strokeWidth={1}/><h3>Room for your next find.</h3><Link className="button" href="/shop" onClick={onClose}>Browse member deals<ArrowRight size={15}/></Link></div>}</dialog>;
}
