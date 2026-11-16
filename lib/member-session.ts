import { headers } from "next/headers";
import { publicGuestHeader } from "./public-guest";
import { cache } from "react";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { authConfigured } from "./auth-config";
import { resolveSessionUser } from "./session-user";
import { resolveMemberName } from "./member-name";
import { getStripe } from "./stripe";
export const getMember = cache(async () => {
  if (!authConfigured() || (await headers()).get(publicGuestHeader) === "1") return null;
  const user = await resolveSessionUser(currentUser);
  if (!user) return null;
  const email = user.emailAddresses.find(address => address.id === user.primaryEmailAddressId && address.verification?.status === "verified");
  const name = await resolveMemberName(user, {
    billingName: async (customerId, userId) => {
      const customer = await getStripe().customers.retrieve(customerId);
      return !customer.deleted && !customer.livemode && customer.metadata.clerk_user_id === userId ? customer.name ?? null : null;
    },
    saveFirstName: async (userId, firstName) => (await clerkClient()).users.updateUser(userId, { firstName }),
  });
  return { id: user.id, name, email: email?.emailAddress || null };
});
export async function requireMember() {
  const member = await getMember();
  if (!member) redirect("/sign-in");
  return member;
}
