import { isClerkAPIResponseError } from "@clerk/backend/errors";
// A session token can briefly outlive its user after account deletion.
// Only a confirmed missing user becomes signed out; service failures still surface.
export async function resolveSessionUser<T>(lookup:()=>Promise<T|null>):Promise<T|null>{
 try { return await lookup(); }
 catch(error){
  if(isClerkAPIResponseError(error) && error.status===404)return null;
  throw error;
 }
}
