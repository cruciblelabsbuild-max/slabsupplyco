import {membershipForUser} from "../lib/member-subscription";
import { redirect } from "next/navigation";
import { getMember } from "../lib/member-session";
import HomeLanding from "./HomeLanding";
export default async function HomePage() {
  const member=await getMember();
  if(member)redirect((await membershipForUser(member.id)).state==="active-test"?"/account":"/join?checkout=continue");
  return <HomeLanding />;
}
