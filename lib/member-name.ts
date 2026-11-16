/** Never infer a person's name from an email address or another customer's data. */
export function cleanMemberName(value:unknown):string|null {
 if(typeof value!=="string")return null;
 const name=value.trim().replace(/\s+/g," ");
 return name.length>0&&name.length<=160&&!/[\u0000-\u001f\u007f]/.test(name)?name:null;
}
export function identityFirstName(user:{firstName?:string|null;fullName?:string|null;externalAccounts?:{firstName?:string|null}[]}):string|null {
 return cleanMemberName(user.firstName)
  ||user.externalAccounts?.map(account=>cleanMemberName(account.firstName)).find(Boolean)
  ||cleanMemberName(user.fullName)?.split(" ")[0]||null;
}
export async function resolveMemberName(user:{id:string;firstName?:string|null;fullName?:string|null;externalAccounts?:{firstName?:string|null}[];privateMetadata:Record<string,unknown>},services:{billingName:(customerId:string,userId:string)=>Promise<string|null>;saveFirstName:(userId:string,name:string)=>Promise<unknown>}):Promise<string> {
 const identity=identityFirstName(user);
 let name=identity;
 if(!name&&typeof user.privateMetadata.stripeTestCustomerId==="string"){
  try{name=cleanMemberName(await services.billingName(user.privateMetadata.stripeTestCustomerId,user.id))?.split(" ")[0]||null;}catch{/* A billing outage must not prevent sign-in. */}
 }
 if(name&&!cleanMemberName(user.firstName)){
  try{await services.saveFirstName(user.id,name);}catch{/* Use the verified name even if profile synchronization needs a retry. */}
 }
 return name||"Collector";
}
