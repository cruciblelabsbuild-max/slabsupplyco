// The sample assortment is enabled explicitly on review deployments only.
export function selectionPreviewEnabled(env: Record<string, string | undefined> = process.env) {
  return env.VERCEL_ENV !== "production" && (env.MEMBER_SELECTION_PREVIEW === "1" || env.VERCEL_GIT_COMMIT_REF === "preview/member-experience");
}
