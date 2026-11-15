export function asText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value) && value.length <= 160;
}

export function validFormTiming(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  const age = Date.now() - value;
  return age >= 800 && age < 86_400_000;
}

export async function ipFingerprint(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const bytes = new TextEncoder().encode(`slab-supply:${ip.trim()}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

export function cutoffSqlDate(hoursAgo: number) {
  return new Date(Date.now() - hoursAgo * 3_600_000).toISOString().slice(0, 19).replace("T", " ");
}

export function referralCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes).map((byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 10).toUpperCase();
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}
