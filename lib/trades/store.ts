import {visibleShippingDocument} from "../shipping/mode";
import {defaultOfferInput,carrierTrackingUrl} from "./policies";
import {shippingView} from "../shipping/service";
import {randomUUID} from "node:crypto";
import {inventoryDb} from "../inventory-db";
import {tradeSchema} from "../../db/trades/schema";
import {memberTrades} from "../member-trades";
import {maxSubmissionFiles,validateTradeFile,safeTrackingUrl} from "./files";
import {TradeError,validId,text,cents,parseOffer,parseSubmission,pendingCredit,terminalStates,type Trade,type TradeFile,type Label,type Offer,type Submission} from "./model";
let initialized:Promise<void>|undefined;
export function ensureTrades(){return initialized ||= (async()=>{const db=inventoryDb();await db.transaction([db`SELECT pg_advisory_xact_lock(hashtextextended('ssc-trades-schema',0))`,...tradeSchema.split("-- statement").map(sql=>db.query(sql))]);})().catch(error=>{initialized=undefined;throw error;});}
export async function importLegacyTrades(userId:string,metadata:Record<string,unknown>){
 await ensureTrades();const db=inventoryDb();const legacy=memberTrades(metadata.tradeRequests);if(!legacy.length)return;
 await db.transaction(legacy.map(trade=>{
 const state=({submitted:"submitted",reviewing:"reviewing",quoted:"legacy_quoted",declined:"declined",completed:"legacy_completed"} as const)[trade.status];
 const submission:Submission={mode:"quick",cards:trade.cards.map((c,i)=>({id:`legacy-${i}`,description:[c.cardName,c.set,c.year].filter(Boolean).join(" · "),grader:c.grader,grade:c.grade,notes:[c.condition,c.certification?`Certification: ${c.certification}`:""].filter(Boolean).join(" · ")})),description:trade.goal,cardCount:trade.cards.length,notes:trade.preference==="cash"?"Original preference: cash.":trade.preference==="either"?"Original preference: cash or credit.":"Original preference: store credit.",legacy:trade};
 return db`INSERT INTO ssc_trades_v3(id,user_id,state,submission,created_at,updated_at) VALUES(${trade.id}::uuid,${userId},${state},${JSON.stringify(submission)}::jsonb,${trade.createdAt}::timestamptz,${trade.createdAt}::timestamptz) ON CONFLICT(id) DO NOTHING`;
 }));
}
export async function ensureDraft(id:string,userId:string){
 if(!validId(id))throw new TradeError("Start a new trade submission.");await ensureTrades();const db=inventoryDb();
 await db.transaction([db`SELECT pg_advisory_xact_lock(hashtextextended(${"trade-draft:"+userId},0))`,db`INSERT INTO ssc_trades_v3(id,user_id) SELECT ${id}::uuid,${userId} WHERE (SELECT count(*) FROM ssc_trades_v3 WHERE user_id=${userId} AND state='draft')<5 ON CONFLICT(id) DO NOTHING`]);
 const row=(await db`SELECT user_id FROM ssc_trades_v3 WHERE id=${id}::uuid`)[0];if(!row||row.user_id!==userId)throw new TradeError("This draft could not be opened. Review your existing drafts first.");return id;
}
export async function listTrades(userId?:string,tradeId?:string):Promise<Trade[]>{
 await ensureTrades();const db=inventoryDb();
 const rows=tradeId?(userId?await db`SELECT * FROM ssc_trades_v3 WHERE id=${tradeId}::uuid AND user_id=${userId}`:await db`SELECT * FROM ssc_trades_v3 WHERE id=${tradeId}::uuid`):userId?await db`SELECT * FROM ssc_trades_v3 WHERE user_id=${userId} ORDER BY created_at DESC`:await db`SELECT * FROM ssc_trades_v3 ORDER BY updated_at DESC`;
 if(!rows.length)return [];const ids=rows.map(r=>r.id);
 const [offers,files,labels,events,credits,shipping]=await Promise.all([
  db`SELECT trade_id,data FROM ssc_trade_offers WHERE trade_id=ANY(${ids}::uuid[]) ORDER BY version`,
  db`SELECT id,trade_id,name,mime,size,kind,card_key FROM ssc_trade_files WHERE trade_id=ANY(${ids}::uuid[]) ORDER BY created_at`,
  db`SELECT trade_id,data FROM ssc_trade_labels WHERE trade_id=ANY(${ids}::uuid[]) ORDER BY (data->>'createdAt')`,
  db`SELECT id,trade_id,actor,action,created_at,data->>'note' AS note FROM ssc_trade_events WHERE trade_id=ANY(${ids}::uuid[]) ORDER BY id`,
  db`SELECT id,trade_id FROM ssc_trade_credit WHERE trade_id=ANY(${ids}::uuid[])`,
  db`SELECT id,trade_id,offer_id,direction,approved_at,status,reason_code,reason,card_count,address FROM ssc_trade_shipping WHERE trade_id=ANY(${ids}::uuid[]) ORDER BY updated_at DESC`,
 ]);
 const trades=rows.map(row=>({id:row.id,userId:row.user_id,reference:`TRADE-${String(row.id).slice(-8).toUpperCase()}`,state:row.state,revision:row.revision,createdAt:new Date(row.created_at).toISOString(),updatedAt:new Date(row.updated_at).toISOString(),submission:row.submission,currentOfferId:row.current_offer_id,acceptedOfferId:row.accepted_offer_id,offers:offers.filter(o=>o.trade_id===row.id).map(o=>o.data) as Offer[],files:files.filter(f=>f.trade_id===row.id).map(f=>({id:f.id,name:f.name,mime:f.mime,size:f.size,kind:f.kind,cardKey:f.card_key})) as TradeFile[],labels:labels.filter(l=>l.trade_id===row.id&&visibleShippingDocument(l.data)).map(l=>l.data) as Label[],events:events.filter(e=>e.trade_id===row.id).map(e=>({id:Number(e.id),action:e.action,actor:e.actor,at:new Date(e.created_at).toISOString(),note:e.note||""})),creditTransactionId:credits.find(c=>c.trade_id===row.id)?.id??null})) as Trade[];
 return trades.map(trade=>({...trade,shipping:shippingView(trade,shipping.find(job=>job.trade_id===trade.id&&job.offer_id===trade.currentOfferId&&job.direction===(trade.state.startsWith("return")?"return":"inbound")),!userId)}));
}
export async function getTrade(id:string,userId?:string){if(!validId(id))throw new TradeError("Trade not found.");const trade=(await listTrades(userId,id)).find(t=>t.id===id);if(!trade)throw new TradeError("Trade not found.");return trade;}
export async function tradeCreditBalance(userId:string){await ensureTrades();const rows=await inventoryDb()`SELECT coalesce(sum(amount_cents),0)::text AS balance FROM ssc_trade_credit WHERE user_id=${userId} AND status='posted' AND currency='usd'`;const value=Number(rows[0].balance);if(!Number.isSafeInteger(value)||value<0)throw Error("Credit ledger unavailable.");return value;}
export function tradeSummary(trades:Trade[]){const active=trades.filter(t=>t.state!=="draft"&&!terminalStates.has(t.state));return {active,pendingCents:active.reduce((sum,t)=>sum+pendingCredit(t),0)};}
export async function applyTradeCommand(trade:Trade,actor:string,owner:string|null,action:string,data:Record<string,unknown>,commandId:string){
 if(!validId(commandId))throw new TradeError("Please retry this action.");await ensureTrades();
 try{await inventoryDb()`SELECT ssc_trade_apply(${trade.id}::uuid,${owner},${actor},${action},${JSON.stringify(data)}::jsonb,${commandId}::uuid,${trade.revision})`;}
 catch(error){const message=error instanceof Error?error.message:"";if(/Trade not found|Not allowed|Request already|trade changed|already been|cannot be|before|no longer current|Accept the|expired|stage|revision|required|offer version|Offer version|Label must|return workflow|requested first|current trade/i.test(message))throw new TradeError(message.slice(0,220));throw error;}
 return getTrade(trade.id,owner??undefined);
}
export async function submitTrade(userId:string,body:Record<string,unknown>){
 if(!validId(body.requestId))throw new TradeError("Start a new trade submission.");await ensureDraft(body.requestId,userId);const trade=await getTrade(body.requestId,userId);
 if(trade.state!=="draft")return trade;
 const submission=parseSubmission(body),inputFiles=trade.files.filter(f=>!["label","return_label"].includes(f.kind));
 if(!inputFiles.length&&!submission.cards.some(c=>c.description)&&submission.description.trim().length<15)throw new TradeError("Add a card description, slab photo, or collection list.");
 if(submission.mode==="quick"&&submission.cards.some(c=>!c.description&&!inputFiles.some(f=>f.cardKey===c.id&&f.kind==="front")))throw new TradeError("Add a description or front photo for each card.");
 if(submission.mode==="quick"&&inputFiles.some(f=>f.cardKey&&!submission.cards.some(c=>c.id===f.cardKey)))throw new TradeError("A photo belongs to a removed card. Remove it before submitting.");
 return applyTradeCommand(trade,userId,userId,"submit",{submission},body.requestId);
}
export async function uploadTradeFile(trade:Trade,file:{name:string;bytes:Uint8Array},kind:TradeFile["kind"],cardKey:string|null,admin=false){
 const label=kind==="label"||kind==="return_label";
 if(label&&!admin)throw new TradeError("Only the trade desk can attach shipping labels.");
 if(!label&&!['draft','more_info'].includes(trade.state))throw new TradeError("Files can only be added to a draft or an open information request.");
 if(label&&!['awaiting_label','awaiting_shipment','return_requested','return_label'].includes(trade.state))throw new TradeError("Accept the relevant offer or request a return first.");
 if(cardKey&&!validId(cardKey))throw new TradeError("Please check the card linked to this file.");
 const validated=validateTradeFile(file.name,file.bytes,label);
 if((kind==="front"||kind==="back")&&!validated.mime.startsWith('image/'))throw new TradeError("Use a slab photo for front and back images.");
 const id=randomUUID(),db=inventoryDb();
 const encoded=Buffer.from(file.bytes).toString("base64");
 const results=await db.transaction([db`SELECT id FROM ssc_trades_v3 WHERE id=${trade.id}::uuid FOR UPDATE`,db`INSERT INTO ssc_trade_files(id,trade_id,name,mime,size,kind,card_key,contents) SELECT ${id}::uuid,${trade.id}::uuid,${validated.name},${validated.mime},${file.bytes.length},${kind},${cardKey},decode(${encoded},'base64') WHERE (SELECT count(*) FROM ssc_trade_files WHERE trade_id=${trade.id}::uuid AND (kind IN ('label','return_label'))=${label})<${label?12:maxSubmissionFiles} AND (SELECT state FROM ssc_trades_v3 WHERE id=${trade.id}::uuid)=ANY(${label?["awaiting_label","awaiting_shipment","return_requested","return_label"]:["draft","more_info"]}::text[]) RETURNING id`]);
 if(!results[1].length)throw new TradeError("This submission has reached its file limit or changed stage. Refresh before continuing.");
 return {id,...validated,size:file.bytes.length,kind,cardKey} satisfies TradeFile;
}
export async function deleteTradeFile(id:string,fileId:string,userId:string){
 const trade=await getTrade(id,userId);if(trade.state!=="draft")throw new TradeError("Submitted files are kept with the trade record.");
 const db=inventoryDb();const results=await db.transaction([db`SELECT id FROM ssc_trades_v3 WHERE id=${id}::uuid FOR UPDATE`,db`DELETE FROM ssc_trade_files WHERE trade_id=${id}::uuid AND id=${fileId}::uuid AND kind NOT IN ('label','return_label') AND EXISTS(SELECT 1 FROM ssc_trades_v3 WHERE id=${id}::uuid AND user_id=${userId} AND state='draft') RETURNING id`]);
 if(!results[1].length)throw new TradeError("This draft changed. Refresh before continuing.");
}
export async function downloadTradeFile(id:string,fileId:string,userId?:string){const trade=await getTrade(id,userId);const labelRows=await inventoryDb()`SELECT data FROM ssc_trade_labels WHERE trade_id=${id}::uuid AND file_id=${fileId}::uuid`;if(labelRows.some(row=>!visibleShippingDocument(row.data))||!trade.files.some(file=>file.id===fileId))throw new TradeError("File not found.");const row=(await inventoryDb()`SELECT name,mime,encode(contents,'base64') AS contents FROM ssc_trade_files WHERE trade_id=${id}::uuid AND id=${fileId}::uuid`)[0];if(!row)throw new TradeError("File not found.");return {name:row.name,mime:row.mime,bytes:Buffer.from(row.contents,"base64")};}
export async function operatorAction(trade:Trade,actor:string,body:Record<string,unknown>){
 const action=text(body.action,40,true),commandId=validId(body.requestId)?body.requestId:randomUUID();let data:Record<string,unknown>;
 if(action==="offer"){
  const version=Math.max(0,...trade.offers.map(o=>o.version))+1;
  const kind=body.kind==="inspection"?"inspection":"preliminary";
  const prior=trade.offers.find(o=>o.id===trade.currentOfferId);
  if(trade.state==="revised_offer"&&prior?.kind==="inspection"&&kind!=="inspection")throw new TradeError("Keep the revised inspection offer in the inspection stage.");
  const offer=parseOffer(body.useStandardTerms===true?{...defaultOfferInput(trade),...body}:body,randomUUID(),version,kind);
  if(trade.submission.cardCount&&offer.includedCount&&offer.includedCount>trade.submission.cardCount)throw new TradeError("The offer includes more cards than the submission.");data={...offer,shippingApproved:body.shippingApproved===true,note:offer.reason||"Preliminary offer issued."};
 }else if(action==="approve_shipping"){
  if(body.termsVerified!==true)throw new TradeError("Verify the shipping and return terms before approval.");data={direction:body.direction==="return"?"return":"inbound",termsVerified:true,approvedValueCents:trade.offers.find(o=>o.id===(body.direction==="return"?trade.acceptedOfferId:trade.currentOfferId))?.creditCents,note:"Administrator approved shipping under the recorded terms."};
 }else if(action==="label"||action==="return_label"){
  if(!validId(body.fileId)||!trade.files.some(f=>f.id===body.fileId&&f.kind===(action==="label"?"label":"return_label")))throw new TradeError("Upload the correct shipping-label PDF first.");
  const accepted=trade.offers.find(o=>o.id===trade.acceptedOfferId);
  const normalized=body.useSavedShipping===true?{service:"Service on verified provider label",sender:"Sender address on verified provider label",recipient:"Receiving address on verified provider label",package:"Package dimensions and weight on verified provider label",approvedValueCents:accepted?.creditCents,coverage:accepted?.coverage,instructions:"Pack approved slabs securely in a sturdy box. Follow the attached label’s service and signature instructions.",...body,trackingUrl:body.trackingUrl||carrierTrackingUrl(text(body.carrier,80,true),text(body.tracking,120,true))}:body;
  data={id:randomUUID(),fileId:body.fileId,direction:action==="label"?"inbound":"return",offerId:trade.acceptedOfferId,carrier:text(normalized.carrier,80,true),tracking:text(normalized.tracking,120,true),trackingUrl:safeTrackingUrl(normalized.trackingUrl),service:text(normalized.service,120,true),sender:text(normalized.sender,800,true),recipient:text(normalized.recipient,800,true),package:text(normalized.package,500,true),approvedValueCents:cents(normalized.approvedValueCents,true),coverage:text(normalized.coverage,2000,true),instructions:text(normalized.instructions,2000,true),createdAt:new Date().toISOString(),note:action==="label"?"Shipping label attached.":"Return label attached."};
  if(body.coverageVerified!==true||body.termsMatchAccepted!==true)throw new TradeError("Verify coverage and confirm the label matches the accepted shipping and return terms.");
 }else if(["request_info","stage","inspect_confirm","issue_credit","decline","inspection_decline"].includes(action)){
  data={note:text(body.note,2000,true),...(action==="inspection_decline"?{shippingApproved:body.shippingApproved===true}:{}),...(action==="stage"?{state:text(body.state,50,true)}:{})};
 }else throw new TradeError("Choose a valid trade-desk action.");
 return applyTradeCommand(trade,actor,null,action,data,commandId);
}
