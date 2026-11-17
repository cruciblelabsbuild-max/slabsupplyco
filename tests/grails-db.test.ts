import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {grailCycle} from '../lib/grail-cycle';
import {grailCandidates,grailInterests,saveGrailInterest} from '../lib/grail-data';
import {inventoryDb} from '../lib/inventory-db';
test('grail interests support multiple candidates per range, explicit price updates, suggestions and withdrawal without duplicating votes',{skip:process.env.RUN_GRAIL_DB_TESTS!=='1'},async()=>{
 const user='grail_ui_qa_'+randomUUID(),month=grailCycle().next;
 try{
  const candidates=await grailCandidates(month),sameRange=candidates.filter(c=>c.tier==='1000-plus').slice(0,2);assert.equal(sameRange.length,2);
  const first=await saveGrailInterest(user,{month,candidateId:sameRange[0].id,active:true,maxPrice:'1250.50'});
  await saveGrailInterest(user,{month,candidateId:sameRange[1].id,active:true,maxPrice:''});
  assert.equal((await grailInterests(user,month)).filter(i=>i.active).length,2);assert.equal(first.max_cents,125050);
  const updated=await saveGrailInterest(user,{month,candidateId:sameRange[0].id,active:true,maxPrice:'1300'});assert.equal(updated.key,first.key);assert.equal(updated.max_cents,130000);assert.equal((await grailInterests(user,month)).length,2);
  await saveGrailInterest(user,{month,candidateId:sameRange[0].id,active:false});assert.equal((await grailInterests(user,month)).find(i=>i.key===first.key)?.active,false);
  const details={name:'QA card',set:'QA set',grade:'PSA 9'},suggestion=await saveGrailInterest(user,{month,details,active:true,maxPrice:'150'});assert.equal(suggestion.max_cents,15000);
  await saveGrailInterest(user,{month,details,active:true,maxPrice:'175'});assert.equal((await grailInterests(user,month)).filter(i=>i.details).length,1);
  await saveGrailInterest(user,{month,details,active:false});assert.equal((await grailInterests(user,month)).filter(i=>i.active).length,1);
 }finally{await inventoryDb()`DELETE FROM ssc_grail_interests WHERE user_id=${user}`;}
});
