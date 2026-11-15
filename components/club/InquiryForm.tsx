"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
export default function InquiryForm({ kind }: { kind: "trade" | "note" }) {
  const startedAt = useRef(0);
  useEffect(() => { startedAt.current = Date.now(); }, []);
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (state === "sending") return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setState("sending"); setMessage("");
    try {
      const response = await fetch(kind === "trade" ? "/api/trade-in" : "/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, consent: data.consent === "on", startedAt: startedAt.current }) });
      const body = await response.json() as { message?: string };
      if (!response.ok) throw new Error(body.message || "We couldn’t send this just now. Please try again.");
      setState("success"); setMessage(body.message || "Thanks—your submission has been saved.");
    } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again."); }
  }
  if (state === "success") return <div className="club-form-success" role="status"><Check size={32} /><h2>{kind === "trade" ? "Your cards are on our radar." : "Your note is on its way."}</h2><p>{message}</p><button className="club-text-link" type="button" onClick={() => { setState("idle"); startedAt.current = Date.now(); }}>Send another {kind === "trade" ? "submission" : "note"} <ArrowRight size={14} /></button></div>;
  return <form className="club-inquiry-form" onSubmit={submit}><div className="club-form-row"><label>First name<input name="firstName" autoComplete="given-name" required maxLength={60} /></label><label>Email<input name="email" type="email" autoComplete="email" required maxLength={160} /></label></div><div className="club-honeypot" aria-hidden="true"><label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label></div>{kind === "trade" ? <><div className="club-form-row"><label>Grading service<select name="grader" required defaultValue=""><option value="" disabled>Select a grader</option>{["PSA", "CGC", "BGS", "Other / mixed"].map(v => <option key={v}>{v}</option>)}</select></label><label>Estimated total value<select name="estimatedValue" required defaultValue=""><option value="" disabled>Select a range</option>{["Under $250", "$250–$1,000", "$1,000–$5,000", "$5,000+", "Not sure yet"].map(v => <option key={v}>{v}</option>)}</select></label></div><label>When are you looking to trade?<select name="timeframe" required defaultValue=""><option value="" disabled>Select a timeframe</option><option>When the desk opens</option><option>Within a few months</option><option>Just exploring</option></select></label><label>Tell us about your cards<textarea name="cardDetails" required minLength={12} maxLength={1200} rows={5} placeholder="Card names, sets, years, grading service, grades, and slab condition." /></label><p className="club-small">Please don’t include certification numbers or sensitive personal details. Don’t ship anything before receiving and accepting a written quote.</p></> : <label>Your note<textarea name="message" required minLength={8} maxLength={1600} rows={6} placeholder="A question, a card you’d love to see, or something we could do better…" /></label>}<label className="club-consent"><input name="consent" type="checkbox" required /><span>I agree to receive email about this {kind === "trade" ? "trade-in request" : "note"}. Read our <a href="/privacy">privacy notice</a>.</span></label><button className="button club-wide" disabled={state === "sending"}>{state === "sending" ? "Sending…" : kind === "trade" ? "Send trade-in interest" : "Send your note"}<ArrowRight size={16} /></button>{message && <p className="club-form-error" role="alert">{message}</p>}</form>;
}
