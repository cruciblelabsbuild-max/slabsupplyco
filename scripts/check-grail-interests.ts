import nextEnv from '@next/env';import {randomUUID} from 'node:crypto';import assert from 'node:assert/strict';
import {ensureGrails,grailCandidates,grailInterests,saveGrailInterest,confirmedGrailDrop} from '../lib/grail-data';import {inventoryDb} from '../lib/inventory-db';import {grailCycle} from '../lib/grail-cycle';import {grailFeatures,grailTiers} from '../lib/grail-selection';
nextEnv.loadEnvConfig(process.cwd());await ensureGrails();const cycle=grailCycle(),db=inventoryDb(),user='qa-grail-'+randomUUID();
try{
 const candidates=await grailCandidates(cycle.next);assert.ok(candidates.length);for(const tier of grailTiers)assert.ok(candidates.filter(c=>c.tier===tier.id).length>=2);const card=candidates[0];const body={month:cycle.next,candidateId:card.id,active:true,maxPrice:'500.25'};
 await Promise.all(Array.from({length:8},()=>saveGrailInterest(user,body)));let rows=await grailInterests(user,cycle.next);assert.equal(rows.length,1);assert.equal(rows[0].max_cents,50025);assert.equal(rows[0].active,true);
 assert.equal((await grailInterests(user+'other',cycle.next)).length,0);
 await saveGrailInterest(user,{...body,maxPrice:'650'});assert.equal((await grailInterests(user,cycle.next))[0].max_cents,65000);
 await saveGrailInterest(user,{...body,active:false});assert.equal((await grailInterests(user,cycle.next))[0].active,false);
 await saveGrailInterest(user,body);assert.equal((await grailInterests(user,cycle.next)).length,1);
 await assert.rejects(()=>saveGrailInterest(user,{...body,month:cycle.current}));await assert.rejects(()=>saveGrailInterest(user,{...body,candidateId:'not-a-candidate'}));
 const suggestion={month:cycle.next,active:true,details:{name:'QA card #1',set:'QA set',grade:'PSA 9'},maxPrice:'100'};
 await saveGrailInterest(user,suggestion);await saveGrailInterest(user,{...suggestion,details:{name:'qa card #1',set:'qa set',grade:'psa 9'},maxPrice:'150'});
 rows=await grailInterests(user,cycle.next);assert.equal(rows.length,2);assert.equal(rows.find(r=>r.details)?.max_cents,15000);
 await saveGrailInterest(user,{...suggestion,active:false});assert.equal((await grailInterests(user,cycle.next)).filter(r=>r.active).length,1);
 assert.equal((await grailInterests(user,cycle.current)).length,0);const drop=await confirmedGrailDrop(cycle.current);if(drop?.preview_only){assert.equal(drop.cards.length,grailFeatures(cycle.current).length);assert.equal(drop.starts_at,null);assert.ok(drop.cards.every(c=>c.stock==="preview"));}
 console.log('PASS: duplicate/concurrent saves, price updates, withdrawal/reactivation, suggestion deduplication, user isolation, stale-month rejection, unknown candidate rejection, three budget bands and monthly editorial previews.');
}finally{await db`DELETE FROM ssc_grail_interests WHERE user_id=${user}`;}
