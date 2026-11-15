import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slab Supply Co. — Graded cards, better economics",
  description: "Early access for an independent graded-card buying club built around below-retail member pricing and transparent trade-in credit.",
  metadataBase: new URL("https://slab-supply-early-access.jonathan-br-garcia.chatgpt.site"),
  openGraph: {
    title: "Slab Supply Co. — A better way to collect.",
    description: "Join early access for a new graded-card buying club.",
    type: "website",
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
