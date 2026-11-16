import Link from "next/link";
import { ArrowRight } from "lucide-react";
export const metadata = { title: "Member deals · Slab Supply Co." };
export default function ShopPage() {
return <><section className="club-page-intro section-shell"><p className="eyebrow">Member deals</p><h1>Good cards.<br/><em>Better prices.</em></h1><p>The membership’s selection, all in one place.</p></section><section className="section-shell club-section-bottom"><div className="club-curated-empty"><p className="eyebrow">The member selection</p><h2>Nothing on the shelf today.</h2><p>No cards are available to purchase right now.</p><Link className="button" href="/trade-ins">Visit the trade-in desk <ArrowRight size={16}/></Link><Link className="club-text-link" href="/account">Back to your membership</Link></div></section></>;
}
