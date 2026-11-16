"use client";
import { enrollmentArrivalUrl } from "../../lib/member-arrival";
import { ClerkProvider, useUser } from "@clerk/nextjs";
import { createContext, useContext, useEffect } from "react";
type JoinDetails = { firstName: string; emailAddress: string; interest: string; collectingFocus: string; consent: boolean };
const Availability = createContext(false);
const InitialIdentity = createContext<string | null>(null);
export const useInitialIdentity = () => useContext(InitialIdentity);
const Signup = createContext<(details: JoinDetails) => Promise<void>>(async () => { window.location.assign("/sign-up"); });
export const useIdentityEnabled = () => useContext(Availability);
export const useStartSignup = () => useContext(Signup);
function SignupBridge({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  useEffect(() => {
    if (!user) return;
    let value: string | null = null;
    try { value = sessionStorage.getItem("ssc_join_preferences"); } catch { return; }
    if (!value) return;
    fetch("/api/account/preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: value }).then(response => { if (response.ok) sessionStorage.removeItem("ssc_join_preferences"); }).catch(() => {});
  }, [user]);
  async function signup(details: JoinDetails) {
    const preferences = { interest: details.interest, collectingFocus: details.collectingFocus, consent: details.consent };
    try { sessionStorage.setItem("ssc_join_preferences", JSON.stringify(preferences)); } catch { /* Account creation still works when browser storage is unavailable. */ }
    try { sessionStorage.setItem("ssc_join_details", JSON.stringify({ firstName:details.firstName, emailAddress:details.emailAddress })); } catch { /* Enrollment still works without prefill. */ }
    window.location.assign("/join");
  }
  return <Signup.Provider value={signup}>{children}</Signup.Provider>;
}
export default function IdentityProvider({ enabled, initialName = null, children }: { enabled: boolean; initialName?: string | null; children: React.ReactNode }) {
  return <InitialIdentity.Provider value={initialName}><Availability.Provider value={enabled}>{enabled ? <ClerkProvider dynamic signInUrl="/sign-in" signUpUrl="/sign-up" signInFallbackRedirectUrl="/member-entry" signUpFallbackRedirectUrl={enrollmentArrivalUrl()} afterSignOutUrl="/" localization={{ signIn: { start: { title: "Member sign-in", subtitle: "Welcome back to Slab Supply Co." } }, signUp: { start: { title: "Become a member", subtitle: "Welcome to Slab Supply Co." } } }} appearance={{ variables: { colorPrimary: "#30325c", colorBackground: "#fffdf9", colorForeground: "#26253d", fontFamily: "Manrope, sans-serif", borderRadius: "6px" } }}><SignupBridge>{children}</SignupBridge></ClerkProvider> : children}</Availability.Provider></InitialIdentity.Provider>;
}
