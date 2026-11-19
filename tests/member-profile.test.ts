import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyProfile, parseMemberProfile } from "../lib/member-profile";
test("profile accepts collecting preferences without an address and strips unknown fields",()=>{
 assert.deepEqual(parseMemberProfile({...emptyProfile,favoritePokemon:" Gengar ",userId:"someone-else",isMember:true}),{...emptyProfile,favoritePokemon:"Gengar"});
});
test("shipping requires a usable name, street and city with a US country default; optional fields stay optional",()=>{
 const shipping={...emptyProfile.shipping,recipient:"Avery",line1:"123 Example St",city:"New York",country:"United States"};
 assert.equal(parseMemberProfile({...emptyProfile,shipping}).shipping.recipient,"Avery");
 assert.throws(()=>parseMemberProfile({...emptyProfile,shipping:{...shipping,recipient:""}}));
 assert.throws(()=>parseMemberProfile({...emptyProfile,shipping:{...shipping,line1:"x".repeat(161)}}));
 assert.throws(()=>parseMemberProfile({...emptyProfile,favoritePokemon:"bad\nvalue"}));
});
test("profile writes reject foreign origins and signed-out requests",async()=>{
 const { POST }=await import("../app/api/account/profile/route");
 const key=process.env.CLERK_SECRET_KEY;delete process.env.CLERK_SECRET_KEY;
 try {
 assert.equal((await POST(new Request("https://www.slabsupply.co/api/account/profile",{method:"POST",headers:{origin:"https://other.test"}}))).status,403);
 assert.equal((await POST(new Request("https://www.slabsupply.co/api/account/profile",{method:"POST",headers:{origin:"https://www.slabsupply.co"}}))).status,401);
 }finally {if(key!==undefined)process.env.CLERK_SECRET_KEY=key;}
});
test("collecting preferences accept desired cards and preserve older profiles",()=>{
 assert.equal(parseMemberProfile({...emptyProfile,collectingFocus:" Neo-era holos "}).collectingFocus,"Neo-era holos");
 const {collectingFocus,...olderProfile}=emptyProfile;
 assert.equal(parseMemberProfile(olderProfile).collectingFocus,"");
 assert.throws(()=>parseMemberProfile({...emptyProfile,collectingFocus:"x".repeat(161)}));
 assert.equal(parseMemberProfile({...emptyProfile,collectingFocus:"Gengar\nNeo-era holos"}).collectingFocus,"Gengar\nNeo-era holos");
 assert.throws(()=>parseMemberProfile({...emptyProfile,collectingFocus:"bad\u0000value"}));
});
