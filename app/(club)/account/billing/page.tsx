import { redirect } from "next/navigation";
import { requireMember } from "../../../../lib/member-session";
export default async function BillingPage(){await requireMember();redirect("/account/profile#membership");}
