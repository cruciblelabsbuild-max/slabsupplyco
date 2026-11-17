import {catalog} from "./catalog";
export const grailTiers = [
  {id:"1000-plus",label:"$1,000+"},
  {id:"around-500",label:"Around $500"},
  {id:"200-under",label:"$200 and under"},
] as const;
export type GrailTier=typeof grailTiers[number]["id"];
const photographed=(slug:string,tier:GrailTier)=>{
 const card=catalog.find(c=>c.slug===slug)!;
 return {id:card.slug,name:card.name,set:card.set,grade:card.grade,image:card.image,tier};
};
// Additional candidate art: images.pokemontcg.io/swsh7/{215,180}_hires.png and swsh8/245_hires.png.
// Budget bands describe sourcing targets, not quoted offers or checkout prices.
export const defaultGrailCandidates=[
 photographed("151-charizard","1000-plus"),
 {id:"umbreon-vmax-215-psa9",name:"Umbreon VMAX #215",set:"Evolving Skies",grade:"PSA 9",image:"/cards/grails/umbreon-vmax-215.png",tier:"1000-plus"},
 photographed("grey-felt-pikachu","1000-plus"),
 {id:"espeon-v-180-psa10",name:"Espeon V #180",set:"Evolving Skies",grade:"PSA 10",image:"/cards/grails/espeon-v-180.png",tier:"around-500"},
 {id:"dragonite-v-192-psa9",name:"Dragonite V #192",set:"Evolving Skies",grade:"PSA 9",image:"/cards/grails/dragonite-v-192.webp",tier:"around-500"},
 {id:"charmander-168-psa10",name:"Charmander #168",set:"Scarlet & Violet—151",grade:"PSA 10",image:"/cards/grails/charmander-168.webp",tier:"around-500"},
 {id:"celebi-v-245-psa9",name:"Celebi V #245",set:"Fusion Strike",grade:"PSA 9",image:"/cards/grails/celebi-v-245.png",tier:"200-under"},
 {id:"charmander-168-psa9",name:"Charmander #168",set:"Scarlet & Violet—151",grade:"PSA 9",image:"/cards/grails/charmander-168.webp",tier:"200-under"},
 {id:"suicune-v-gg38-psa9",name:"Suicune V #GG38",set:"Crown Zenith · Galarian Gallery",grade:"PSA 9",image:"/cards/grails/suicune-v-gg38.webp",tier:"200-under"},
] satisfies {id:string;name:string;set:string;grade:string;image:string;tier:GrailTier}[];
// User-approved November review selection. These are editorial previews, not
// acquired stock: no reservation, release timestamp or availability is invented.
export const monthlyGrailFeatures={
 "2026-11":["neo-genesis-lugia","jungle-snorlax","evolutions-charizard"],
} as Record<string,string[]>;
export function grailFeatures(month:string){
 return (monthlyGrailFeatures[month]||[]).flatMap(slug=>{const card=catalog.find(c=>c.slug===slug);return card?[{...card,stock:"preview"}]:[];});
}
