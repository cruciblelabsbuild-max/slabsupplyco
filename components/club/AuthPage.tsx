import Link from "next/link";
import MemberSignIn from "./MemberSignIn";
import { Suspense } from "react";
import { ClubHeader,ClubFooter } from "./ClubShell";
import {authConfigured} from "../../lib/auth-config";
export default function AuthPage({next="home",enrollment=false,card}:{next?:"home"|"trades";enrollment?:boolean;card?:string}){return <><ClubHeader/><main className="auth-screen section-shell"><p className="eyebrow">Member sign-in</p><h1>Welcome back.</h1><section className="auth-provider" aria-label="Sign in">{authConfigured()?<Suspense fallback={<p role="status">Loading secure sign-in…</p>}><MemberSignIn next={next} enrollment={enrollment} card={card}/></Suspense>:<p>Sign-in is unavailable. <Link href="/membership">View membership</Link></p>}</section></main><ClubFooter/></>;}
