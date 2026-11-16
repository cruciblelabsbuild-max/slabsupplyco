import Link from "next/link";
import {clerkClient} from "@clerk/nextjs/server";
import {tradeActor} from "../../../lib/trades/access";
import {listTrades} from "../../../lib/trades/store";
import AdminLogin,{AdminExit} from "../../../components/trades/AdminLogin";
import AdminDesk from "../../../components/trades/AdminDesk";
import styles from "../../../components/trades/trades.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Trade desk · Slab Supply Co.",robots:{index:false,follow:false}};
export default async function TradeAdmin(){
 const actor=await tradeActor();if(!actor)return <AdminLogin/>;
 if(!actor.admin)return <main className={styles.adminLogin}><h1>Admin access required.</h1><p>This sign-in does not have trade-desk permissions.</p><AdminExit/><p><Link href="/account">Member home</Link></p></main>;
 let trades;try{trades=await listTrades();}catch{trades=null;}
 if(!trades)return <main className={styles.adminLogin}><h1>Trade desk unavailable.</h1><p>Trade records could not be loaded. Please refresh.</p><AdminExit/></main>;
 const ids=[...new Set(trades.map(t=>t.userId))];const users=ids.length?(await(await clerkClient()).users.getUserList({userId:ids,limit:100})).data:[];
 const members=Object.fromEntries(users.map(user=>[user.id,[user.firstName,user.lastName].filter(Boolean).join(" ")+" · "+(user.emailAddresses.find(e=>e.id===user.primaryEmailAddressId)?.emailAddress||user.id)]));
 return <main className={styles.adminShell}><header className={styles.adminTop}><div><Link href="/">Slab Supply Co.</Link><h1>Trade desk</h1></div><nav><Link href="/account">Member home</Link><AdminExit/></nav></header><AdminDesk initialTrades={trades} members={members}/></main>;
}
