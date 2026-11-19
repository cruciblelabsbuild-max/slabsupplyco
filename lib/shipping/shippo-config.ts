import {ShippingBlocked,type ShippingAddress,type ShippingConfig,type PackingProfile} from "./types";

/** Preliminary estimation presets, deliberately not represented as physical measurements. */
export const estimatedShippoProfiles:PackingProfile[]=[
 {id:"estimated-1-2",capacity:2,lengthIn:10,widthIn:8,heightIn:5,emptyWeightLb:8/16,slabWeightLb:3/16,serviceCode:"tracked",measurementRecord:"PRELIMINARY ESTIMATE; NOT PHYSICALLY VERIFIED",measuredAt:""},
 {id:"estimated-3-5",capacity:5,lengthIn:10,widthIn:8,heightIn:6,emptyWeightLb:8/16,slabWeightLb:3/16,serviceCode:"tracked",measurementRecord:"PRELIMINARY ESTIMATE; NOT PHYSICALLY VERIFIED",measuredAt:""},
 {id:"estimated-6-10",capacity:10,lengthIn:12,widthIn:10,heightIn:8,emptyWeightLb:8/16,slabWeightLb:3/16,serviceCode:"tracked",measurementRecord:"PRELIMINARY ESTIMATE; NOT PHYSICALLY VERIFIED",measuredAt:""},
];
const integer=(v:string|undefined,fallback:number)=>{const n=v===undefined?fallback:Number(v);if(!Number.isSafeInteger(n)||n<0)throw new ShippingBlocked("configuration","Shipping limits must be nonnegative whole cents or counts.");return n;};
export function shippoShippingConfig(env:Record<string,string|undefined>=process.env):ShippingConfig{
 if(!["test","live"].includes(env.SHIPPO_MODE||""))throw new ShippingBlocked("environment","Configure an explicit Shippo test or live mode.");
 const address=(key:string):ShippingAddress=>{let a:ShippingAddress;try{a=JSON.parse(env[key]||env.SHIPPO_COMPANY_ADDRESS||"null");}catch{throw new ShippingBlocked("configuration","Configure the business shipping address server-side.");}if(!a||![a.name,a.line1,a.city,a.region,a.postalCode,a.country].every(v=>typeof v==="string"&&v.trim())||a.country!=="US")throw new ShippingBlocked("configuration","Configure the complete US business shipping address server-side.");return {...a,...(env.SHIPPO_BUSINESS_EMAIL?{email:env.SHIPPO_BUSINESS_EMAIL}:{}),...(env.SHIPPO_BUSINESS_PHONE?{phone:env.SHIPPO_BUSINESS_PHONE}:{})};};
 const company=address("SHIPPO_FULFILLMENT_ADDRESS"),receiving=address("SHIPPO_RECEIVING_ADDRESS");
 let profiles:PackingProfile[];try{profiles=env.SHIPPO_PACKING_PROFILES?JSON.parse(env.SHIPPO_PACKING_PROFILES):estimatedShippoProfiles.map(p=>({...p}));}catch{throw new ShippingBlocked("packing_profiles","Packing profiles could not be read.");}
 if(!Array.isArray(profiles)||!profiles.length||profiles.some(p=>!p.id||!Number.isSafeInteger(p.capacity)||p.capacity<1||![p.lengthIn,p.widthIn,p.heightIn,p.emptyWeightLb,p.slabWeightLb].every(v=>Number.isFinite(v)&&v>0)))throw new ShippingBlocked("packing_profiles","Packing profiles require positive dimensions, weights and slab capacities.");
 const measured=env.SHIPPO_PACKAGING_VERIFIED==="true"&&!!env.SHIPPO_PACKING_PROFILES&&profiles.every(p=>p.measurementRecord&&!p.measurementRecord.includes("ESTIMATE")&&Number.isFinite(Date.parse(p.measuredAt)));
 const verified=env.SHIPPO_COLLECTIBLES_COVERAGE_VERIFIED==="true"&&!!env.SHIPPO_COVERAGE_REFERENCE;
 if(env.SHIPPO_MODE==="live"&&(!measured||!verified||env.SHIPPO_BUSINESS_ADDRESS_VERIFIED!=="true"))throw new ShippingBlocked("production_review","Production requires measured packaging, verified collectible coverage and a confirmed business address.");
 const max=integer(env.SHIPPO_MAX_VALUE_CENTS,100000),signature=integer(env.SHIPPO_SIGNATURE_THRESHOLD_CENTS,50000);
 return {company,receiving,fulfillment:company,profiles,estimated:!measured,maxAutomaticCards:integer(env.SHIPPO_MAX_AUTOMATIC_CARDS,10),maxPackages:1,maxRateCents:integer(env.SHIPPO_MAX_RATE_CENTS,5000),insuranceProvider:env.SHIPPO_INSURANCE_PROVIDER==="external"?"external":"xcover",coverage:{verified,reference:env.SHIPPO_COVERAGE_REFERENCE||"TEST ONLY — COLLECTIBLE COVERAGE NOT VERIFIED",method:"third_party",perPackageMaxCents:max,shipmentMaxCents:max,signatureThresholdCents:signature,approvedServices:["tracked"]}};
}
