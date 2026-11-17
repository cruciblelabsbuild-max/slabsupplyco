export type ShippingAddress={name:string;line1:string;line2?:string;city:string;region:string;postalCode:string;country:string;phone?:string};
export type PackingProfile={id:string;capacity:number;lengthIn:number;widthIn:number;heightIn:number;emptyWeightLb:number;slabWeightLb:number;serviceCode:string;measurementRecord:string;measuredAt:string};
export type ShippingConfig={company:ShippingAddress;profiles:PackingProfile[];coverage:{verified:boolean;reference:string;method:"third_party";perPackageMaxCents:number;shipmentMaxCents:number;signatureThresholdCents:number;approvedServices:string[]};maxRateCents:number;maxPackages:number};
export type PlannedPackage={count:number;lengthIn:number;widthIn:number;heightIn:number;weightLb:number;profileId:string};
export type ShipmentPlan={reference:string;shipper:ShippingAddress;from:ShippingAddress;to:ShippingAddress;packages:PlannedPackage[];serviceCode:string;approvedValueCents:number;signature:boolean;coverageReference:string;maxRateCents:number};
export type CreatedShipment={shipmentId:string;trackingNumbers:string[];chargedCents:number;currency:string};
export type TrackingEvent={tracking:string;code:string;description:string;date:string;time:string};
export type ShippingProvider={name:string;environment:"sandbox"|"production";validateAddress:(address:ShippingAddress)=>Promise<boolean>;rate:(plan:ShipmentPlan)=>Promise<number>;create:(plan:ShipmentPlan)=>Promise<CreatedShipment>;retrieveLabel:(tracking:string)=>Promise<Uint8Array>;track:(tracking:string)=>Promise<TrackingEvent[]>;void:(shipmentId:string)=>Promise<void>};
export class ShippingBlocked extends Error{constructor(public code:string,message:string){super(message);}}
export type ShippingView={status:string;adminStatus:string;reason:string;needsCount:boolean;needsAddress:boolean;approved:boolean;direction:"inbound"|"return";cardCount:number|null;address:ShippingAddress|null};
