import AuthPage from "../../../components/club/AuthPage";
export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in · Slab Supply Co.", robots: { index: false, follow: false } };
export default async function SignInPage({searchParams}:{searchParams:Promise<{next?:string;checkout?:string}>}) { const {next,checkout}=await searchParams;return <AuthPage enrollment={checkout==="continue"} next={next==="trades"?"trades":"home"}/>; }
