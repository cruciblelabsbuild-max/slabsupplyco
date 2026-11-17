type PriceRecord={retail:number;member:number};
export function demonstratedSavings(card:PriceRecord):number|null {
 return Number.isFinite(card.retail)&&Number.isFinite(card.member)&&card.retail>0&&card.member>=0?Math.round((card.retail-card.member)*100):null;
}
export function compareCatalogCards(a:PriceRecord,b:PriceRecord,sort:string){
 if(sort==="low")return a.member-b.member;
 if(sort==="high")return b.member-a.member;
 if(sort==="savings"){
  const first=demonstratedSavings(a),second=demonstratedSavings(b);
  return first===null?second===null?0:1:second===null?-1:second-first;
 }
 return 0;
}
