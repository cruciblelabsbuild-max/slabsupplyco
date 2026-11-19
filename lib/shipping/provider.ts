import {ShippoProvider} from "./shippo";
import {UpsProvider} from "./ups";
import {ShippingBlocked,type CreatedShipment,type ShippingProvider} from "./types";
export function shippingProvider(env:Record<string,string|undefined>=process.env):ShippingProvider{
 if(env.SHIPPING_PROVIDER&&env.SHIPPING_PROVIDER!=="shippo")throw new ShippingBlocked("provider_unavailable","New shipments must use Shippo.");
 return new ShippoProvider(env);
}
/** Historical UPS records retain their original provider; they are never repurchased through Shippo. */
export function providerForRecord(result:CreatedShipment):ShippingProvider{return result.provider==="shippo"?shippingProvider():new UpsProvider();}
