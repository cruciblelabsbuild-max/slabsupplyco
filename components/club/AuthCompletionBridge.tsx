"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
// OAuth can activate the browser session while a pre-auth server tree is still
// mounted. Wait for the session token, then request a fresh authenticated tree.
export default function AuthCompletionBridge({ destination }: { destination: string }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const started = useRef(false);
  useEffect(() => {
    if (!isLoaded || !isSignedIn || started.current) return;
    started.current = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function finish(attempt = 0) {
      try {
        const token = await getToken({ skipCache: true });
        if (!token) throw new Error("Session is not ready.");
        window.location.replace(destination);
      } catch {
        if (attempt < 2) timer = setTimeout(() => void finish(attempt + 1), 500);
        else started.current = false;
      }
    }
    void finish();
    return () => { if (timer) clearTimeout(timer); };
  }, [isLoaded, isSignedIn, getToken, destination]);
  return null;
}
