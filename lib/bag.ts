import {memberSelection} from "./member-selection";
export const maxBagCards=20;
export const bagCards=memberSelection.map(({slug,name,grade,image,retail,member})=>({slug,name,grade,image,retail,member}));
export function normalizeBag(value:unknown):string[]{
 if(!Array.isArray(value))return [];
 return [...new Set(value.filter((slug):slug is string=>typeof slug==="string"&&bagCards.some(card=>card.slug===slug)))].slice(0,maxBagCards);
}
export function checkoutSlugs(value:unknown):string[]{
 if(!Array.isArray(value)||!value.length||value.length>maxBagCards||value.some(slug=>typeof slug!=="string")||new Set(value).size!==value.length)throw new Error("Please check the cards in your bag.");
 const normalized=normalizeBag(value).sort();
 if(normalized.length!==value.length)throw new Error("One of these cards is unavailable.");
 return normalized;
}
export function bagTotals(slugs:readonly string[]){
 const cards=bagCards.filter(card=>slugs.includes(card.slug));
 const retailCents=cards.reduce((sum,card)=>sum+Math.round(card.retail*100),0);
 const memberCents=cards.reduce((sum,card)=>sum+Math.round(card.member*100),0);
 return {cards,retailCents,memberCents,savingsCents:retailCents-memberCents};
}
