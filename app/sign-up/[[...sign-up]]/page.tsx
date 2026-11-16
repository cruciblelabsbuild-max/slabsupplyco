import {redirect} from "next/navigation";
import {safeCardSlug} from "../../../lib/card-intent";
export default async function SignUpPage({searchParams}:{searchParams:Promise<{next?:string;card?:string}>}){
 const {next,card}=await searchParams;
 const query=new URLSearchParams({identity:"sign-up"});
 if(next==="trades")query.set("next",next);
 const slug=safeCardSlug(card);if(slug)query.set("card",slug);
 redirect(`/join?${query}`);
}
