import {inventoryDb} from '../inventory-db';
import type {EmailType} from './templates';
let ready:Promise<void>|undefined;
export function ensureEmail(){return ready||=(async()=>{const db=inventoryDb();await db.transaction([
 db`SELECT pg_advisory_xact_lock(hashtextextended('ssc-email-schema',0))`,
 db`CREATE TABLE IF NOT EXISTS ssc_email_config(key text PRIMARY KEY,value text NOT NULL)`,
 db`INSERT INTO ssc_email_config(key,value) VALUES('started_at',now()::text) ON CONFLICT DO NOTHING`,
 db`CREATE TABLE IF NOT EXISTS ssc_email_outbox(id text PRIMARY KEY,type text NOT NULL,user_id text NOT NULL,source jsonb NOT NULL,status text NOT NULL DEFAULT 'pending',attempts integer NOT NULL DEFAULT 0,next_attempt_at timestamptz NOT NULL DEFAULT now(),lease_at timestamptz,first_attempt_at timestamptz,request jsonb,resend_id text UNIQUE,last_error text,created_at timestamptz NOT NULL DEFAULT now(),sent_at timestamptz)`,
 db`CREATE INDEX IF NOT EXISTS ssc_email_queue ON ssc_email_outbox(status,next_attempt_at)`,
 db`CREATE TABLE IF NOT EXISTS ssc_email_preferences(user_id text PRIMARY KEY,grails boolean NOT NULL DEFAULT false,updated_at timestamptz NOT NULL DEFAULT now())`,
 db`CREATE TABLE IF NOT EXISTS ssc_email_delivery(event_id text PRIMARY KEY,email_id text NOT NULL,event_type text NOT NULL,occurred_at timestamptz NOT NULL,received_at timestamptz NOT NULL DEFAULT now())`,
 db`CREATE TABLE IF NOT EXISTS ssc_email_suppression(address text PRIMARY KEY,reason text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`,
 db`CREATE TABLE IF NOT EXISTS ssc_email_attempts(id bigserial PRIMARY KEY,notification_id text NOT NULL REFERENCES ssc_email_outbox(id),attempt integer NOT NULL,result text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`,
 ]);})().catch(e=>{ready=undefined;throw e;});}
export async function enqueueEmail(id:string,type:EmailType,userId:string,source:Record<string,unknown>){await ensureEmail();await inventoryDb()`INSERT INTO ssc_email_outbox(id,type,user_id,source) VALUES(${id},${type},${userId},${JSON.stringify(source)}::jsonb) ON CONFLICT(id) DO NOTHING`;}
export async function emailPreference(userId:string){await ensureEmail();const rows=await inventoryDb()`SELECT grails FROM ssc_email_preferences WHERE user_id=${userId}`;return rows[0]?.grails===true;}
export async function setEmailPreference(userId:string,enabled:boolean){await ensureEmail();await inventoryDb()`INSERT INTO ssc_email_preferences(user_id,grails) VALUES(${userId},${enabled}) ON CONFLICT(user_id) DO UPDATE SET grails=excluded.grails,updated_at=now()`;}
