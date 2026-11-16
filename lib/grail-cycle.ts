export const grailTimeZone = "America/New_York";
export function grailCycle(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {timeZone:grailTimeZone,year:"numeric",month:"2-digit"}).formatToParts(now);
  const year=Number(parts.find(p=>p.type==="year")!.value), month=Number(parts.find(p=>p.type==="month")!.value);
  const next=new Date(Date.UTC(year,month,1));
  return {current:`${year}-${String(month).padStart(2,"0")}`,next:next.toISOString().slice(0,7),nextLabel:new Intl.DateTimeFormat("en-US",{month:"long",timeZone:"UTC"}).format(next)};
}
export function dropState(stock:string, startsAt:string, endsAt:string|null, now=new Date()) {
  if(stock==="sold")return "sold-out";
  if(endsAt&&now.getTime()>=Date.parse(endsAt))return "ended";
  if(now.getTime()<Date.parse(startsAt))return "upcoming";
  if(stock==="reserved")return "reserved";
  return stock==="available"?"live":"unavailable";
}
export function maxInterestPrice(value:unknown):number|null {
  if(value===""||value===null||value===undefined)return null;
  if(typeof value!=="string"&&typeof value!=="number")throw Error("Enter a valid maximum price.");
  if(!/^\d{1,6}(\.\d{1,2})?$/.test(String(value)))throw Error("Enter a valid maximum price.");
  const cents=Math.round(Number(value)*100);
  if(cents<=0||cents>99999900)throw Error("Enter a maximum price between $0.01 and $999,999.");
  return cents;
}
export function suggestionDetails(value:unknown) {
  if(!value||typeof value!=="object")throw Error("Add the card, set, and preferred grade.");
  const data=value as Record<string,unknown>;
  const field=(key:string,max:number)=>{
    const text=typeof data[key]==="string"?data[key].trim().replace(/\s+/g," "):"";
    if(!text||text.length>max||/[\u0000-\u001f\u007f]/.test(text))throw Error("Add the card, set, and preferred grade.");return text;
  };
  return {name:field("name",120),set:field("set",120),grade:field("grade",40)};
}
