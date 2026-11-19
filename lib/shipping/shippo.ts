import {ShippingBlocked,type ShippingProvider,type ShippingAddress,type ShipmentPlan,type CreatedShipment,type TrackingEvent} from "./types";
// Shippo wire objects are validated at each boundary; raw provider errors and contacts are never logged.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Json=Record<string,any>;
const money=(v:unknown)=>{if(typeof v!=="string"||!/^\d+(?:\.\d{1,2})?$/.test(v))throw new ShippingBlocked("provider_response","Shippo returned an invalid USD amount.");return Math.round(Number(v)*100);};
const id=(v:unknown):v is string=>typeof v==="string"&&/^[a-f0-9]{20,40}$/i.test(v);
export const shippoAddress=(a:ShippingAddress)=>({name:a.name,street1:a.line1,street2:a.line2||"",city:a.city,state:a.region,zip:a.postalCode,country:a.country,...(a.email?{email:a.email}:{}),...(a.phone?{phone:a.phone}:{})});
export function safeShippoLabelUrl(value:string){const u=new URL(value);if(u.protocol!=="https:"||u.username||u.password||!(["shippo-delivery.s3.amazonaws.com","deliver.goshippo.com","api.goshippo.com"].includes(u.hostname)||/^shippo-delivery(?:-[a-z0-9-]+)?\.s3(?:\.[a-z0-9-]+)?\.amazonaws\.com$/.test(u.hostname)))throw new ShippingBlocked("label_url","Shippo label host is not approved.");return u.href;}
export function safeCarrierUrl(value:string){const u=new URL(value);if(u.protocol!=="https:"||u.username||u.password||!['usps.com','ups.com','fedex.com','goshippo.com'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))throw new ShippingBlocked("tracking_url","Carrier tracking URL is not approved.");return u.href;}
export class ShippoProvider implements ShippingProvider{
 name="shippo";environment:"sandbox"|"production";readonly mode:"test"|"live";private token:string;private quoted=new Map<string,{shipmentId:string;rate:Json}>();
 constructor(private env:Record<string,string|undefined>=process.env,private transport:typeof fetch=fetch){
  if(!["test","live"].includes(env.SHIPPO_MODE||""))throw new ShippingBlocked("provider_unavailable","Configure Shippo with an explicit test or live mode.");
  this.mode=env.SHIPPO_MODE as "test"|"live";this.environment=this.mode==="test"?"sandbox":"production";
  this.token=env[this.mode==="test"?"SHIPPO_TEST_TOKEN":"SHIPPO_LIVE_TOKEN"]||"";
  if(env.SHIPPO_AUTOMATION_ENABLED!=="true"||!this.token.startsWith(this.mode==="test"?"shippo_test_":"shippo_live_"))throw new ShippingBlocked("provider_unavailable","Shippo credentials for the selected mode are unavailable.");
  if(this.mode==="live"&&(env.SHIPPO_LIVE_ACTIVATION_APPROVED!=="true"||env.SHIPPO_PRODUCTION_READY!=="true"))throw new ShippingBlocked("production_review","Live label purchases require separate activation approval and production verification.");
 }
 async request(path:string,method="GET",body?:unknown):Promise<Json>{
  if(!path.startsWith("/")||path.startsWith("//"))throw new ShippingBlocked("provider_path","Invalid Shippo API path.");
  let r:Response;try{r=await this.transport("https://api.goshippo.com"+path,{method,headers:{Authorization:`ShippoToken ${this.token}`,"Content-Type":"application/json","Shippo-API-Version":"2018-02-08"},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(25000),redirect:"error"});}catch{throw new ShippingBlocked("shippo_transport","Shippo did not return a confirmed result. Reconcile the original transaction before retrying a purchase.");}
  if(!r.ok)throw new ShippingBlocked("shippo_rejected",`Shippo request rejected (HTTP ${r.status}). Review the persisted attempt before retrying.`);
  try{return await r.json() as Json;}catch{throw new ShippingBlocked("provider_response","Shippo returned an unreadable response.");}
 }
 async carrierAccounts():Promise<Json[]>{const rows:Json[]=[];let path="/carrier_accounts/?service_levels=true&results=100";for(let page=0;page<20;page++){const d=await this.request(path);if(!Array.isArray(d.results))throw new ShippingBlocked("carrier","Shippo carrier accounts were unreadable.");rows.push(...d.results);if(!d.next)return rows;const next=new URL(d.next);if(next.origin!=="https://api.goshippo.com"||!next.pathname.startsWith("/carrier_accounts/"))throw new ShippingBlocked("carrier","Invalid carrier pagination.");path=next.pathname+next.search;}throw new ShippingBlocked("carrier","Carrier pagination requires review.");}
 async validateAddress(a:ShippingAddress){if(![a.name,a.line1,a.city,a.region,a.postalCode,a.country].every(v=>typeof v==="string"&&v.trim())||a.country!=="US")return false;const d=await this.request("/addresses/","POST",{...shippoAddress(a),validate:true});return d.validation_results?.is_valid===true;}
 async rate(plan:ShipmentPlan){
  if(plan.packages.length!==1)throw new ShippingBlocked("package_limit","Multi-package collections require shipping review.");
  if(this.mode==="live"&&!plan.insurance?.verified)throw new ShippingBlocked("coverage","Collectible coverage has not been verified.");
  const carriers=(this.env.SHIPPO_CARRIERS||"usps,ups,fedex").split(",").map(v=>v.trim().toLowerCase());
  const services=(this.env.SHIPPO_SERVICES||"usps_ground_advantage,usps_priority,ups_ground,fedex_ground,fedex_home_delivery").split(",").map(v=>v.trim());
  const accounts=(await this.carrierAccounts()).filter(a=>a.active===true&&a.test===(this.mode==="test")&&carriers.includes(a.carrier)&&id(a.object_id)&&a.service_levels?.some((s:Json)=>services.includes(s.token)));
  if(!accounts.length)throw new ShippingBlocked("carrier","No connected carrier account supports the configured services in this mode.");
  const extra:Json={...(plan.signature?{signature_confirmation:"STANDARD"}:{}),...(plan.insurance?.provider==="xcover"?{insurance:{amount:(plan.approvedValueCents/100).toFixed(2),currency:"USD",content:"Graded Pokemon trading cards"}}:{})};
  const shipment=await this.request("/shipments/","POST",{address_from:shippoAddress({...plan.from,email:this.env.SHIPPO_BUSINESS_EMAIL||plan.from.email,phone:this.env.SHIPPO_BUSINESS_PHONE||plan.from.phone}),address_to:shippoAddress({...plan.to,email:undefined}),parcels:plan.packages.map(p=>({length:String(p.lengthIn),width:String(p.widthIn),height:String(p.heightIn),distance_unit:"in",weight:String(Math.ceil(p.weightLb*1600)/100),mass_unit:"oz"})),carrier_accounts:accounts.map(a=>a.object_id),extra,metadata:plan.reference,async:false});
  if(!id(shipment.object_id)||shipment.test!==(this.mode==="test"))throw new ShippingBlocked("environment","Shippo shipment did not confirm the selected mode.");
  const ranks=new Map(carriers.map((c,i)=>[c,i]));
  const rates=(Array.isArray(shipment.rates)?shipment.rates:[]).filter((r:Json)=>id(r.object_id)&&r.currency==="USD"&&services.includes(r.servicelevel?.token)&&accounts.some(a=>a.object_id===r.carrier_account&&a.carrier===String(r.provider).toLowerCase())).filter((r:Json)=>money(r.amount)<=plan.maxRateCents).sort((a:Json,b:Json)=>(ranks.get(String(a.provider).toLowerCase())!-ranks.get(String(b.provider).toLowerCase())!)||money(a.amount)-money(b.amount));
  if(!rates.length)throw new ShippingBlocked("service","No eligible tracked rate is available within the configured service and cost limits.");
  const rate=rates[0];plan.quote={shipmentId:shipment.object_id,rateId:rate.object_id,carrier:rate.provider,service:rate.servicelevel.token,estimatedCostCents:money(rate.amount)};this.quoted.set(plan.reference,{shipmentId:shipment.object_id,rate});return money(rate.amount);
 }
 async create(plan:ShipmentPlan):Promise<CreatedShipment>{
  const quote=this.quoted.get(plan.reference);if(!quote)throw new ShippingBlocked("rate","A validated shipping quote is required before purchase.");
  // Never retry this POST automatically. The durable job lease precedes this call.
  const d=await this.request("/transactions/","POST",{rate:quote.rate.object_id,label_file_type:"PDF_4x6",metadata:plan.reference,async:false});
  if(!id(d.object_id))throw new ShippingBlocked("provider_response","Shippo did not return a transaction ID; reconcile before any replacement.");
  return this.transaction(d,{shipmentId:quote.shipmentId,trackingNumbers:[],chargedCents:money(quote.rate.amount),currency:"USD",provider:"shippo",reference:plan.reference,mode:this.mode,rateId:quote.rate.object_id,carrier:quote.rate.provider,service:quote.rate.servicelevel.token});
 }
 private transaction(d:Json,previous:CreatedShipment):CreatedShipment{
  if(previous.reference&&d.metadata!==previous.reference||previous.transactionId&&d.object_id!==previous.transactionId)throw new ShippingBlocked("provider_response","Shippo transaction identity does not match this shipment.");
  if(d.test!==(this.mode==="test"))throw new ShippingBlocked("environment","Shippo transaction mode did not match this shipment.");
  const success=d.status==="SUCCESS";
  if(success&&(!d.tracking_number||!d.label_url))throw new ShippingBlocked("provider_response","Successful Shippo transaction is missing label or tracking details.");
  const r=d.rate&&typeof d.rate==="object"?d.rate:null;
  if(r?.currency&&r.currency!=="USD")throw new ShippingBlocked("provider_response","Shippo transaction currency is unsupported.");
  return {...previous,transactionId:d.object_id,test:d.test,status:d.status,createdAt:d.object_created,...(r?.amount?{chargedCents:money(r.amount)}:{}),...(success?{labelUrl:safeShippoLabelUrl(d.label_url),trackingNumbers:[String(d.tracking_number)],...(d.tracking_url_provider?{trackingUrl:safeCarrierUrl(d.tracking_url_provider)}:{})}:{})};
 }
 async readTransaction(result:CreatedShipment){if(result.provider!=="shippo"||result.mode!==this.mode||!id(result.transactionId))throw new ShippingBlocked("environment","Recover the original Shippo transaction in its original mode.");const d=await this.request(`/transactions/${result.transactionId}/`);return this.transaction(d,result);}
 async reconcile(result:CreatedShipment){const confirmed=await this.readTransaction(result);if(confirmed.status!=="SUCCESS")throw new ShippingBlocked(confirmed.status==="ERROR"?"transaction_failed":"provider_pending",confirmed.status==="ERROR"?"Shippo transaction failed. Review it before authorizing a new attempt.":"Shippo transaction is pending; only read-only recovery will be retried.");return confirmed;}
 async retrieveLabel(_tracking:string,result?:CreatedShipment){if(!result||result.mode!==this.mode||!result.labelUrl)throw new ShippingBlocked("label_recovery","A confirmed Shippo transaction is required for label retrieval.");const url=safeShippoLabelUrl(result.labelUrl);const r=await this.transport(url,{redirect:"error",signal:AbortSignal.timeout(20000)});if(!r.ok)throw new ShippingBlocked("label_recovery","The Shippo label PDF is unavailable.");if(Number(r.headers.get("content-length"))>3*1024*1024)throw new ShippingBlocked("label_recovery","Label exceeds the document size limit.");const bytes=new Uint8Array(await r.arrayBuffer());if(bytes.length>3*1024*1024||Buffer.from(bytes).subarray(0,5).toString()!=="%PDF-")throw new ShippingBlocked("label_recovery","Shippo returned an invalid label PDF.");return bytes;}
 async track(tracking:string,carrier="usps"):Promise<TrackingEvent[]>{if(!['usps','ups','fedex'].includes(carrier.toLowerCase()))throw new ShippingBlocked("carrier","Unsupported tracking carrier.");const d=await this.request(`/tracks/${carrier.toLowerCase()}/${encodeURIComponent(tracking)}/`);return [...(d.tracking_history||[]),...(d.tracking_status?[d.tracking_status]:[])].map((e:Json)=>{const at=new Date(e.status_date);if(!Number.isFinite(at.getTime()))throw new ShippingBlocked("tracking","Invalid Shippo tracking date.");return {tracking,code:e.status==="DELIVERED"?"D":e.status==="TRANSIT"?"I":e.status==="RETURNED"?"R":"P",description:String(e.status_details||e.status),date:at.toISOString().slice(0,10).replaceAll("-",""),time:at.toISOString().slice(11,19).replaceAll(":","")};});}
 async void(transactionId:string){if(!id(transactionId))throw new ShippingBlocked("refund","A Shippo transaction ID is required.");const d=await this.request("/refunds/","POST",{transaction:transactionId,async:false});if(d.test!==(this.mode==="test")||d.status!=="SUCCESS")throw new ShippingBlocked("refund_pending","Label refund is not confirmed; reconcile it before purchasing any replacement.");}
}
