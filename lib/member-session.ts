import { cache } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { authConfigured } from "./auth-config";
export const getMember = cache(async () => {
  if (!authConfigured()) return null;
  const user = await currentUser();
  if (!user) return null;
  const email = user.emailAddresses.find(address => address.id === user.primaryEmailAddressId && address.verification?.status === "verified");
  return { id: user.id, name: user.firstName || "Collector", email: email?.emailAddress || null };
});
export async function requireMember() {
  const member = await getMember();
  if (!member) redirect("/sign-in");
  return member;
}
