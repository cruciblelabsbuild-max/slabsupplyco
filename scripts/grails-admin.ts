/** Operator-only tooling; no public admin endpoint or client-side credentials. */
import nextEnv from "@next/env";
import {readFile} from "node:fs/promises";
import {ensureGrails} from "../lib/grail-data";
import {inventoryDb,ensureInventory} from "../lib/inventory-db";
import {memberSelection} from "../lib/member-selection";
import {grailCycle} from "../lib/grail-cycle";
nextEnv.loadEnvConfig(process.cwd());
const [action,month,file]=process.argv.slice(2);
if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month||"")||!["review","candidates","schedule"].includes(action||""))throw Error("Usage: npx tsx scripts/grails-admin.ts review YYYY-MM | candidates YYYY-MM file.json | schedule YYYY-MM file.json");
await ensureGrails();const db=inventoryDb();
if(action==="review"){
 const candidates=await db`SELECT c.id,c.name,c.card_set,c.grade,count(i.user_id)::int AS interested_members,count(i.max_cents)::int AS price_preferences,percentile_cont(0.5) WITHIN GROUP(ORDER BY i.max_cents) AS median_max_cents,min(i.max_cents) AS lowest_max_cents,max(i.max_cents) AS highest_max_cents,max(i.updated_at) AS last_updated FROM ssc_grail_candidates c JOIN ssc_grail_interests i ON i.candidate_id=c.id AND i.active AND i.target_month=${month} GROUP BY c.id ORDER BY interested_members DESC,c.id`;
 const suggestions=await db`SELECT details,count(*)::int AS interested_members,count(max_cents)::int AS price_preferences,percentile_cont(0.5) WITHIN GROUP(ORDER BY max_cents) AS median_max_cents,max(updated_at) AS last_updated FROM ssc_grail_interests WHERE target_month=${month} AND candidate_id IS NULL AND active GROUP BY details ORDER BY interested_members DESC`;
 console.log(JSON.stringify({month,candidates,suggestions},null,2));
}else if(action==="candidates"){
 if(!file)throw Error("Provide a candidate JSON file.");
 const cards=JSON.parse(await readFile(file,"utf8")) as {id:string;name:string;set:string;grade:string;image:string}[];
 if(!Array.isArray(cards)||!cards.length||cards.length>6)throw Error("Choose one to six candidates.");
 for(const c of cards){if(!/^[a-z0-9-]{1,80}$/.test(c.id)||![c.name,c.set,c.grade].every(v=>typeof v==="string"&&v.trim()&&v.length<=120)||!/^\/cards\/[a-zA-Z0-9/-]+\.webp$/.test(c.image))throw Error("Each candidate needs an ID, card name, set, target grade and local card image.");await readFile("public"+c.image);}
 if(new Set(cards.map(c=>c.id)).size!==cards.length)throw Error("Candidate IDs must be unique.");
 await db.transaction([db`UPDATE ssc_grail_candidates SET active=false WHERE target_month=${month}`,...cards.map(c=>db`INSERT INTO ssc_grail_candidates(id,name,card_set,grade,image,target_month) VALUES(${month+"-"+c.id},${c.name.trim()},${c.set.trim()},${c.grade.trim()},${c.image},${month}) ON CONFLICT(id) DO UPDATE SET name=excluded.name,card_set=excluded.card_set,grade=excluded.grade,image=excluded.image,active=true`)]);
 console.log(`Saved ${cards.length} sourcing candidates for ${month}. No stock, prices or orders created.`);
}else{
 if(!file)throw Error("Provide a verified drop JSON file.");
 const drop=JSON.parse(await readFile(file,"utf8")) as {startsAt:string;endsAt:string;sourceVerified:boolean;inventorySlugs:string[]};
 if(drop.sourceVerified!==true||!Array.isArray(drop.inventorySlugs)||!drop.inventorySlugs.length||drop.inventorySlugs.length>6||new Set(drop.inventorySlugs).size!==drop.inventorySlugs.length)throw Error("Confirm actual sourced inventory and choose one to six unique inventorySlugs.");
 if(!/([+-]\d\d:\d\d|Z)$/.test(drop.startsAt)||!Number.isFinite(Date.parse(drop.startsAt))||!/([+-]\d\d:\d\d|Z)$/.test(drop.endsAt)||!Number.isFinite(Date.parse(drop.endsAt))||Date.parse(drop.endsAt)<=Date.parse(drop.startsAt)||grailCycle(new Date(drop.startsAt)).current!==month)throw Error("Use timezone-qualified release/end timestamps, with release in the target month.");
 if(drop.inventorySlugs.some(slug=>!memberSelection.some(c=>c.slug===slug)))throw Error("Confirmed grails must use existing purchasable inventory. Register actual sourced cards in the product inventory first; never substitute a candidate or invented price.");
 await ensureInventory();
 await db.transaction([db`INSERT INTO ssc_grail_drops(month,starts_at,ends_at) VALUES(${month},${drop.startsAt}::timestamptz,${drop.endsAt}::timestamptz) ON CONFLICT(month) DO UPDATE SET starts_at=excluded.starts_at,ends_at=excluded.ends_at`,db`DELETE FROM ssc_grail_drop_cards WHERE drop_month=${month}`,...drop.inventorySlugs.map((slug,index)=>db`INSERT INTO ssc_grail_drop_cards(drop_month,inventory_slug,position,source_verified) VALUES(${month},${slug},${index},true)`)]);
 console.log(`Scheduled ${drop.inventorySlugs.length} verified inventory cards for ${month}. Inventory quantities and checkout behavior are unchanged.`);
}
