import Logo from "../../app/Logo";
export default function MemberLoading({fullScreen=false}:{fullScreen?:boolean}){
 return <div className={fullScreen?"member-loading member-loading-full":"member-loading"} role="status" aria-live="polite"><div className="member-loading-emblem"><span className="member-loading-orbit" aria-hidden="true"/><Logo href="/account"/></div>{fullScreen&&<h1>Welcome back.</h1>}<div className="member-loading-dots" aria-hidden="true"><i/><i/><i/></div><span className="sr-only">Loading your member home.</span></div>;
}
