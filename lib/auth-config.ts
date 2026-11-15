export function authConfigured(env: Record<string, string | undefined> = process.env) {
  return Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_") && env.CLERK_SECRET_KEY?.startsWith("sk_"));
}
