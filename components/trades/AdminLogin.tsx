"use client";
import {SignIn,SignOutButton} from "@clerk/nextjs";
import AuthCompletionBridge from "../club/AuthCompletionBridge";
import Link from "next/link";
import styles from "./trades.module.css";
export function AdminExit(){return <SignOutButton redirectUrl="/trade-admin"><button className={styles.textButton}>Sign out</button></SignOutButton>;}
export default function AdminLogin(){return <main className={styles.adminLogin}><Link href="/">Slab Supply Co.</Link><h1>Trade desk sign-in</h1><AuthCompletionBridge destination="/trade-admin"/><SignIn routing="path" path="/trade-admin" forceRedirectUrl="/trade-admin" appearance={{elements:{socialButtons:"hidden",dividerRow:"hidden",footerAction:"hidden"}}}/></main>;}
