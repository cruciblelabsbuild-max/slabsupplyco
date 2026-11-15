import { redirect } from "next/navigation";
import { getMember } from "../lib/member-session";
import HomeLanding from "./HomeLanding";
export default async function HomePage() {
  if (await getMember()) redirect("/account");
  return <HomeLanding />;
}
