// The return URL is not proof of payment. Only a matching Stripe session can
// confirm a completed test payment, and it never grants live member access.
export function checkoutStatus(session: {
  mode: string | null;
  metadata: Record<string, string> | null;
  livemode: boolean;
  status: string | null;
  payment_status: string;
  subscription: string | { status: string } | null;
}) {
  const subscription = typeof session.subscription === "object" ? session.subscription : null;
  const ours = session.mode === "subscription" && session.metadata?.membership === "founding-annual" && session.metadata?.phase === "test" && !session.livemode;
  const paid = ours && session.status === "complete" && session.payment_status === "paid" && subscription?.status === "active";
  const pending = ours && session.status === "complete" && !paid && (!subscription || ["active", "incomplete", "trialing"].includes(subscription.status));
  return { paid: Boolean(paid), pending };
}
