export function safeCardSlug(value: unknown): string | undefined {
  return typeof value === "string" && /^selection-[a-z0-9-]{1,100}$/.test(value) ? value : undefined;
}
export function cardQuery(value: unknown) {
  const slug = safeCardSlug(value);
  return slug ? `&card=${slug}` : "";
}
