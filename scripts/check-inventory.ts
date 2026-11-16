import nextEnv from '@next/env';import {randomUUID} from 'node:crypto';import assert from 'node:assert/strict';import {ensureInventory,inventoryDb} from '../lib/inventory-db';
nextEnv.loadEnvConfig(process.cwd());await ensureInventory();const db=inventoryDb();const prefix='qa-'+randomUUID();const slugs=[0,1,2].map(i=>prefix+'-'+i),ids=[randomUUID(),randomUUID(),randomUUID()];
const reserve=(id:string,user:string,cards:string[],hash='same')=>db`SELECT ssc_reserve(${id}::uuid,${user},${hash},${cards}::text[],'{}'::jsonb,2000000000) AS checkout`;
try{
 await db`INSERT INTO ssc_inventory(slug) SELECT unnest(${slugs}::text[])`;
 const results=await Promise.allSettled([reserve(ids[0],prefix+'a',[slugs[0],slugs[1]]),reserve(ids[1],prefix+'b',[slugs[1],slugs[2]])]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);
 const winner=results.findIndex(r=>r.status==='fulfilled'),loser=1-winner;const owned=winner===0?[slugs[0],slugs[1]]:[slugs[1],slugs[2]];
 const rows=await db`SELECT * FROM ssc_inventory WHERE slug=ANY(${slugs}::text[])`;assert.equal(rows.filter(r=>r.status==='reserved').length,2);assert.equal(rows.filter(r=>r.status==='available').length,1);
 const repeated=await reserve(ids[2],prefix+(winner===0?'a':'b'),owned);assert.equal(repeated[0].checkout.id,ids[winner]);
 await assert.rejects(()=>reserve(ids[2],prefix+(winner===0?'a':'b'),[], 'different'));
 await db`SELECT ssc_settle(${ids[winner]}::uuid,'cs_qa_paid',true)`;await db`SELECT ssc_settle(${ids[winner]}::uuid,'cs_qa_paid',false)`;
 assert.equal((await db`SELECT count(*)::int AS n FROM ssc_inventory WHERE slug=ANY(${owned}::text[]) AND status='sold'`)[0].n,2);
 await assert.rejects(()=>reserve(ids[loser],prefix+'retry',owned));
 const free=slugs.filter(s=>!owned.includes(s));await reserve(ids[loser],prefix+'release',free);await db`SELECT ssc_settle(${ids[loser]}::uuid,'cs_qa_expired',false)`;await db`SELECT ssc_settle(${ids[loser]}::uuid,'cs_qa_expired',false)`;
 assert.equal((await db`SELECT status FROM ssc_inventory WHERE slug=${free[0]}`)[0].status,'available');
 await assert.rejects(()=>db`SELECT ssc_settle(${ids[loser]}::uuid,'cs_qa_other',true)`);
 console.log('PASS: concurrent overlapping bags, atomic reserve, idempotency, paid replay, sold protection, expiration release, session identity');
}finally{await db`DELETE FROM ssc_inventory WHERE slug=ANY(${slugs}::text[])`;await db`DELETE FROM ssc_checkouts WHERE id=ANY(${ids}::uuid[])`;}
