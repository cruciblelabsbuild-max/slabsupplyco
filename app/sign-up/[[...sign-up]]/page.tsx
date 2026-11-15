import AuthPage from "../../../components/club/AuthPage";
export const dynamic = "force-dynamic";
export const metadata = { title: "Join the club · Slab Supply Co.", robots: { index: false, follow: false } };
export default function SignUpPage() { return <AuthPage signup />; }
