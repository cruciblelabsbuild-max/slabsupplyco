"use client";
import {useEffect,useRef} from "react";
import {usePathname} from "next/navigation";
export default function PageMotion(){
 const path=usePathname();const previous=useRef(path);
 useEffect(()=>{if(previous.current===path)return;previous.current=path;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const target=path==="/"?document.querySelector('.hero'):document.querySelector('#club-main,main');if(target instanceof HTMLElement){const animation=target.animate([{opacity:0.5,transform:"translateY(8px)"},{opacity:1,transform:"translateY(0)"}],{duration:260,easing:"cubic-bezier(.2,.7,.3,1)"});return()=>animation.cancel();}},[path]);
 return null;
}
