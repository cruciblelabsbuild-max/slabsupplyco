import {clerkClient} from "@clerk/nextjs/server";
import {getMember} from "../member-session";
export function isTradeAdmin(metadata:Record<string,unknown>){return metadata.tradeAdmin===true;}
export async function tradeActor(){const member=await getMember();if(!member)return null;const user=await(await clerkClient()).users.getUser(member.id);return {member,user,admin:isTradeAdmin(user.privateMetadata)};}
