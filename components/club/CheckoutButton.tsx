"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
export default function CheckoutButton({ ready, signedIn = false }: { ready: boolean; signedIn?: boolean }) {
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const requestKey = useRef<string | null>(null);
  async function checkout() {
    if (!accepted || pending) return;
    setPending(true); setError("");
    requestKey.current ||= crypto.randomUUID();
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey.current }, body: JSON.stringify({ acceptRenewal: accepted }) });
      const result = await response.json() as { url?: string; message?: string };
      if (!response.ok || !result.url) throw new Error(result.message || "Checkout could not open. Please try again.");
      const url = new URL(result.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Checkout could not open. Please try again.");
      window.location.assign(url.toString());
    } catch (e) { setError(e instanceof Error ? e.message : "Checkout could not open."); setPending(false); }
  }
  if (!ready) return signedIn ? <div className="checkout-unavailable"><p><strong>You’re part of the club.</strong><br />Your free collector account is active. Paid membership checkout is unavailable.</p><Link className="button club-wide" href="/account">Go to my account <ArrowRight size={16} /></Link><Link className="club-text-link" href="/shop">Explore the member shelf</Link><p className="club-small">No paid subscription has been created.</p></div> : <div className="checkout-unavailable"><p><strong>Join the club today.</strong><br />Create your free collector account and make yourself at home.</p><Link className="button club-wide" href="/sign-up">Create your account <ArrowRight size={16} /></Link><p className="club-small">Free account. No payment details required.</p><Link className="club-text-link" href="/sign-in">Already have an account? Sign in</Link></div>;
  if (!signedIn) return <div className="checkout-unavailable"><p>Sign in to connect the test membership to your account.</p><Link className="button club-wide" href="/sign-in">Sign in to continue <ArrowRight size={16} /></Link><Link className="club-text-link" href="/sign-up">Create a free account</Link></div>;
  return <div className="checkout-controls"><div className="club-notice"><p><strong>Test checkout.</strong> No real money will be charged, and this does not create a live membership.</p></div><label className="club-consent"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /><span>I agree to the <Link href="/membership/terms">test membership terms</Link> and understand this test subscription renews at $99 USD/year until canceled.</span></label><button className="button club-wide" type="button" onClick={checkout} disabled={!accepted || pending}>{pending ? "Opening secure checkout…" : "Try test checkout"}<ArrowRight size={16} /></button><p className="club-small"><LockKeyhole size={12} /> Secure checkout hosted by Stripe. Test cards only.</p>{error && <p className="club-form-error" role="alert">{error}</p>}</div>;
}
