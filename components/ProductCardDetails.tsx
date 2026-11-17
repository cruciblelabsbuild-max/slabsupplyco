import Link from "next/link";
import {dollars} from "../lib/catalog";
import CardPricing from "./CardPricing";
type Product={name:string;year?:string;set:string;grade:string;retail:number;member:number};
// Both member deals and confirmed grails use the existing stored product prices.
export default function ProductCardDetails({card,href,heading="h2"}:{card:Product;href?:string;heading?:"h2"|"h3"}){
 const Heading=heading;
 return <><p className="eyebrow product-card-meta">{[card.year,card.set,card.grade].filter(Boolean).join(" · ")}</p><Heading>{href?<Link href={href}>{card.name}</Link>:card.name}</Heading><CardPricing retail={dollars(card.retail)} member={dollars(card.member)} savings={dollars(card.retail-card.member)}/></>;
}
