import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import { ClubHeader, ClubFooter } from "./ClubShell";
import { authConfigured } from "../../lib/auth-config";
export default function AuthPage({ signup = false }: { signup?: boolean }) {
  return <><ClubHeader /><main className="section-shell club-auth-layout"><section><p className="eyebrow">Your collector account</p><h1>{signup ? <>Make yourself<br /><em>at home.</em></> : <>Welcome back<br /><em>to the club.</em></>}</h1><p>{signup ? "Create your account. Keep your membership and your next find in one place." : "Sign in to your account to see membership status and manage billing."}</p><div className="club-notice"><p>An account is free. Paid membership is separate and remains in test mode.</p></div></section><section className="club-auth-form" aria-label={signup ? "Create an account" : "Sign in"}>{authConfigured() ? <Suspense fallback={<p role="status">Loading secure sign-in…</p>}>{signup ? <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/account" /> : <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/account" />}</Suspense> : <div className="club-panel"><h2>Sign-in is being connected.</h2><p>Account authentication is not enabled on this deployment. You are browsing as a guest.</p><Link className="button" href="/shop">Explore the shelf</Link></div>}</section></main><ClubFooter /></>;
}
