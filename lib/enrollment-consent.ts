export const enrollmentTermsVersion = "annual-99-v1";
export function hasRecentEnrollmentConsent(value: unknown, now = Date.now()) {
  if (!value || typeof value !== "object") return false;
  const consent = value as Record<string, unknown>;
  return consent.version === enrollmentTermsVersion && typeof consent.at === "number" && Number.isFinite(consent.at) && now >= consent.at && now - consent.at < 30 * 60 * 1000;
}
