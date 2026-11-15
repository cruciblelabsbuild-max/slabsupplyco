import Link from "next/link";
import { ArrowRight } from "lucide-react";
export const metadata = { title: "Grail releases · Slab Supply Co." };
export default function DropsPage() {
return <><section className="club-page-intro section-shell"><p className="eyebrow">Grail releases</p><h1>A little rarer.<br/><em>A lot to love.</em></h1><p>Release times, card details, and member prices. One place for every drop.</p></section><section className="section-shell club-section-bottom"><div className="club-curated-empty"><p className="eyebrow">Release calendar</p><h2>No releases scheduled.</h2><p>There are no open releases or reservations.</p><Link className="button" href="/shop">View member deals <ArrowRight size={16}/></Link><Link className="club-text-link" href="/account">Back to your club</Link></div></section></>;
}
