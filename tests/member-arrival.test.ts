import assert from "node:assert/strict";
import test from "node:test";
import {enrollmentArrivalUrl,memberArrivalDestination} from "../lib/member-arrival";
test("enrollment returns to checkout until membership is paid",()=>{
 assert.equal(enrollmentArrivalUrl(),"/member-entry?checkout=continue");
 assert.equal(enrollmentArrivalUrl("trades"),"/member-entry?checkout=continue&next=trades");
 assert.equal(memberArrivalDestination({enrollment:true,activeMembership:true}),"/account");
 assert.equal(memberArrivalDestination({enrollment:true,activeMembership:true,next:"trades"}),"/trade-ins#start-trade");
 assert.equal(memberArrivalDestination({enrollment:true,activeMembership:false}),"/join?checkout=continue");
 assert.equal(memberArrivalDestination({enrollment:true,activeMembership:false,next:"trades"}),"/join?checkout=continue&next=trades");
});
test("ordinary sign-in keeps its destination and accepts no external redirect",()=>{
 assert.equal(memberArrivalDestination({enrollment:false,activeMembership:false}),"/join?checkout=continue");
 assert.equal(memberArrivalDestination({enrollment:false,activeMembership:false,next:"trades"}),"/join?checkout=continue&next=trades");
 assert.equal(memberArrivalDestination({enrollment:true,activeMembership:false,next:"https://other.test"}),"/join?checkout=continue");
 assert.equal(enrollmentArrivalUrl("https://other.test"),"/member-entry?checkout=continue");
});

test("only paid sign-ins proceed to member destinations",()=>{assert.equal(memberArrivalDestination({enrollment:false,activeMembership:true}),"/account");assert.equal(memberArrivalDestination({enrollment:false,activeMembership:true,next:"trades"}),"/trade-ins#start-trade");});

test("unpaid Google returns retain card and bag checkout intent without member destinations",()=>{
 for(const enrollment of [true,false]){
  assert.equal(memberArrivalDestination({enrollment,activeMembership:false,card:"bag"}),"/join?checkout=continue&bag=1");
  assert.equal(memberArrivalDestination({enrollment,activeMembership:false,card:"selection-aerodactyl"}),"/join?checkout=continue&card=selection-aerodactyl");
  assert.equal(memberArrivalDestination({enrollment,activeMembership:false,card:"https://other.test"}),"/join?checkout=continue");
 }
});
