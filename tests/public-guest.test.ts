import test from "node:test";
import assert from "node:assert/strict";
import {isPublicGuestRequest} from "../lib/public-guest";
const request=(path:string,headers:Record<string,string>={},method="GET")=>new Request(`https://www.slabsupply.co${path}`,{method,headers:{"sec-fetch-dest":"document",accept:"text/html",...headers}});
test("public document requests render without a development-browser handshake",()=>{
 for(const path of ["/","/promise","/membership","/join","/trade-ins","/shop","/drops"]){
  assert.equal(isPublicGuestRequest(request(path)),true);
  assert.equal(isPublicGuestRequest(request(path,{cookie:"analytics=example","user-agent":"GPTBot"})),true);
 }
});
test("private pages, authentication and account mutations always retain Clerk",()=>{
 for(const path of ["/account","/account/profile","/member-entry","/sign-in","/sign-up","/api/checkout","/api/trade-in","/membership/welcome"])
  assert.equal(isPublicGuestRequest(request(path)),false);
 assert.equal(isPublicGuestRequest(request("/join",{},"POST")),false);
});
test("sessions, OAuth returns and authorization headers cannot take the public guest path",()=>{
 for(const cookie of ["__session=example","__session_suffix=example","__client_uat=123","__clerk_db_jwt=example"])
  assert.equal(isPublicGuestRequest(request("/",{cookie})),false);
 for(const path of ["/?__clerk_handshake_nonce=example","/join?__clerk_db_jwt=example","/?redirect_url=example"])
  assert.equal(isPublicGuestRequest(request(path)),false);
 assert.equal(isPublicGuestRequest(request("/",{authorization:"Bearer example"})),false);
});
