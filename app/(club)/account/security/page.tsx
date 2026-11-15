import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";
import { requireMember } from "../../../../lib/member-session";
export const dynamic = "force-dynamic";
export const metadata = { title: "Sign-in security · Slab Supply Co.", robots: { index: false, follow: false } };
export default async function SecurityPage(){await requireMember();return <section className="section-shell club-section-bottom"><div className="club-page-intro"><p className="eyebrow">Sign-in & security</p><h1>Keep your club<br/><em>yours.</em></h1><Link className="club-text-link" href="/account/profile">← Back to your profile</Link></div><UserProfile routing="hash"/></section>;}
