import Link from "next/link";
import { authAppearance } from "./auth-appearance";
import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import { ClubHeader,ClubFooter } from "./ClubShell";
import {authConfigured} from "../../lib/auth-config";
export default function AuthPage(){return <><ClubHeader/><main className="auth-screen section-shell"><p className="eyebrow">Member sign-in</p><h1>Welcome back.</h1><section className="auth-provider" aria-label="Sign in">{authConfigured()?<Suspense fallback={<p role="status">Loading secure sign-in…</p>}><SignIn routing="path" path="/sign-in" signUpUrl="/join" forceRedirectUrl="/account" appearance={authAppearance}/></Suspense>:<p>Sign-in is unavailable. <Link href="/membership">View membership</Link></p>}</section></main><ClubFooter/></>;}
