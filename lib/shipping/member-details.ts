import {TradeError,text} from '../trades/model';
import {usShippingCountry} from '../us-shipping';
import type {ShippingAddress} from './types';
export function memberShippingAddress(value:unknown):ShippingAddress {
 if(!value||typeof value!=='object'||Array.isArray(value))throw new TradeError('Add your shipping address.');
 const a=value as Record<string,unknown>;
 const country=usShippingCountry(a.country);
 if(!country)throw new TradeError('Shipping is available within the United States only.');
 const fields=[['name','full name',100],['line1','street address',160],['city','city',100],['region','state',100],['postalCode','ZIP code',24]] as const;
 const result:Record<string,string>={country,line2:text(a.line2??'',160)};
 for(const [key,label,max] of fields){if(typeof a[key]!=='string'||!a[key].trim())throw new TradeError(`Add your ${label}.`);result[key]=text(a[key],max,true);}
 return result as ShippingAddress;
}
