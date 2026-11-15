import type { Metadata } from "next";
import Catalog from "../../../components/club/Catalog";
export const metadata: Metadata = { title: "The member shelf · Slab Supply Co." };
export default function ShopPage() {
  return <><section className="club-page-intro section-shell"><p className="eyebrow">The member shelf</p><h1>Good cards.<br /><em>Better economics.</em></h1><p>Vintage icons, modern favorites, and a few unexpected finds. This is the kind of shelf we’re building for the club.</p></section><section className="section-shell club-section-bottom"><div className="club-notice"><span className="status-dot" /><p><strong>A look at what’s to come.</strong> These cards and prices are reference examples, not live inventory. No card purchases are open yet.</p></div><Catalog /><p className="club-footnote">Reference snapshot: November 15, 2026. Prices, availability, and exact copies will be confirmed when each drop opens. Membership does not reserve a card.</p></section></>;
}
