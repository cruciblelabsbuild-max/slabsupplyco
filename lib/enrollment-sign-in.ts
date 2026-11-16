// Route enrollment transfers through the dedicated sign-in page, preserving checkout intent.
export function enrollmentSignInUrl(next?: string) {
  return `/sign-in?checkout=continue${next === "trades" ? "&next=trades" : ""}`;
}
export function existingAccountError(errors: readonly unknown[] | null | undefined) {
  return Boolean(errors?.some(error => error && typeof error === "object" && "code" in error &&
    (error.code === "form_identifier_exists" || error.code === "identifier_already_signed_up")));
}
