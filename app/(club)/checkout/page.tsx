import {getMember} from "../../../lib/member-session";
import {membershipForUser} from "../../../lib/member-subscription";
import BagCheckout from "../../../components/club/BagCheckout";
export const dynamic="force-dynamic";
export const metadata={title:"Your bag · Slab Supply Co.",robots:{index:false,follow:false}};
export default async function CheckoutPage({searchParams}:{searchParams:Promise<{continue?:string;canceled?:string;card?:string}>}){
 const member=await getMember();const params=await searchParams;
 const membership=member?await membershipForUser(member.id):null;
 return <BagCheckout active={membership?.state==="active-test"} autoContinue={params.continue==="1"} canceled={params.canceled} initialSlug={params.card}/>;
}
