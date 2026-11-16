import { annualMembership } from "./membership-plan";
export type BillingMode = "test" | "live";
// Live billing deliberately remains disabled during the design and test phase.
export function billingConfig(env: Record<string, string | undefined> = process.env) {
  const key = env.STRIPE_SECRET_KEY || "";
  const portalUrl = safePortalUrl(env.STRIPE_CUSTOMER_PORTAL_URL);
  const ready = key.startsWith("sk_test_") && Boolean(env.STRIPE_ANNUAL_PRICE_ID) && Boolean(portalUrl);
  return { mode: "test" as const, ready, priceId: env.STRIPE_ANNUAL_PRICE_ID || "", portalUrl };
}
export function safePortalUrl(value: string | undefined) {
  try {
    const url = new URL(value || "");
    return url.protocol === "https:" && url.hostname === "billing.stripe.com" && url.pathname.startsWith("/p/login/test_") && !url.username && !url.password ? url.toString() : null;
  } catch { return null; }
}
export function siteOrigin(env: Record<string, string | undefined> = process.env) {
  const value = env.APP_URL || "https://slabsupplyco.vercel.app";
  const url = new URL(value);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash || (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) throw new Error("APP_URL must be an HTTPS origin (or a localhost preview).");
  return url.origin;
}
export function validAnnualPrice(price: { active: boolean; currency: string; unit_amount: number | null; type: string; recurring: { interval: string; interval_count: number; usage_type: string } | null }) {
  return price.active && price.currency === annualMembership.currency && price.unit_amount === annualMembership.amountCents && price.type === "recurring" && price.recurring?.interval === "year" && price.recurring.interval_count === 1 && price.recurring.usage_type === "licensed";
}

// Explicit deployment origins only; never trust an arbitrary request Host.
export function checkoutOrigin(value: string | null, env: Record<string, string | undefined> = process.env) {
  const allowed = new Set([siteOrigin(env), "https://www.slabsupply.co", "https://slabsupply.co", "https://slabsupplyco.vercel.app"]);
  return value && allowed.has(value) ? value : null;
}
