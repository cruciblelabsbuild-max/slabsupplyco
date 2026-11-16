import {inventorySnapshot} from "../../../lib/inventory";
import Catalog from "../../../components/club/Catalog";
import { memberSelection } from "../../../lib/member-selection";
import { getMember } from "../../../lib/member-session";
import { membershipForUser } from "../../../lib/member-subscription";
export const dynamic = "force-dynamic";
export const metadata = { title: "Member deals · Slab Supply Co." };
export default async function ShopPage() {
  const stock=await inventorySnapshot().catch(()=>[]);
  const selection=memberSelection.filter(card=>!stock.some(item=>item.slug===card.slug&&item.status==="sold"));
  const member = await getMember();
  const hasAccess = Boolean(member && (await membershipForUser(member.id)).state === "active-test");
  return <><section className="club-page-intro section-shell selection-heading"><p className="eyebrow">The member selection</p><h1>Member deals.</h1></section><section className="section-shell club-section-bottom"><Catalog selection={selection} hasAccess={hasAccess} /></section></>;
}
