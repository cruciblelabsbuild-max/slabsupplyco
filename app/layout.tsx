import PageMotion from "../components/club/PageMotion";
import { getMember } from "../lib/member-session";
import IdentityProvider from "../components/club/IdentityProvider";
import { authConfigured } from "../lib/auth-config";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slab Supply Co. — Graded cards, better economics",
  description: "Early access for an independent graded-card membership built around below-retail member pricing and transparent trade-in credit.",
  metadataBase: new URL("https://slabsupplyco.vercel.app"),
  openGraph: {
    title: "Slab Supply Co. — A better way to collect.",
    description: "Join early access for a new graded-card membership.",
    type: "website",
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const member = await getMember();
  return <html lang="en" data-scroll-behavior="smooth"><head><link rel="preload" href="/fonts/manrope-400.ttf" as="font" type="font/ttf" crossOrigin="anonymous"/><link rel="preload" href="/fonts/manrope-700.ttf" as="font" type="font/ttf" crossOrigin="anonymous"/><link rel="preload" href="/fonts/fraunces-600.ttf" as="font" type="font/ttf" crossOrigin="anonymous"/></head><body><IdentityProvider enabled={authConfigured()} initialName={member?.name ?? null}><PageMotion/>{children}</IdentityProvider></body></html>;
}