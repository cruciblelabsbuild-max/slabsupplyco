import MembershipActions from "./MembershipActions";
import { annualMembership } from "../../lib/membership-plan";
import Link from "next/link";
import { ArrowUpRight, Gem } from "lucide-react";
export default function ProfileMembership({state,hasBilling=false,renewsAt,activeUntil}:{renewsAt?:number|null;activeUntil?:number|null;hasBilling?:boolean;state:"active-test"|"none"|"unavailable";portalUrl:string|null}){
 const active=state==="active-test";
 const timestamp=renewsAt||activeUntil;
 const date=timestamp?new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(timestamp*1000)):null;
 return <section className="profile-membership" id="membership"><div><p className="eyebrow">Membership</p><h2>Annual membership</h2></div><div><div className="profile-membership-status"><Gem size={23} strokeWidth={1.3}/><strong>{active?(renewsAt?"Active":`Active until ${date} · Renewal canceled`):state==="unavailable"?"Status unavailable":"Not active"}</strong></div><p>{annualMembership.display}/year</p>{active&&date&&<p className="profile-membership-date"><span>{renewsAt?"Renews on":"Active until"}</span><strong>{date}</strong></p>}{(active||state==="unavailable"||hasBilling)?<MembershipActions activeUntil={timestamp??null} canceled={active&&!renewsAt}/>:state==="none"?<Link className="button" href="/join">Activate membership<ArrowUpRight size={15}/></Link>:<p role="status">Membership settings are unavailable. Please try again.</p>}<Link className="club-text-link" href="/membership/terms">Renewal & cancellation details</Link></div></section>;
}
