type BillingPeriod = {
  cancel_at: number | null;
  cancel_at_period_end: boolean;
  items: { data: { current_period_end: number; price: { recurring?: { interval: string } | null } }[] };
};
const validTimestamp = (value: number | null | undefined): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value * 1000 <= 8640000000000000;

/** Use Stripe's actual subscription item period, never an assumed year from signup. */
export function membershipPeriod(subscription: BillingPeriod) {
  const item = subscription.items.data.find(item => item.price.recurring?.interval === "year") || subscription.items.data[0];
  const periodEnd = validTimestamp(item?.current_period_end) ? item.current_period_end : null;
  const cancellation = validTimestamp(subscription.cancel_at) ? subscription.cancel_at : null;
  return cancellation || subscription.cancel_at_period_end
    ? { renewsAt: null, activeUntil: cancellation || periodEnd }
    : { renewsAt: periodEnd, activeUntil: periodEnd };
}
