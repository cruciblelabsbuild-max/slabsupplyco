"use client";
import { useSignUp } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { enrollmentSignInUrl, existingAccountError } from "../../lib/enrollment-sign-in";

// Observe Clerk's enrollment errors without looking up or exposing account emails ourselves.
export default function ExistingAccountRedirect({ next }: { next?: "trades" }) {
  const { errors } = useSignUp();
  const router = useRouter();
  const exists = existingAccountError(errors.raw) || existingAccountError(Object.values(errors.fields));
  useEffect(() => {
    if (exists) router.replace(enrollmentSignInUrl(next));
  }, [exists, next, router]);
  return null;
}
