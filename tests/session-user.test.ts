import assert from "node:assert/strict";
import test from "node:test";
import { ClerkAPIResponseError } from "@clerk/backend/errors";
import { resolveSessionUser } from "../lib/session-user";
const apiError=(status:number)=>new ClerkAPIResponseError("User lookup failed",{status,data:[{code:"resource_not_found",message:"User not found"}]});
test("a deleted user with a lingering session resolves as signed out",async()=>{
 assert.equal(await resolveSessionUser(async()=>{throw apiError(404);}),null);
});
test("existing and signed-out sessions keep their normal result",async()=>{
 const user={id:"user_existing",firstName:"Member"};
 assert.equal(await resolveSessionUser(async()=>user),user);
 assert.equal(await resolveSessionUser(async()=>null),null);
});
test("lookup failures are not mistaken for deleted accounts",async()=>{
 for(const error of [apiError(429),apiError(500),new Error("Network unavailable"),{status:404}]){
  await assert.rejects(resolveSessionUser(async()=>{throw error;}),actual=>actual===error);
 }
});
