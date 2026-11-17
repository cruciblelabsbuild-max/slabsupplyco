"use client";
import {useEffect,useState} from "react";
import {useBag} from "../club/BagProvider";
import {grailDropSummary} from "../../lib/grail-presentation";
import type {GrailDrop} from "../../lib/grail-data";
export default function HomeGrailStatus({drop,now,unavailable=false}:{drop:GrailDrop|null;now:string;unavailable?:boolean}){
 const [clock,setClock]=useState(now);const bag=useBag();
 useEffect(()=>{const timer=setInterval(()=>setClock(new Date().toISOString()),15000);return()=>clearInterval(timer);},[]);
 return <p>{grailDropSummary(drop,new Date(clock),unavailable,bag.stock).message}</p>;
}
