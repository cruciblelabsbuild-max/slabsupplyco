"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
export default function BuyCardButton({ slug, hasAccess, autoContinue = false }: { slug: string; hasAccess: boolean; autoContinue?: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);
  async function buy() {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/cards/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
      const result = await response.json() as {url?:string;message?:string};
      if (response.status === 401 || response.status === 400) { window.location.assign(`/join?card=${slug}`); return; }
      if (!response.ok || !result.url) throw new Error(result.message || "Checkout could not open.");
      const url = new URL(result.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Checkout could not open.");
      window.location.assign(url.toString());
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); setPending(false); }
  }
  useEffect(() => {
    if (autoContinue && hasAccess && !started.current) { started.current = true; void buy(); }
  // The checkout intent is consumed once on entry, never on a render or state update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoContinue, hasAccess]);
  return <div className="card-buy-control">{hasAccess ? <button type="button" className="button club-wide" disabled={pending} onClick={()=>void buy()}>{pending ? "Opening checkout…" : "Buy now"}<ArrowRight size={15}/></button> : <Link className="button club-wide" href={`/join?card=${slug}`}>Buy now<ArrowRight size={15}/></Link>}{error && <p className="club-form-error" role="alert">{error}</p>}</div>;
}
