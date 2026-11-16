import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Catalog from "../../../components/club/Catalog";
import { memberSelection } from "../../../lib/member-selection";
import { selectionPreviewEnabled } from "../../../lib/selection-preview";
import { getMember } from "../../../lib/member-session";
import { membershipForUser } from "../../../lib/member-subscription";
export const dynamic = "force-dynamic";
export const metadata = { title: "Member deals · Slab Supply Co." };
export default async function ShopPage() {
  const preview = selectionPreviewEnabled();
  const member = await getMember();
  const hasAccess = Boolean(member && (await membershipForUser(member.id)).state === "active-test");
  return <><section className="club-page-intro section-shell selection-heading"><p className="eyebrow">The member selection</p><h1>Member deals.</h1></section><section className="section-shell club-section-bottom">{preview ? <Catalog selection={memberSelection} hasAccess={hasAccess} /> : <div className="club-curated-empty"><h2>Nothing on the shelf today.</h2><p>No cards are available to purchase right now.</p><Link className="button" href="/trade-ins">Visit the trade-in desk <ArrowRight size={16} /></Link></div>}</section></>;
}
