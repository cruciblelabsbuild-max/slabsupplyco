"use client";
import { ClerkProvider, useClerk, useUser } from "@clerk/nextjs";
import { createContext, useContext, useEffect } from "react";
type JoinDetails = { firstName: string; emailAddress: string; interest: string; collectingFocus: string; consent: boolean };
const Availability = createContext(false);
const Signup = createContext<(details: JoinDetails) => Promise<void>>(async () => { window.location.assign("/sign-up"); });
export const useIdentityEnabled = () => useContext(Availability);
export const useStartSignup = () => useContext(Signup);
function SignupBridge({ children }: { children: React.ReactNode }) {
  const clerk = useClerk();
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
    if (user) { window.location.assign("/account"); return; }
    await clerk.redirectToSignUp({ initialValues: { firstName: details.firstName, emailAddress: details.emailAddress } });
  }
  return <Signup.Provider value={signup}>{children}</Signup.Provider>;
}
export default function IdentityProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  return <Availability.Provider value={enabled}>{enabled ? <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" signInFallbackRedirectUrl="/account" signUpFallbackRedirectUrl="/account" afterSignOutUrl="/" localization={{ signIn: { start: { title: "Sign in to the club", subtitle: "Welcome back to Slab Supply Co." } }, signUp: { start: { title: "Create your collector account", subtitle: "Welcome to Slab Supply Co." } } }} appearance={{ variables: { colorPrimary: "#30325c", colorBackground: "#fffdf9", colorForeground: "#26253d", fontFamily: "Manrope, sans-serif", borderRadius: "6px" } }}><SignupBridge>{children}</SignupBridge></ClerkProvider> : children}</Availability.Provider>;
}
