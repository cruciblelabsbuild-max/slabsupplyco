import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClubFooter, ClubHeader } from "../components/club/ClubShell";
export default function NotFound() {
  return <><ClubHeader /><main className="section-shell club-result"><p className="eyebrow">A little off the shelf · 404</p><h1>Let’s find<br /><em>your next stop.</em></h1><p>This page isn’t available. Head back to the shelf or get in touch if you were looking for something specific.</p><div className="club-result-actions"><Link className="button" href="/shop"><ArrowLeft size={16} /> Back to the shelf</Link><Link className="button club-button-outline" href="/help">Get a little help</Link></div></main><ClubFooter /></>;
}
