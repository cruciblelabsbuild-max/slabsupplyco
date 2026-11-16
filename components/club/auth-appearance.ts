import type { ComponentProps } from "react";
import type { SignIn } from "@clerk/nextjs";

// Use Clerk's supported appearance API for both enrollment and returning members.
export const authAppearance = {
  theme: "simple",
  options: {
    elevation: "flush",
    animations: false,
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "blockButton",
  },
  elements: {
    rootBox: { width: "100%", maxWidth: "100%" },
    cardBox: { width: "100%", maxWidth: "100%", boxShadow: "none", border: "none", borderRadius: 0, background: "transparent" },
    card: { width: "100%", padding: 0, boxShadow: "none", border: "none", background: "transparent" },
    header: { display: "none" },
    main: { gap: "20px" },
    form: { gap: "20px" },
    formField: { gap: "8px" },
    formFieldLabel: { fontSize: "12px", fontWeight: 600, color: "#26253d" },
    formFieldInput: { minHeight: "46px", fontSize: "16px", border: "1px solid #d8d5d2", borderRadius: "4px", background: "#fffdf9", boxShadow: "none" },
    formButtonPrimary: { minHeight: "46px", fontSize: "13px", fontWeight: 700, borderRadius: "4px", background: "#30325c", backgroundImage: "none", boxShadow: "none" },
    socialButtonsBlockButton: { minHeight: "46px", border: "1px solid #d8d5d2", borderRadius: "4px", background: "#fffdf9", boxShadow: "none" },
    socialButtonsBlockButtonText: { fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap" },
    footer: { background: "transparent", padding: "16px 0 0", gap: "16px" },
    footerAction: { padding: "0", justifyContent: "center" },
    footerActionText: { fontSize: "12px" },
    footerActionLink: { fontSize: "12px", color: "#30325c" },
  },
} satisfies NonNullable<ComponentProps<typeof SignIn>["appearance"]>;
