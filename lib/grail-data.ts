import {createHash} from "node:crypto";
import {inventoryDb} from "./inventory-db";
import {defaultGrailCandidates,grailFeatures,type GrailTier} from "./grail-selection";
import {memberSelection} from "./member-selection";
import {inventorySnapshot} from "./inventory";
import {grailCycle,maxInterestPrice,suggestionDetails} from "./grail-cycle";
export type GrailCandidate={id:string;name:string;set:string;grade:string;image:string;tier:GrailTier};
export type GrailInterest={key:string;candidate_id:string|null;details:{name:string;set:string;grade:string}|null;max_cents:number|null;active:boolean};
export type ConfirmedGrail={year?:string;slug:string;name:string;set:string;grade:string;image:string;retail:number;member:number;stock:string};
export type GrailDrop={month:string;starts_at:string|null;ends_at:string|null;cards:ConfirmedGrail[];preview_only?:boolean};
let initialized:Promise<void>|undefined;
export function ensureGrails(){return initialized ||= (async()=>{
 const db=inventoryDb();
 await db.transaction([
  db`CREATE TABLE IF NOT EXISTS ssc_grail_candidates (id text PRIMARY KEY,name text NOT NULL,card_set text NOT NULL,grade text NOT NULL,image text NOT NULL,target_month text,active boolean NOT NULL DEFAULT true)`,
  db`ALTER TABLE ssc_grail_candidates ADD COLUMN IF NOT EXISTS budget_tier text NOT NULL DEFAULT '1000-plus'`,
  db`ALTER TABLE ssc_grail_candidates ADD COLUMN IF NOT EXISTS sort_position integer NOT NULL DEFAULT 0`,
  db`CREATE TABLE IF NOT EXISTS ssc_grail_interests (user_id text NOT NULL,target_month text NOT NULL,key text NOT NULL,candidate_id text REFERENCES ssc_grail_candidates(id),details jsonb,max_cents integer CHECK(max_cents>0),active boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,target_month,key),CHECK ((candidate_id IS NOT NULL AND details IS NULL) OR (candidate_id IS NULL AND details IS NOT NULL)))`,
  db`CREATE INDEX IF NOT EXISTS ssc_grail_interest_month ON ssc_grail_interests(target_month,candidate_id) WHERE active`,
  db`CREATE TABLE IF NOT EXISTS ssc_grail_drops (month text PRIMARY KEY,starts_at timestamptz NOT NULL,ends_at timestamptz,CHECK(ends_at IS NULL OR ends_at>starts_at))`,
  db`CREATE TABLE IF NOT EXISTS ssc_grail_drop_cards (drop_month text NOT NULL REFERENCES ssc_grail_drops(month),inventory_slug text NOT NULL,position integer NOT NULL DEFAULT 0,source_verified boolean NOT NULL DEFAULT false,PRIMARY KEY(drop_month,inventory_slug))`,
 ]);
 // Preserve existing interests and operator activation choices when extending defaults.
 await db.transaction(defaultGrailCandidates.map((c,index)=>db`INSERT INTO ssc_grail_candidates(id,name,card_set,grade,image,budget_tier,sort_position) VALUES(${c.id},${c.name},${c.set},${c.grade},${c.image},${c.tier},${index}) ON CONFLICT(id) DO NOTHING`));
})().catch(error=>{initialized=undefined;throw error;});}
export async function grailCandidates(month:string):Promise<GrailCandidate[]>{
 await ensureGrails();const rows=await inventoryDb()`SELECT id,name,card_set AS "set",grade,image,budget_tier AS tier FROM ssc_grail_candidates WHERE active AND (target_month=${month} OR (target_month IS NULL AND NOT EXISTS(SELECT 1 FROM ssc_grail_candidates WHERE target_month=${month}))) ORDER BY sort_position,id`;
 return rows as GrailCandidate[];
}
export async function grailInterests(userId:string,month:string):Promise<GrailInterest[]>{
 await ensureGrails();return await inventoryDb()`SELECT key,candidate_id,details,max_cents,active FROM ssc_grail_interests WHERE user_id=${userId} AND target_month=${month} ORDER BY created_at` as GrailInterest[];
}
export async function confirmedGrailDrop(month:string):Promise<GrailDrop|null>{
 await ensureGrails();const db=inventoryDb();
 const drops=await db`SELECT month,starts_at::text,ends_at::text FROM ssc_grail_drops WHERE month>=${month} ORDER BY month LIMIT 1`;
 const featured=grailFeatures(month);
 const preview=featured.length?{month,starts_at:null,ends_at:null,preview_only:true,cards:featured}:null;
 if(!drops.length||preview&&drops[0].month!==month)return preview;
 const row=drops[0];const entries=await db`SELECT inventory_slug FROM ssc_grail_drop_cards WHERE drop_month=${row.month} AND source_verified ORDER BY position,inventory_slug`;
 if(!entries.length)return preview;
 const stock=await inventorySnapshot();
 const cards=entries.flatMap(entry=>{const card=memberSelection.find(c=>c.slug===entry.inventory_slug),item=stock.find(c=>c.slug===entry.inventory_slug);return card&&item?[{...card,stock:item.status}]:[];});
 return cards.length?{month:row.month,starts_at:new Date(row.starts_at).toISOString(),ends_at:row.ends_at?new Date(row.ends_at).toISOString():null,cards}:preview;
}
export async function saveGrailInterest(userId:string,body:Record<string,unknown>,now=new Date()){
 const month=grailCycle(now).next;
 if(body.month!==month)throw Error("The next drop month has changed. Refresh this page to continue.");
 if(typeof body.active!=="boolean")throw Error("Choose whether to save or withdraw this interest.");
 await ensureGrails();const db=inventoryDb();
 let candidateId:string|null=null,details:ReturnType<typeof suggestionDetails>|null=null,key:string;
 if(typeof body.candidateId==="string"){
  if(!(await grailCandidates(month)).some(c=>c.id===body.candidateId))throw Error("This candidate has changed. Refresh this page to continue.");
  candidateId=body.candidateId;key="candidate:"+candidateId;
 }else{details=suggestionDetails(body.details);key="suggestion:"+createHash("sha256").update(JSON.stringify(Object.values(details).map(v=>v.normalize("NFKC").toLowerCase()))).digest("hex");}
 const max=maxInterestPrice(body.maxPrice);
 if(!body.active){await db`UPDATE ssc_grail_interests SET active=false,updated_at=now() WHERE user_id=${userId} AND target_month=${month} AND key=${key}`;}
 else{
  // Serialize per-member saves so the suggestion limit cannot be raced.
  await db.transaction([
   db`SELECT pg_advisory_xact_lock(hashtextextended(${"grail:"+userId},0))`,
   db`INSERT INTO ssc_grail_interests(user_id,target_month,key,candidate_id,details,max_cents) SELECT ${userId},${month},${key},${candidateId},${details?JSON.stringify(details):null}::jsonb,${max} WHERE ${candidateId!==null} OR EXISTS(SELECT 1 FROM ssc_grail_interests WHERE user_id=${userId} AND target_month=${month} AND key=${key}) OR (SELECT count(*) FROM ssc_grail_interests WHERE user_id=${userId} AND target_month=${month} AND candidate_id IS NULL)<30 ON CONFLICT(user_id,target_month,key) DO UPDATE SET active=true,max_cents=excluded.max_cents,updated_at=now()`,
  ]);
  const saved=await db`SELECT key FROM ssc_grail_interests WHERE user_id=${userId} AND target_month=${month} AND key=${key} AND active`;
  if(!saved.length)throw Error("You’ve reached 30 suggestions for this month. Update an existing suggestion instead.");
 }
 return {key,candidate_id:candidateId,details,max_cents:max,active:body.active} satisfies GrailInterest;
}
