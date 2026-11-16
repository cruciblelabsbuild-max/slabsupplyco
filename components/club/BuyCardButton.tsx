"use client";
import {AddToBag} from "./BagProvider";
export default function BuyCardButton({slug}:{slug:string;hasAccess:boolean;autoContinue?:boolean}){return <AddToBag slug={slug}/>;}
