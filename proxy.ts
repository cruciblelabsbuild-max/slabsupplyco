import { clerkMiddleware } from "@clerk/nextjs/server";

import { NextResponse, NextRequest, type NextFetchEvent } from "next/server";
import { authConfigured } from "./lib/auth-config";
import { isPublicGuestRequest, publicGuestHeader } from "./lib/public-guest";
const clerk = clerkMiddleware();
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const headers = new Headers(request.headers);
  // Never trust a client-supplied hint about whether authentication ran.
  headers.delete(publicGuestHeader);
  // These endpoints authenticate with a Stripe signature, same-origin bag cookie, or worker token.
  if (["/api/stripe/webhook", "/api/bag", "/api/internal/shipping"].includes(request.nextUrl.pathname)) return NextResponse.next({request:{headers}});
  if (isPublicGuestRequest(request)) {
    headers.set(publicGuestHeader, "1");
    return NextResponse.next({request:{headers}});
  }
  const sanitized = new NextRequest(request, {headers});
  return authConfigured() ? clerk(sanitized, event) : NextResponse.next({request:{headers}});
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
