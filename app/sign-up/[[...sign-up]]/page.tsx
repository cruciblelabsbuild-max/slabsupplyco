import {redirect} from "next/navigation";
import {safeCardSlug} from "../../../lib/card-intent";
export default async function SignUpPage({searchParams}:{searchParams:Promise<{next?:string;card?:string;bag?:string}>}){
 const {next,card,bag}=await searchParams;
 const query=new URLSearchParams({identity:"sign-up"});
 if(next==="trades")query.set("next",next);
 if(bag==="1")query.set("bag","1");
 const slug=safeCardSlug(card);if(slug)query.set("card",slug);
 redirect(`/join?${query}`);
}
