import assert from "node:assert/strict";
import test from "node:test";
import {enrollmentArrivalUrl,memberArrivalDestination} from "../lib/member-arrival";
test("both enrollment identity outcomes pass through arrival before their destination",()=>{
 assert.equal(enrollmentArrivalUrl(),"/member-entry?checkout=continue");
 assert.equal(enrollmentArrivalUrl("trades"),"/member-entry?checkout=continue&next=trades");
 assert.equal(memberArrivalDestination({enrollment:true,activeMembership:true}),"/account");
 assert.equal(memberArrivalDestination({enrollment:true,activeMembership:true,next:"trades"}),"/trade-ins#start-trade");
 assert.equal(memberArrivalDestination({enrollment:true,activeMembership:false}),"/join?checkout=continue");
 assert.equal(memberArrivalDestination({enrollment:true,activeMembership:false,next:"trades"}),"/join?checkout=continue&next=trades");
});
test("ordinary sign-in keeps its destination and accepts no external redirect",()=>{
 assert.equal(memberArrivalDestination({enrollment:false,activeMembership:false}),"/account");
 assert.equal(memberArrivalDestination({enrollment:false,activeMembership:false,next:"trades"}),"/trade-ins#start-trade");
 assert.equal(memberArrivalDestination({enrollment:true,activeMembership:false,next:"https://other.test"}),"/join?checkout=continue");
 assert.equal(enrollmentArrivalUrl("https://other.test"),"/member-entry?checkout=continue");
});
