import { ClubFooter, ClubHeader } from "../../components/club/ClubShell";
export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return <><a className="skip-link" href="#club-main">Skip to content</a><ClubHeader /><main id="club-main" className="club-main">{children}</main><ClubFooter /></>;
}
