import {TradeError,text} from "./model";
export const maxTradeFileBytes=3*1024*1024;
export const maxSubmissionFiles=30;
export function validateTradeFile(name:string,bytes:Uint8Array,label=false){
 if(!bytes.length||bytes.length>maxTradeFileBytes)throw new TradeError("Each file must be no larger than 3 MB.");
 const fileName=text(name,180,true).replace(/[\\/]/g,"-");const buffer=Buffer.from(bytes),ext=fileName.split(".").pop()?.toLowerCase();
 if(label){if(ext!=="pdf"||buffer.subarray(0,5).toString()!=="%PDF-")throw new TradeError("Attach the provider’s PDF shipping label.");return {name:fileName,mime:"application/pdf"};}
 if(["jpg","jpeg"].includes(ext||"")&&buffer[0]===255&&buffer[1]===216&&buffer[2]===255)return {name:fileName,mime:"image/jpeg"};
 if(ext==="png"&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {name:fileName,mime:"image/png"};
 if(ext==="webp"&&buffer.subarray(0,4).toString()==="RIFF"&&buffer.subarray(8,12).toString()==="WEBP")return {name:fileName,mime:"image/webp"};
 if(ext==="csv"){
  let value:string;try{value=new TextDecoder("utf-8",{fatal:true}).decode(buffer);}catch{throw new TradeError("Upload a UTF-8 CSV collection list.");}if(value.includes("\0")||!value.trim()||/<(?:html|script|svg)/i.test(value))throw new TradeError("Upload a UTF-8 CSV collection list.");
  return {name:fileName,mime:"text/csv"};
 }
 if(ext==="xlsx"){
  const end=buffer.lastIndexOf(Buffer.from([80,75,5,6]));if(end<0||end+22>buffer.length)throw new TradeError("Upload a valid XLSX workbook.");
  const entries=buffer.readUInt16LE(end+10);let offset=buffer.readUInt32LE(end+16),expanded=0;const names:string[]=[];
  if(entries<3||entries>1500)throw new TradeError("This workbook is too complex. Export a CSV list instead.");
  for(let i=0;i<entries;i++){
   if(offset+46>buffer.length||buffer.readUInt32LE(offset)!==0x02014b50)throw new TradeError("Upload a valid XLSX workbook.");
   expanded+=buffer.readUInt32LE(offset+24);const length=buffer.readUInt16LE(offset+28),extra=buffer.readUInt16LE(offset+30),comment=buffer.readUInt16LE(offset+32);
   const entry=buffer.subarray(offset+46,offset+46+length).toString();if(expanded>20*1024*1024||entry.includes("..")||entry.startsWith("/")||/vbaProject|externalLinks|embeddings|\.bin$/i.test(entry))throw new TradeError("Export a simple XLSX or CSV card list without macros, embedded files, or external links.");names.push(entry);offset+=46+length+extra+comment;
  }
  if(!names.includes("[Content_Types].xml")||!names.includes("xl/workbook.xml")||!names.some(n=>/^xl\/worksheets\/sheet\d+\.xml$/.test(n)))throw new TradeError("Upload a valid XLSX collection list.");
  return {name:fileName,mime:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"};
 }
 throw new TradeError("Use JPG, PNG, WEBP, CSV, or XLSX files.");
}
export function safeTrackingUrl(value:unknown){
 let url:URL;try{url=new URL(text(value,500,true));}catch{throw new TradeError("Use an HTTPS tracking link from the carrier’s official website.");}const hosts=["ups.com","usps.com","fedex.com","dhl.com","dhl.de","canadapost-postescanada.ca","royalmail.com","auspost.com.au","parcelforce.com"];
 if(url.protocol!=="https:"||url.username||url.password||!hosts.some(h=>url.hostname===h||url.hostname.endsWith("."+h)))throw new TradeError("Use an HTTPS tracking link from the carrier’s official website.");return url.toString();
}
