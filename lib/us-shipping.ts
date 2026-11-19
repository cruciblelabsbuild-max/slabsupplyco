/** Accept legacy US names and browser autofill values without allowing foreign destinations. */
export function usShippingCountry(value:unknown):"US"|null {
 if(value===undefined||value===null||value==='')return 'US';
 if(typeof value!=='string')return null;
 return ['', 'US','USA','UNITEDSTATES','UNITEDSTATESOFAMERICA'].includes(value.trim().toUpperCase().replace(/[\s.]/g,''))?'US':null;
}
