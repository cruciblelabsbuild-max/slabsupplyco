import {redirect} from 'next/navigation';
import {requireMember} from '../../../../lib/member-session';
import {activationStatus} from '../../../../lib/membership-activation';
import MembershipActivation from '../../../../components/club/MembershipActivation';
export const dynamic='force-dynamic';
export const metadata={title:'Your membership · Slab Supply Co.',robots:{index:false,follow:false}};
export default async function WelcomePage({searchParams}:{searchParams:Promise<{session_id?:string}>}){const member=await requireMember(),{session_id=''}=await searchParams;let state:Parameters<typeof MembershipActivation>[0]['initialState']='processing';try{state=(await activationStatus(member.id,session_id)).state;}catch{/* Keep a single stable processing state while Stripe recovers. */}if(state==='entered')redirect('/account');return <MembershipActivation sessionId={session_id} initialState={state}/>;}
