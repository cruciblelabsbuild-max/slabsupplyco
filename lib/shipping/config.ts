import {usShippingCountry} from "../us-shipping";
import {shippoShippingConfig} from "./shippo-config";
import {ShippingBlocked,type ShippingAddress,type ShippingConfig,type PackingProfile,type ShipmentPlan} from "./types";
export function completeAddress(value:unknown):value is ShippingAddress{if(!value||typeof value!=="object")return false;const a=value as ShippingAddress;return [a.name,a.line1,a.city,a.region,a.postalCode,a.country].every(v=>typeof v==="string"&&v.trim().length>0&&v.length<160)&&/^[A-Z]{2}$/.test(a.country);}
export function profileAddressDetails(value:unknown):ShippingAddress|null{if(!value||typeof value!=="object")return null;const s=(value as {shipping?:Record<string,unknown>}).shipping;if(!s)return null;const country=usShippingCountry(s.country);if(!country)return null;const str=(v:unknown)=>typeof v==='string'?v.trim():'';return {name:str(s.recipient),line1:str(s.line1),line2:str(s.line2),city:str(s.city),region:str(s.region),postalCode:str(s.postalCode),country};}
export function profileAddress(value:unknown):ShippingAddress|null{const address=profileAddressDetails(value);return completeAddress(address)?address:null;}
export function shippingConfig(env:Record<string,string|undefined>=process.env):ShippingConfig{
 if(env.SHIPPING_PROVIDER==="shippo"||env.SHIPPO_MODE)return shippoShippingConfig(env);
 let c:ShippingConfig;try{c=JSON.parse(env.TRADE_SHIPPING_CONFIG||"null");}catch{throw new ShippingBlocked("configuration","Shipping configuration is unavailable.");}
 if(!c||!completeAddress(c.company)||!Array.isArray(c.profiles)||!c.profiles.length)throw new ShippingBlocked("configuration","Add the verified receiving address and measured packing profiles.");
 const positive=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)&&v>0;
 if(c.profiles.some(p=>!p.id||!Number.isSafeInteger(p.capacity)||p.capacity<1||![p.lengthIn,p.widthIn,p.heightIn,p.emptyWeightLb,p.slabWeightLb].every(positive)||!p.serviceCode||!p.measurementRecord||!Number.isFinite(Date.parse(p.measuredAt))))throw new ShippingBlocked("packing_profiles","Measured packing profiles must include a measurement record, date, dimensions and weight.");
 if(!c.coverage?.verified||c.coverage.method!=="third_party"||!c.coverage.reference||![c.coverage.perPackageMaxCents,c.coverage.shipmentMaxCents,c.maxRateCents].every(v=>Number.isSafeInteger(v)&&v>0)||!Number.isSafeInteger(c.coverage.signatureThresholdCents)||c.coverage.signatureThresholdCents<0||!Array.isArray(c.coverage.approvedServices)||!c.coverage.approvedServices.length||!Number.isSafeInteger(c.maxPackages)||c.maxPackages<1||c.maxPackages>12)throw new ShippingBlocked("coverage","Verified collectible coverage, service limits and a rate cap are required. Declared value is not coverage.");
 return c;
}
export function packingPlan(count:number,valueCents:number,from:ShippingAddress,to:ShippingAddress,reference:string,c:ShippingConfig):ShipmentPlan{
 if(!Number.isSafeInteger(count)||count<1||count>100000)throw new ShippingBlocked("card_count","Confirm the number of cards included in this shipment.");
 if(!completeAddress(from)||!completeAddress(to))throw new ShippingBlocked("address","Confirm the shipping address.");
 if(from.country!=="US"||to.country!=="US")throw new ShippingBlocked("service","This route requires a separately approved service and address-validation strategy.");
 // Each package could contain the entire approved value. Never invent an even value allocation.
 if(!Number.isSafeInteger(valueCents)||valueCents<1||valueCents>c.coverage.shipmentMaxCents||valueCents>c.coverage.perPackageMaxCents)throw new ShippingBlocked("coverage_limit","The approved value exceeds verified collectible coverage. Review this shipment.");
 if(c.maxAutomaticCards&&count>c.maxAutomaticCards)throw new ShippingBlocked("package_limit","This collection requires a shipping exception review.");
 const profiles=[...c.profiles].sort((a,b)=>a.capacity-b.capacity);const largest=profiles.at(-1)!;let remaining=count;const packages:ShipmentPlan["packages"]=[];let service:string|null=null;
 while(remaining){const p:PackingProfile=profiles.find(item=>item.capacity>=remaining)||largest,n=Math.min(p.capacity,remaining);if(!c.coverage.approvedServices.includes(p.serviceCode)||service&&service!==p.serviceCode)throw new ShippingBlocked("service","Packing profiles do not share an approved shipping service.");service=p.serviceCode;packages.push({count:n,lengthIn:p.lengthIn,widthIn:p.widthIn,heightIn:p.heightIn,weightLb:c.estimated?Math.ceil((p.emptyWeightLb+p.slabWeightLb*n)*16)/16:Math.ceil(Number(((p.emptyWeightLb+p.slabWeightLb*n)*100).toFixed(6)))/100,profileId:p.id});remaining-=n;if(packages.length>c.maxPackages)throw new ShippingBlocked("package_limit","This collection requires a shipping exception review.");}
 return {reference,shipper:c.company,from,to,packages,serviceCode:service!,approvedValueCents:valueCents,signature:valueCents>=c.coverage.signatureThresholdCents,coverageReference:c.coverage.reference,maxRateCents:c.maxRateCents,...(c.insuranceProvider?{insurance:{provider:c.insuranceProvider,amountCents:valueCents,verified:c.coverage.verified,reference:c.coverage.reference}}:{})};
}
